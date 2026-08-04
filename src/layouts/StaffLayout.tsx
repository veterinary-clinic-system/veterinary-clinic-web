import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types/enums';

const CLINIC_ROLES = [Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.RECEPTIONIST];
const COUNTER_ROLES = [Role.ADMIN, Role.MANAGER, Role.RECEPTIONIST, Role.STAFF];

/**
 * `roles` bỏ trống = mọi vai trò nhân viên đều thấy.
 *
 * PHARMACIST hiện chỉ thấy Tổng quan — quầy thuốc và kho là việc của Phase 6/7,
 * chưa có màn hình nào để gắn vào đây.
 */
const NAV_ITEMS: { to: string; label: string; roles?: Role[] }[] = [
  { to: '/staff', label: 'Tổng quan' },
  { to: '/staff/calendar', label: 'Lịch làm việc', roles: CLINIC_ROLES },
  { to: '/staff/queue', label: 'Hàng chờ', roles: CLINIC_ROLES },
  { to: '/staff/customers', label: 'Khách hàng', roles: [...CLINIC_ROLES, Role.STAFF] },
  { to: '/staff/patients', label: 'Hồ sơ thú cưng', roles: CLINIC_ROLES },
  { to: '/staff/appointments', label: 'Lịch hẹn', roles: CLINIC_ROLES },
  { to: '/staff/billing', label: 'Hóa đơn', roles: COUNTER_ROLES },
  // BR-15: chỉ Manager/Admin được xem báo cáo doanh thu.
  { to: '/staff/reports', label: 'Báo cáo', roles: [Role.ADMIN, Role.MANAGER] },
  { to: '/staff/catalog', label: 'Danh mục', roles: [Role.ADMIN, Role.MANAGER] },
  { to: '/staff/branches', label: 'Chi nhánh', roles: [Role.ADMIN] },
  { to: '/staff/employees', label: 'Hồ sơ nhân sự', roles: [Role.ADMIN, Role.MANAGER] },
  { to: '/staff/users', label: 'Tài khoản', roles: [Role.ADMIN] },
  { to: '/staff/permissions', label: 'Phân quyền', roles: [Role.ADMIN] },
];

/** Admin/Receptionist/Doctor management shell - "standard admin/dashboard layout" per Section 7.2. */
export function StaffLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-border bg-surface-muted p-4">
        <div className="mb-6 text-lg font-semibold">Quản lý phòng khám</div>
        <nav className="flex flex-col gap-1 text-sm">
          {NAV_ITEMS.filter((item) => !item.roles || (user && item.roles.includes(user.role))).map((item) => (
            <Link key={item.to} to={item.to} className="rounded px-3 py-2 hover:bg-surface">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-end gap-3 border-b border-border px-6 py-3 text-sm">
          <span className="text-muted">{user?.phone}</span>
          <button onClick={() => void logout()}>Đăng xuất</button>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
