import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aiChatApi, AiChatResponse } from '@/api/prescreening.api';
import { PriorityColor } from '@/types/enums';
import { ChatPage } from './ChatPage';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/api/prescreening.api', () => ({
  aiChatApi: {
    send: vi.fn(),
  },
}));

vi.mock('@/api/files.api', () => ({
  filesApi: {
    upload: vi.fn(),
  },
}));

const sendMock = vi.mocked(aiChatApi.send);

function renderChatPage() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ChatPage — BUG-13 Phiên mới', () => {
  const createObjectUrlSpy = vi.fn(() => 'blob:preview-1');
  const revokeObjectUrlSpy = vi.fn();

  beforeEach(() => {
    sendMock.mockReset();
    createObjectUrlSpy.mockClear();
    revokeObjectUrlSpy.mockClear();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: createObjectUrlSpy,
      revokeObjectURL: revokeObjectUrlSpy,
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('reset tin nhắn, sessionId, draft, đính kèm (revokeObjectURL) và ô nhập khi đang hiện cảnh báo RED', async () => {
    const redResponse: AiChatResponse = {
      sessionId: 'sess-red-1',
      reply: 'Tình trạng nguy cấp, hãy đưa bé tới phòng khám ngay.',
      intent: 'TRIAGE',
      draft: { symptom: 'co giật' },
      missingFields: [],
      quickReplies: ['Đặt lịch ngay'],
      suggestBooking: true,
      requiresLogin: false,
      triage: {
        priorityColor: PriorityColor.RED,
        reasoning: 'Co giật cấp tính',
        suspectedDiseases: [],
        analyzedImages: 0,
        analyzedVideos: 0,
      },
    };
    sendMock.mockResolvedValueOnce(redResponse);

    renderChatPage();

    const input = screen.getByLabelText('Tin nhắn cho trợ lý') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Bé đang co giật' } });
    fireEvent.submit(input.closest('form')!);

    expect(
      await screen.findByText('Tình trạng nguy cấp, hãy đưa bé tới phòng khám ngay.'),
    ).toBeTruthy();

    // Chọn đính kèm và nhập dở trong phiên cũ trước khi bấm Phiên mới.
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['abc'], 'trieu-chung.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(screen.getByText('trieu-chung.jpg')).toBeTruthy();

    fireEvent.change(input, { target: { value: 'tin chưa gửi' } });
    expect(input.value).toBe('tin chưa gửi');

    // Bấm nút Phiên mới
    fireEvent.click(screen.getByRole('button', { name: /Phiên mới/i }));

    expect(screen.queryByText('Bé đang co giật')).toBeNull();
    expect(
      screen.queryByText('Tình trạng nguy cấp, hãy đưa bé tới phòng khám ngay.'),
    ).toBeNull();
    expect(screen.queryByText('trieu-chung.jpg')).toBeNull();
    expect(input.value).toBe('');
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:preview-1');
    expect(screen.getByText(/Trợ lý AI VetCare/)).toBeTruthy();

    // Lượt gửi tiếp theo không còn mang sessionId/draft của phiên cũ.
    sendMock.mockResolvedValueOnce({
      sessionId: 'sess-fresh-2',
      reply: 'Chào bạn ở phiên mới.',
      intent: 'GREETING',
      draft: {},
      missingFields: [],
      quickReplies: [],
      suggestBooking: false,
      requiresLogin: false,
    });
    fireEvent.change(input, { target: { value: 'Xin chào phiên mới' } });
    fireEvent.submit(input.closest('form')!);

    expect(await screen.findByText('Chào bạn ở phiên mới.')).toBeTruthy();
    expect(sendMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        sessionId: undefined,
        draft: undefined,
        message: 'Xin chào phiên mới',
      }),
      expect.anything(),
    );
  });

  it('bỏ qua response muộn từ request in-flight của phiên trước sau khi bấm Phiên mới', async () => {
    let resolveStale!: (value: AiChatResponse) => void;
    sendMock.mockImplementationOnce(
      () =>
        new Promise<AiChatResponse>((resolve) => {
          resolveStale = resolve;
        }),
    );

    renderChatPage();

    const input = screen.getByLabelText('Tin nhắn cho trợ lý') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Câu hỏi phiên cũ' } });
    fireEvent.submit(input.closest('form')!);

    expect(await screen.findByText('Câu hỏi phiên cũ')).toBeTruthy();

    // Reset ngay khi request phiên cũ chưa phản hồi.
    fireEvent.click(screen.getByRole('button', { name: /Phiên mới/i }));
    expect(screen.queryByText('Câu hỏi phiên cũ')).toBeNull();

    // Response muộn từ phiên cũ trả về -> phải bị bỏ qua hoàn toàn.
    resolveStale({
      sessionId: 'sess-stale',
      reply: 'Phản hồi muộn từ phiên cũ',
      intent: 'TRIAGE',
      draft: { stale: true },
      missingFields: [],
      quickReplies: [],
      suggestBooking: false,
      requiresLogin: false,
    });

    await waitFor(() => {
      expect(screen.queryByText('Phản hồi muộn từ phiên cũ')).toBeNull();
    });

    // Gửi tin ở phiên mới vẫn sạch sessionId/draft.
    sendMock.mockResolvedValueOnce({
      sessionId: 'sess-new',
      reply: 'Phản hồi phiên mới',
      intent: 'GREETING',
      draft: {},
      missingFields: [],
      quickReplies: [],
      suggestBooking: false,
      requiresLogin: false,
    });
    fireEvent.change(input, { target: { value: 'Câu hỏi phiên mới' } });
    fireEvent.submit(input.closest('form')!);

    expect(await screen.findByText('Phản hồi phiên mới')).toBeTruthy();
    expect(screen.queryByText('Phản hồi muộn từ phiên cũ')).toBeNull();
    expect(sendMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        sessionId: undefined,
        draft: undefined,
        message: 'Câu hỏi phiên mới',
      }),
      expect.anything(),
    );
  });
});
