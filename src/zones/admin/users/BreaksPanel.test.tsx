import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DoctorBreak, doctorsApi } from '@/api/doctors.api';
import { ToastProvider } from '@/components/basic';
import { BreaksPanel } from './BreaksPanel';

vi.mock('@/api/doctors.api', () => ({
  doctorsApi: {
    getBreaks: vi.fn(),
    createBreak: vi.fn(),
    updateBreak: vi.fn(),
    deleteBreak: vi.fn(),
  },
}));

const getBreaks = vi.mocked(doctorsApi.getBreaks);
const createBreak = vi.mocked(doctorsApi.createBreak);
const updateBreak = vi.mocked(doctorsApi.updateBreak);
const deleteBreak = vi.mocked(doctorsApi.deleteBreak);

const sampleBreaks: DoctorBreak[] = [
  {
    id: 'brk-1',
    doctorId: 'doc-1',
    date: '2026-12-01',
    startTime: '12:00:00',
    endTime: '13:30:00',
    reason: 'Nghỉ trưa',
  },
];

function makeConflictError(message: string) {
  return new AxiosError('Conflict', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 409,
    statusText: 'Conflict',
    headers: {},
    config: {} as never,
    data: { message },
  });
}

function renderPanel(readOnly = false) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BreaksPanel doctorId="doc-1" readOnly={readOnly} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return { queryClient, invalidateSpy };
}

