import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/components/basic';
import { Role } from '@/types/enums';
import { StaffLayout } from './StaffLayout';

let mockUser: { sub: string; phone: string; role: Role; branchId: string | null } | null = null;
const eventHandlers = new Map<string, (data: unknown) => void>();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('@/api/socket', () => ({
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
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/staff/queue']}>
        <StaffLayout />
      </MemoryRouter>
    </ToastProvider>,
  );
}

describe('StaffLayout — BUG-14 lọc cảnh báo cấp cứu ĐỎ theo chi nhánh', () => {
  beforeEach(() => {
    eventHandlers.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('bỏ qua toast khi nhân sự thuộc chi nhánh khác với payload.branchId', () => {
    mockUser = { sub: 'u1', phone: '0901', role: Role.RECEPTIONIST, branchId: 'branch-1' };
    renderStaffLayout();

    const handler = eventHandlers.get('queue:emergency_red');
    expect(handler).toBeTypeOf('function');

    act(() => {
      handler?.({ petName: 'Milo', ticketNumber: 12, branchId: 'branch-2' });
    });

    expect(screen.queryByText(/Cảnh báo cấp cứu ĐỎ/)).toBeNull();
  });

  it('hiển thị toast khi nhân sự cùng chi nhánh với payload.branchId', () => {
    mockUser = { sub: 'u1', phone: '0901', role: Role.DOCTOR, branchId: 'branch-1' };
    renderStaffLayout();

    const handler = eventHandlers.get('queue:emergency_red');
    act(() => {
      handler?.({ petName: 'Milo', ticketNumber: 12, branchId: 'branch-1' });
    });

    expect(
      screen.getByText('Cảnh báo cấp cứu ĐỎ (Milo) — STT 12: vui lòng ưu tiên tiếp nhận ngay!'),
    ).toBeTruthy();
  });

  it('ADMIN không gắn branchId vẫn nhận đầy đủ cảnh báo từ mọi chi nhánh', () => {
    mockUser = { sub: 'admin-1', phone: '0900', role: Role.ADMIN, branchId: null };
    renderStaffLayout();

    const handler = eventHandlers.get('queue:emergency_red');
    act(() => {
      handler?.({ petName: 'Bông', ticketNumber: 3, branchId: 'branch-2' });
    });

    expect(
      screen.getByText('Cảnh báo cấp cứu ĐỎ (Bông) — STT 3: vui lòng ưu tiên tiếp nhận ngay!'),
    ).toBeTruthy();
  });

  it('tương thích ngược: vẫn hiển thị toast khi payload cũ không có branchId', () => {
    mockUser = { sub: 'u1', phone: '0901', role: Role.RECEPTIONIST, branchId: 'branch-1' };
    renderStaffLayout();

    const handler = eventHandlers.get('queue:emergency_red');
    act(() => {
      handler?.({ petName: 'Na', ticketNumber: 7 });
    });

    expect(
      screen.getByText('Cảnh báo cấp cứu ĐỎ (Na) — STT 7: vui lòng ưu tiên tiếp nhận ngay!'),
    ).toBeTruthy();
  });
});
