import { IconName } from '@/components/basic';
import { Role, STAFF_ROLES } from '@/types/enums';

/**
 * Cây điều hướng của khu nhân viên - MỘT nguồn sự thật cho sidebar, breadcrumb và
 * tiêu đề trang.
 *
 * Trước đây sidebar là một mảng phẳng 25 mục và breadcrumb thì chưa có. Kết quả: người
 * dùng phải đọc hết danh sách mới tìm được thứ cần, và không có mục nào tự nói cho biết
 * nó thuộc về đâu. Gom thành 6 nhóm không làm ngắn đi danh sách - nó làm cho việc TÌM
 * trở thành hai bước ngắn thay vì một bước dài.
 *
 * `roles` bỏ trống nghĩa là mọi vai trò nhân viên đều thấy. Danh sách vai trò ở đây bám
 * theo ma trận `role_permissions` phía backend; backend vẫn là hàng rào thật, lọc ở đây
 * chỉ để không đưa người dùng tới một trang họ chắc chắn nhận 403.
 * Xem `docs/01-thong-tin-kien-truc.md` mục 3.
 */

/** Bốn vai trò làm việc trực tiếp với bệnh nhân. */
const CLINIC_ROLES = [Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.RECEPTIONIST];
/** Bốn vai trò đứng quầy - có POS_SELL trong ma trận quyền. */
const COUNTER_ROLES = [Role.ADMIN, Role.MANAGER, Role.RECEPTIONIST, Role.STAFF];
/** Ba vai trò duy nhất có INVENTORY_IMPORT/INVENTORY_EXPORT. */
const WAREHOUSE_ROLES = [Role.ADMIN, Role.MANAGER, Role.PHARMACIST];
/** Mọi vai trò nhân viên TRỪ bác sĩ - bác sĩ không làm việc kho. */
const NON_DOCTOR_ROLES = STAFF_ROLES.filter((role) => role !== Role.DOCTOR);
const MANAGEMENT_ROLES = [Role.ADMIN, Role.MANAGER];

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  roles?: Role[];
  /** Khớp chính xác đường dẫn thay vì khớp tiền tố. Chỉ "/staff" cần. */
  end?: boolean;
}