describe('BreaksPanel — BUG-07 CRUD lịch nghỉ ngoài lịch', () => {
  beforeEach(() => {
    getBreaks.mockResolvedValue(sampleBreaks);
    createBreak.mockResolvedValue({
      id: 'brk-2',
      doctorId: 'doc-1',
      date: '2026-12-05',
      startTime: '14:00',
      endTime: '15:00',
      reason: 'Họp chuyên môn',
    });
    updateBreak.mockResolvedValue({
      id: 'brk-1',
      doctorId: 'doc-1',
      date: '2026-12-02',
      startTime: '10:00',
      endTime: '11:30',
      reason: null,
    });
    deleteBreak.mockResolvedValue({} as never);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('tạo lịch nghỉ thành công và invalidate đồng thời doctor-breaks + 3 query lịch làm việc', async () => {
    const { invalidateSpy } = renderPanel();

    const createForm = await screen.findByRole('form', { name: 'Thêm lịch nghỉ' });
    fireEvent.change(within(createForm).getByLabelText('Ngày'), { target: { value: '2026-12-05' } });
    fireEvent.change(within(createForm).getByLabelText('Từ'), { target: { value: '14:00' } });
    fireEvent.change(within(createForm).getByLabelText('Đến'), { target: { value: '15:00' } });
    fireEvent.change(within(createForm).getByLabelText('Lý do'), { target: { value: 'Họp chuyên môn' } });
    fireEvent.click(within(createForm).getByRole('button', { name: 'Thêm lịch nghỉ' }));

    await vi.waitFor(() => {
      expect(createBreak).toHaveBeenCalledWith('doc-1', {
        date: '2026-12-05',
        startTime: '14:00',
        endTime: '15:00',
        reason: 'Họp chuyên môn',
      });
    });

    await vi.waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['doctor-breaks', 'doc-1'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['staff-calendar-week'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['staff-calendar-day'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['staff-calendar-month'] });
    });
  });

  it('chặn startTime >= endTime phía client và hiện toast lỗi tiếng Việt không gọi API', async () => {
    renderPanel();

    const createForm = await screen.findByRole('form', { name: 'Thêm lịch nghỉ' });
    fireEvent.change(within(createForm).getByLabelText('Ngày'), { target: { value: '2026-12-05' } });
    fireEvent.change(within(createForm).getByLabelText('Từ'), { target: { value: '14:00' } });
    fireEvent.change(within(createForm).getByLabelText('Đến'), { target: { value: '14:00' } });
    fireEvent.click(within(createForm).getByRole('button', { name: 'Thêm lịch nghỉ' }));

    expect(screen.getByText('Giờ kết thúc phải sau giờ bắt đầu.')).toBeTruthy();
    expect(createBreak).not.toHaveBeenCalled();

    fireEvent.change(within(createForm).getByLabelText('Đến'), { target: { value: '13:00' } });
    fireEvent.click(within(createForm).getByRole('button', { name: 'Thêm lịch nghỉ' }));
    expect(createBreak).not.toHaveBeenCalled();
  });

  it('hiển thị toast lỗi chi tiết từ BE khi gặp HTTP 409 xung đột lịch hẹn', async () => {
    createBreak.mockRejectedValueOnce(
      makeConflictError('Có 2 lịch hẹn đang hoạt động trong khung giờ nghỉ. Vui lòng chuyển hoặc hủy lịch trước.'),
    );
    renderPanel();

    const createForm = await screen.findByRole('form', { name: 'Thêm lịch nghỉ' });
    fireEvent.change(within(createForm).getByLabelText('Ngày'), { target: { value: '2026-12-05' } });
    fireEvent.change(within(createForm).getByLabelText('Từ'), { target: { value: '09:00' } });
    fireEvent.change(within(createForm).getByLabelText('Đến'), { target: { value: '10:00' } });
    fireEvent.click(within(createForm).getByRole('button', { name: 'Thêm lịch nghỉ' }));

    expect(
      await screen.findByText(
        'Có 2 lịch hẹn đang hoạt động trong khung giờ nghỉ. Vui lòng chuyển hoặc hủy lịch trước.',
      ),
    ).toBeTruthy();
  });

  it('sửa lịch nghỉ inline gọi updateBreak, chặn startTime >= endTime và invalidate lịch làm việc', async () => {
    const { invalidateSpy } = renderPanel();

    const editButton = await screen.findByRole('button', { name: 'Sửa' });
    fireEvent.click(editButton);

    const editForm = screen.getByRole('form', { name: 'Chỉnh sửa lịch nghỉ' });
    expect((within(editForm).getByLabelText('Từ') as HTMLInputElement).value).toBe('12:00');
    expect((within(editForm).getByLabelText('Đến') as HTMLInputElement).value).toBe('13:30');

    // Chặn khung giờ không hợp lệ khi sửa
    fireEvent.change(within(editForm).getByLabelText('Từ'), { target: { value: '15:00' } });
    fireEvent.change(within(editForm).getByLabelText('Đến'), { target: { value: '14:00' } });
    fireEvent.click(within(editForm).getByRole('button', { name: 'Lưu' }));
    expect(screen.getByText('Giờ kết thúc phải sau giờ bắt đầu.')).toBeTruthy();
    expect(updateBreak).not.toHaveBeenCalled();

    // Sửa hợp lệ và xóa lý do -> gửi reason: null
    fireEvent.change(within(editForm).getByLabelText('Ngày'), { target: { value: '2026-12-02' } });
    fireEvent.change(within(editForm).getByLabelText('Từ'), { target: { value: '10:00' } });
    fireEvent.change(within(editForm).getByLabelText('Đến'), { target: { value: '11:30' } });
    fireEvent.change(within(editForm).getByLabelText('Lý do'), { target: { value: '   ' } });
    fireEvent.click(within(editForm).getByRole('button', { name: 'Lưu' }));

    await vi.waitFor(() => {
      expect(updateBreak).toHaveBeenCalledWith('brk-1', {
        date: '2026-12-02',
        startTime: '10:00',
        endTime: '11:30',
        reason: null,
      });
    });

    await vi.waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['doctor-breaks', 'doc-1'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['staff-calendar-week'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['staff-calendar-day'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['staff-calendar-month'] });
    });
  });

  it('xóa lịch nghỉ có hộp thoại xác nhận, gọi deleteBreak và invalidate lịch làm việc', async () => {
    const { invalidateSpy } = renderPanel();

    const deleteButton = await screen.findByRole('button', { name: 'Xóa' });
    fireEvent.click(deleteButton);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Xóa lịch nghỉ?')).toBeTruthy();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Xóa lịch nghỉ' }));

    await vi.waitFor(() => {
      expect(deleteBreak).toHaveBeenCalledWith('brk-1');
    });

    await vi.waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['doctor-breaks', 'doc-1'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['staff-calendar-week'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['staff-calendar-day'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['staff-calendar-month'] });
    });
  });

  it('ẩn form thêm mới và nút Sửa/Xóa khi readOnly = true', async () => {
    renderPanel(true);

    expect(await screen.findByText(/Nghỉ trưa/)).toBeTruthy();
    expect(screen.queryByRole('form', { name: 'Thêm lịch nghỉ' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sửa' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Xóa' })).toBeNull();
  });
});
