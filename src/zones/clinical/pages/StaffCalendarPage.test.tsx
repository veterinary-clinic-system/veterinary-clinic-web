import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { appointmentsApi } from '@/api/appointments.api';
import { ToastProvider } from '@/components/basic';

import { StaffCalendarPage } from './StaffCalendarPage';

afterEach(cleanup);

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', phone: '0901234567', role: 'DOCTOR', branchId: 'b1' } }),
}));

vi.mock('@/api/branches.api', () => ({
  branchesApi: { list: vi.fn().mockResolvedValue([{ id: 'b1', branchName: 'Chi nhánh Quận 1' }]) },
}));

vi.mock('@/api/doctors.api', () => ({
  doctorsApi: {
    listPublic: vi.fn().mockResolvedValue([{ id: 'd1', fullName: 'BS. Trần Minh Đức' }]),
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
});