export interface NavGroup {
  /** Nhãn nhóm. Nhóm "Tổng quan" không cần nhãn - một mục thì không phải một nhóm. */
  label?: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ to: '/staff', label: 'Tổng quan', icon: 'dashboard', end: true }],
  },
  {
    label: 'Lâm sàng',
    items: [
      { to: '/staff/queue', label: 'Hàng chờ', icon: 'queue', roles: CLINIC_ROLES },
      { to: '/staff/calendar', label: 'Lịch làm việc', icon: 'calendar', roles: CLINIC_ROLES },
      { to: '/staff/appointments', label: 'Lịch hẹn', icon: 'appointments', roles: CLINIC_ROLES },
      { to: '/staff/patients', label: 'Hồ sơ thú cưng', icon: 'paw', roles: CLINIC_ROLES },
      { to: '/staff/laboratory', label: 'Xét nghiệm', icon: 'flask', roles: CLINIC_ROLES },
      {
        to: '/staff/vaccinations/due',
        label: 'Nhắc lịch tiêm',
        icon: 'syringe',
        roles: CLINIC_ROLES,
      },
    ],
  },
  {
    label: 'Vận hành',
    items: [
      {
        to: '/staff/customers',
        label: 'Khách hàng',
        icon: 'customers',
        roles: [...CLINIC_ROLES, Role.STAFF],
      },
      { to: '/staff/catalog', label: 'Dịch vụ & thuốc', icon: 'catalog', roles: MANAGEMENT_ROLES },
      { to: '/staff/products', label: 'Sản phẩm', icon: 'box', roles: WAREHOUSE_ROLES },
      { to: '/staff/categories', label: 'Danh mục hàng hoá', icon: 'tag', roles: WAREHOUSE_ROLES },
      { to: '/staff/suppliers', label: 'Nhà cung cấp', icon: 'truck', roles: WAREHOUSE_ROLES },
      {
        to: '/staff/purchase-orders',
        label: 'Đơn đặt hàng',
        icon: 'purchase-order',
        roles: WAREHOUSE_ROLES,
      },
      { to: '/staff/goods-receipts', label: 'Nhận hàng', icon: 'inbox', roles: WAREHOUSE_ROLES },
      {
        to: '/staff/stock-takes',
        label: 'Kiểm kê',
        icon: 'clipboard-check',
        roles: WAREHOUSE_ROLES,
      },
      { to: '/staff/inventory', label: 'Tồn kho', icon: 'warehouse', roles: NON_DOCTOR_ROLES },
      {
        to: '/staff/inventory/alerts',
        label: 'Cảnh báo kho',
        icon: 'alert',
        roles: NON_DOCTOR_ROLES,
      },
      { to: '/staff/pharmacy', label: 'Quầy thuốc', icon: 'pill', roles: WAREHOUSE_ROLES },
    ],
  },
  {
    label: 'Kinh doanh',
    items: [
      { to: '/staff/pos', label: 'Bán hàng', icon: 'cart', roles: COUNTER_ROLES },
      { to: '/staff/billing', label: 'Hoá đơn', icon: 'receipt', roles: COUNTER_ROLES },
      // BR-15: chỉ Manager/Admin được xem báo cáo doanh thu.
      { to: '/staff/reports', label: 'Báo cáo', icon: 'chart', roles: MANAGEMENT_ROLES },
    ],
  },
  {
    label: 'Tổ chức',
    items: [
      { to: '/staff/branches', label: 'Chi nhánh', icon: 'building', roles: [Role.ADMIN] },
      { to: '/staff/employees', label: 'Hồ sơ nhân sự', icon: 'id-card', roles: MANAGEMENT_ROLES },
      { to: '/staff/users', label: 'Tài khoản', icon: 'user-cog', roles: [Role.ADMIN] },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      // BR-16: chỉ Admin được quản lý role và permission.
      { to: '/staff/permissions', label: 'Phân quyền', icon: 'shield', roles: [Role.ADMIN] },
      // FR-26/BR-17: `AUDIT_VIEW` trong ma trận mặc định chỉ thuộc về Admin.
      { to: '/staff/audit-logs', label: 'Nhật ký kiểm toán', icon: 'history', roles: [Role.ADMIN] },
    ],
  },
];

/**
 * Lọc cây theo vai trò và bỏ luôn những nhóm rỗng.
 *
 * Bỏ nhóm rỗng là phần dễ quên nhất: một bác sĩ đăng nhập mà vẫn thấy nhãn "HỆ THỐNG"
 * treo lơ lửng không có mục nào dưới nó thì tệ hơn là không có nhóm.
 */
export function navGroupsFor(role: Role | undefined): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || (role && item.roles.includes(role))),
  })).filter((group) => group.items.length > 0);
}

/** Mọi mục của cây, phẳng - dùng để dò breadcrumb và tiêu đề trang. */
export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

/**
 * Hai vai trò mà `/staff` là màn hình LÂM SÀNG (xem `StaffHomePage`) - với họ, trang
 * chủ cũng là một màn hình làm việc chứ không phải một bản báo cáo.
 */
export const CLINICAL_HOME_ROLES = [Role.DOCTOR, Role.RECEPTIONIST];

/**
 * Các màn hình lâm sàng - dùng để bật mật độ `compact`.
 *
 * Bác sĩ và lễ tân ở trong những màn hình này cả ngày và đọc theo kiểu quét; hàng bảng
 * thấp hơn nghĩa là nhiều bệnh nhân hơn trong một màn hình. Màn hình quản trị thì đọc
 * kỹ, ít lần, nên giữ nguyên mật độ thoáng.
 * Xem `docs/01-thong-tin-kien-truc.md` mục 5.2.
 */
const CLINICAL_PATH_PREFIXES = [
  '/staff/queue',
  '/staff/calendar',
  '/staff/appointments',
  '/staff/patients',
  '/staff/customers',
  '/staff/laboratory',
  '/staff/vaccinations',
];

export function isClinicalPath(pathname: string, role?: Role): boolean {
  if (pathname === '/staff') return Boolean(role && CLINICAL_HOME_ROLES.includes(role));
  return CLINICAL_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
