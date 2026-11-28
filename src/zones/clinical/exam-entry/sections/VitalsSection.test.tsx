import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { examinationsApi } from '@/api/examinations.api';
import { ToastProvider } from '@/components/basic';
import { MedicalRecordStatus } from '@/types/enums';
import type { MedicalRecord } from '@/types/models';
import { VitalsSection } from './VitalsSection';

vi.mock('@/api/examinations.api', () => ({
  examinationsApi: {
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/api/files.api', () => ({
  filesApi: {
    upload: vi.fn(),
  },
}));

const createExam = vi.mocked(examinationsApi.create);

const baseRecord: MedicalRecord = {
  id: 'mr-1',
  appointmentId: 'appt-1',
  petId: 'pet-1',
  doctorId: 'doc-1',
  visitReason: 'Khám tổng quát',
  generalCondition: null,
  notes: null,
  status: MedicalRecordStatus.DRAFT,
  completedAt: null,
  createdAt: '2026-11-28T08:00:00.000Z',
  examination: null,
};

function renderVitals(record: MedicalRecord = baseRecord) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <VitalsSection record={record} readOnly={false} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('VitalsSection — BUG-06 đồng bộ ngưỡng nhịp tim 20–400 bpm và số nguyên', () => {
  beforeEach(() => {
    createExam.mockResolvedValue({
      id: 'exam-1',
      appointmentId: 'appt-1',
      doctorId: 'doc-1',
      diseaseGroups: [],
      diagnosisText: null,
      notes: null,
      temperatureCelsius: null,
      weightKg: null,
      heartRateBpm: 20,
      respiratoryRateBpm: null,
      attachmentUrls: [],
      examinedAt: '2026-11-28T08:05:00.000Z',
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('cấu hình min=20, step=1 cho nhịp tim và step=1 cho nhịp thở', () => {
    renderVitals();

    const hrInput = screen.getByLabelText('Nhịp tim (lần/phút)') as HTMLInputElement;
    const rrInput = screen.getByLabelText('Nhịp thở (lần/phút)') as HTMLInputElement;

    expect(hrInput.min).toBe('20');
    expect(hrInput.max).toBe('400');
    expect(hrInput.step).toBe('1');
    expect(rrInput.min).toBe('5');
    expect(rrInput.max).toBe('200');
    expect(rrInput.step).toBe('1');
  });

  it('chặn nhịp tim hr=19 với thông báo 20 – 400 nhịp/phút và không gọi API', () => {
    renderVitals();

    fireEvent.change(screen.getByLabelText('Nhịp tim (lần/phút)'), { target: { value: '19' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu sinh hiệu' }));

    expect(screen.getByText('Nhịp tim phải nằm trong khoảng 20 – 400 nhịp/phút.')).toBeTruthy();
    expect(createExam).not.toHaveBeenCalled();
  });

  it('chặn số thập phân cho nhịp tim và nhịp thở khi người dùng gõ tay', () => {
    renderVitals();

    fireEvent.change(screen.getByLabelText('Nhịp tim (lần/phút)'), { target: { value: '80.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu sinh hiệu' }));

    expect(
      screen.getByText('Nhịp tim phải là số nguyên trong khoảng 20 – 400 nhịp/phút.'),
    ).toBeTruthy();
    expect(createExam).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Nhịp tim (lần/phút)'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Nhịp thở (lần/phút)'), { target: { value: '24.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu sinh hiệu' }));

    expect(
      screen.getByText('Nhịp thở phải là số nguyên trong khoảng 5 – 200 lần/phút.'),
    ).toBeTruthy();
    expect(createExam).not.toHaveBeenCalled();
  });

  it('cho phép lưu nhịp tim tại biên dưới hr=20', async () => {
    renderVitals();

    fireEvent.change(screen.getByLabelText('Nhịp tim (lần/phút)'), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu sinh hiệu' }));

    await vi.waitFor(() => {
      expect(createExam).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentId: 'appt-1',
          heartRateBpm: 20,
        }),
      );
    });
  });
});
