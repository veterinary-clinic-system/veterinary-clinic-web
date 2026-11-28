import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentsApi } from '@/api/appointments.api';
import { doctorsApi, usersApi } from '@/api/doctors.api';
import { ToastProvider } from '@/components/basic';

import { StaffCalendarPage } from './StaffCalendarPage';

let mockUser = { id: 'u1', phone: '0901234567', role: 'DOCTOR', branchId: 'b1' };

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('@/api/branches.api', () => ({
  branchesApi: { list: vi.fn().mockResolvedValue([{ id: 'b1', branchName: 'Chi nhánh Quận 1' }]) },
}));

vi.mock('@/api/doctors.api', () => ({
  doctorsApi: {
    listPublic: vi.fn(),
    getBreaks: vi.fn(),
    createBreak: vi.fn(),
    updateBreak: vi.fn(),
    deleteBreak: vi.fn(),
  },
  usersApi: {
    me: vi.fn(),
  },
}));

vi.mock('@/api/appointments.api', () => ({
  appointmentsApi: {
    staffCalendar: vi.fn(),
    staffDayCalendar: vi.fn(),
    staffMonthCalendar: vi.fn(),
  },
}));

const staffCalendar = vi.mocked(appointmentsApi.staffCalendar);
const listPublicDoctors = vi.mocked(doctorsApi.listPublic);
const getBreaks = vi.mocked(doctorsApi.getBreaks);
const getMe = vi.mocked(usersApi.me);

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter>
          <StaffCalendarPage />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('StaffCalendarPage', () => {
  beforeEach(() => {
    mockUser = { id: 'u1', phone: '0901234567', role: 'DOCTOR', branchId: 'b1' };
    listPublicDoctors.mockResolvedValue([
      {
        id: 'd1',
        fullName: 'BS. Trần Minh Đức',
        avatarUrl: '',
        yearOfStart: 2020,
        specialization: [],
        branch: { id: 'b1', branchName: 'Chi nhánh Quận 1' },
      },
      {
        id: 'd2',
        fullName: 'BS. Lê Thị Lan',
        avatarUrl: '',
        yearOfStart: 2021,
        specialization: [],
        branch: { id: 'b1', branchName: 'Chi nhánh Quận 1' },
      },
    ]);
    getMe.mockResolvedValue({
      id: 'u1',
      fullName: 'BS. Trần Minh Đức',
      phone: '0901234567',
      email: null,
      avatarUrl: '',
      role: 'DOCTOR' as never,
      branchId: 'b1',
      active: true,
    });
    getBreaks.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('lịch hỏng nói ra là hỏng, không nói là lịch trống', async () => {
    staffCalendar.mockRejectedValue(new Error('Network Error'));
    renderPage();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Không tải được lịch làm việc');

    expect(alert.textContent).toContain('KHÔNG có nghĩa là lịch trống');
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy();
  });

  it('tuần rỗng thật thì vẽ lưới, không báo lỗi', async () => {
    staffCalendar.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText('Lịch làm việc')).toBeTruthy();
    await vi.waitFor(() => expect(staffCalendar).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('mở modal Nghỉ ngoài lịch (BreaksPanel) cho bác sĩ đang chọn và vô hiệu hóa khi không có doctorId', async () => {
    staffCalendar.mockResolvedValue([]);
    renderPage();

    const breaksBtn = await screen.findByRole('button', { name: 'Nghỉ ngoài lịch' });
    await vi.waitFor(() => expect((breaksBtn as HTMLButtonElement).disabled).toBe(false));

    fireEvent.click(breaksBtn);
    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(await screen.findByText('Nghỉ ngoài lịch — BS. Trần Minh Đức')).toBeTruthy();
    await vi.waitFor(() => expect(getBreaks).toHaveBeenCalledWith('d1'));

    fireEvent.click(screen.getAllByRole('button', { name: 'Đóng' })[0]);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('vô hiệu hóa nút Nghỉ ngoài lịch khi chi nhánh chưa có bác sĩ (!doctorId)', async () => {
    mockUser = { id: 'u2', phone: '0909999999', role: 'RECEPTIONIST', branchId: 'b1' };
    listPublicDoctors.mockResolvedValueOnce([]);
    renderPage();

    const breaksBtn = await screen.findByRole('button', { name: 'Nghỉ ngoài lịch' });
    await vi.waitFor(() => expect((breaksBtn as HTMLButtonElement).disabled).toBe(true));
  });
});
