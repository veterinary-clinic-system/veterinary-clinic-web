import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/components/basic';
import { Role } from '@/types/enums';
import { StaffLayout } from './StaffLayout';

let mockUser: { sub: string; phone: string; role: Role; branchId: string | null } | null = null;
const eventHandlers = new Map<string, (data: unknown) => void>();
const mockUseRealtimeBranchRoom = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('@/api/socket', () => ({
  useRealtimeBranchRoom: (branchId: string | null | undefined, enabled?: boolean) => {
    mockUseRealtimeBranchRoom(branchId, enabled);
  },
  useRealtimeScheduling: vi.fn(),
  useRealtimeEvent: (event: string, handler: (data: unknown) => void) => {
    eventHandlers.set(event, handler);
  },
}));

vi.mock('./staff/StaffSidebar', () => ({
  StaffSidebar: () => <nav data-testid="staff-sidebar" />,
}));

vi.mock('./staff/StaffTopbar', () => ({
  StaffTopbar: () => <header data-testid="staff-topbar" />,
}));

function renderStaffLayout() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/staff/queue']}>
          <StaffLayout />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
  return { queryClient, invalidateSpy };
}

describe('StaffLayout — BUG-14 đồng bộ room chi nhánh & cảnh báo cấp cứu ĐỎ', () => {
  beforeEach(() => {
    eventHandlers.clear();
    mockUseRealtimeBranchRoom.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('gọi useRealtimeBranchRoom theo user.branchId cho nhân sự chi nhánh và bỏ qua toast/invalidate khác chi nhánh', () => {
    mockUser = { sub: 'u1', phone: '0901', role: Role.RECEPTIONIST, branchId: 'branch-1' };
    const { invalidateSpy } = renderStaffLayout();

    expect(mockUseRealtimeBranchRoom).toHaveBeenCalledWith('branch-1', true);

    const handler = eventHandlers.get('queue:emergency_red');
    expect(handler).toBeTypeOf('function');

    act(() => {
      handler?.({ petName: 'Milo', ticketNumber: 12, branchId: 'branch-2' });
    });

    expect(screen.queryByText(/Cảnh báo cấp cứu ĐỎ/)).toBeNull();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('hiển thị toast và invalidate staff-notifications* khi nhân sự cùng chi nhánh với payload.branchId', () => {
    mockUser = { sub: 'u1', phone: '0901', role: Role.DOCTOR, branchId: 'branch-1' };
    const { invalidateSpy } = renderStaffLayout();

    expect(mockUseRealtimeBranchRoom).toHaveBeenCalledWith('branch-1', true);

    const handler = eventHandlers.get('queue:emergency_red');
    act(() => {
      handler?.({ petName: 'Milo', ticketNumber: 12, branchId: 'branch-1' });
    });

    expect(
      screen.getByText('Cảnh báo cấp cứu ĐỎ (Milo) — STT 12: vui lòng ưu tiên tiếp nhận ngay!'),
    ).toBeTruthy();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['staff-notifications'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['staff-notifications-unread'] });
  });

  it('ADMIN không gắn branchId tham gia room null (branch:all) và nhận đầy đủ cảnh báo kèm invalidate thông báo', () => {
    mockUser = { sub: 'admin-1', phone: '0900', role: Role.ADMIN, branchId: null };
    const { invalidateSpy } = renderStaffLayout();

    expect(mockUseRealtimeBranchRoom).toHaveBeenCalledWith(null, true);

    const handler = eventHandlers.get('queue:emergency_red');
    act(() => {
      handler?.({ petName: 'Bông', ticketNumber: 3, branchId: 'branch-2' });
    });

    expect(
      screen.getByText('Cảnh báo cấp cứu ĐỎ (Bông) — STT 3: vui lòng ưu tiên tiếp nhận ngay!'),
    ).toBeTruthy();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['staff-notifications'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['staff-notifications-unread'] });
  });

  it('không kích hoạt join room khi chưa có user', () => {
    mockUser = null;
    renderStaffLayout();

    expect(mockUseRealtimeBranchRoom).toHaveBeenCalledWith(null, false);
  });

  it('tương thích ngược: vẫn hiển thị toast và invalidate khi payload cũ không có branchId', () => {
    mockUser = { sub: 'u1', phone: '0901', role: Role.RECEPTIONIST, branchId: 'branch-1' };
    const { invalidateSpy } = renderStaffLayout();

    const handler = eventHandlers.get('queue:emergency_red');
    act(() => {
      handler?.({ petName: 'Na', ticketNumber: 7 });
    });

    expect(
      screen.getByText('Cảnh báo cấp cứu ĐỎ (Na) — STT 7: vui lòng ưu tiên tiếp nhận ngay!'),
    ).toBeTruthy();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['staff-notifications'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['staff-notifications-unread'] });
  });
});
