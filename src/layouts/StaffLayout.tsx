import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { NotificationBell } from '@/components/NotificationBell';
import { Role, STAFF_ROLES } from '@/types/enums';

const CLINIC_ROLES = [Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.RECEPTIONIST];
const COUNTER_ROLES = [Role.ADMIN, Role.MANAGER, Role.RECEPTIONIST, Role.STAFF];
/** Ba vai trò duy nhất có INVENTORY_IMPORT/INVENTORY_EXPORT trong ma trận quyền. */
const WAREHOUSE_ROLES = [Role.ADMIN, Role.MANAGER, Role.PHARMACIST];
/** Mọi vai trò nhân viên TRỪ bác sĩ - dùng cho các mục kho không liên quan tới họ. */
const NON_DOCTOR_ROLES = STAFF_ROLES.filter((role) => role !== Role.DOCTOR);

/**
 * `roles` bỏ trống = mọi vai trò nhân viên đều thấy.
 *
 * PHARMACIST thấy Tổng quan, ba màn hình danh mục hàng hoá (P5) và toàn bộ nhóm kho
 * (P6). Quầy thuốc là việc của Phase 7.
 */
const NAV_ITEMS: { to: string; label: string; roles?: Role[] }[] = [
  { to: '/staff', label: 'Tổng quan' },
  { to: '/staff/calendar', label: 'Lịch làm việc', roles: CLINIC_ROLES },
  { to: '/staff/queue', label: 'Hàng chờ', roles: CLINIC_ROLES },
  { to: '/staff/customers', label: 'Khách hàng', roles: [...CLINIC_ROLES, Role.STAFF] },
  { to: '/staff/patients', label: 'Hồ sơ thú cưng', roles: CLINIC_ROLES },
  { to: '/staff/appointments', label: 'Lịch hẹn', roles: CLINIC_ROLES },
  // P9: cùng nhóm vai trò phòng khám - ma trận quyền cho cả bốn LABORATORY_VIEW và
  // VACCINATION_VIEW. Lễ tân là người gọi nhắc lịch tiêm nên phải thấy hai mục này.
  { to: '/staff/laboratory', label: 'Xét nghiệm', roles: CLINIC_ROLES },
  { to: '/staff/vaccinations/due', label: 'Nhắc lịch tiêm', roles: CLINIC_ROLES },
  { to: '/staff/pos', label: 'Bán hàng', roles: COUNTER_ROLES },
  { to: '/staff/billing', label: 'Hóa đơn', roles: COUNTER_ROLES },
  // BR-15: chỉ Manager/Admin được xem báo cáo doanh thu.
  { to: '/staff/reports', label: 'Báo cáo', roles: [Role.ADMIN, Role.MANAGER] },
  { to: '/staff/catalog', label: 'Dịch vụ & Thuốc', roles: [Role.ADMIN, Role.MANAGER] },
  // PHARMACIST có CATALOG_MANAGE trong ma trận quyền nên thấy được ba màn hình danh
  // mục hàng hoá, dù chưa thấy các màn hình phòng khám.
  {
    to: '/staff/products',
    label: 'Sản phẩm',
    roles: [Role.ADMIN, Role.MANAGER, Role.PHARMACIST],
  },
  {
    to: '/staff/categories',
    label: 'Danh mục hàng hoá',
    roles: [Role.ADMIN, Role.MANAGER, Role.PHARMACIST],
  },
  {
    to: '/staff/suppliers',
    label: 'Nhà cung cấp',
    roles: [Role.ADMIN, Role.MANAGER, Role.PHARMACIST],
  },
  // Quầy thuốc (P7) - cùng nhóm vai trò với kho: chỉ ADMIN/MANAGER/PHARMACIST có
  // PRESCRIPTION_DISPENSE hoặc quyền giám sát tương ứng.
  { to: '/staff/pharmacy', label: 'Quầy thuốc', roles: WAREHOUSE_ROLES },
  // Kho (P6). Ma trận quyền cho MỌI vai trò nhân viên `INVENTORY_VIEW`, nhưng bác sĩ
  // không làm việc kho nên hai mục này bị loại khỏi nav của họ theo phản hồi nghiệm
  // thu. Quyền backend giữ nguyên - đây chỉ là dọn nav.
  { to: '/staff/inventory', label: 'Tồn kho', roles: NON_DOCTOR_ROLES },
  { to: '/staff/inventory/alerts', label: 'Cảnh báo kho', roles: NON_DOCTOR_ROLES },
  { to: '/staff/purchase-orders', label: 'Đơn đặt hàng', roles: WAREHOUSE_ROLES },
  { to: '/staff/goods-receipts', label: 'Nhận hàng', roles: WAREHOUSE_ROLES },
  { to: '/staff/stock-takes', label: 'Kiểm kê', roles: WAREHOUSE_ROLES },
  { to: '/staff/branches', label: 'Chi nhánh', roles: [Role.ADMIN] },
  { to: '/staff/employees', label: 'Hồ sơ nhân sự', roles: [Role.ADMIN, Role.MANAGER] },
  { to: '/staff/users', label: 'Tài khoản', roles: [Role.ADMIN] },
  { to: '/staff/permissions', label: 'Phân quyền', roles: [Role.ADMIN] },
  // FR-26/BR-17: `AUDIT_VIEW` trong ma trận mặc định chỉ thuộc về Admin.
  { to: '/staff/audit-logs', label: 'Nhật ký kiểm toán', roles: [Role.ADMIN] },
];

/** Admin/Receptionist/Doctor management shell - "standard admin/dashboard layout" per Section 7.2. */
export function StaffLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface">
        <Link to="/staff" className="flex items-center gap-2 border-b border-border px-4 py-4 text-base font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            🐾
          </span>
          Quản lý phòng khám
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3 text-sm">
          {NAV_ITEMS.filter((item) => !item.roles || (user && item.roles.includes(user.role))).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/staff'}
              className={({ isActive }) =>
                'rounded-lg px-3 py-2 transition-colors ' +
                (isActive
                  ? 'bg-primary/10 font-semibold text-primary'
                  : 'text-foreground hover:bg-surface-muted')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-end gap-3 border-b border-border bg-surface px-6 py-3 text-sm">
          <NotificationBell />
          <span className="text-muted">{user?.phone}</span>
          <button onClick={() => void logout()} className="text-muted hover:text-foreground">
            Đăng xuất
          </button>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
