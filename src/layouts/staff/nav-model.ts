import { IconName } from '@/components/basic';
import { Role, STAFF_ROLES } from '@/types/enums';
import {
  CLINIC_ROLES,
  COUNTER_ROLES,
  CUSTOMER_ROLES,
  MANAGEMENT_ROLES,
  SYSTEM_ROLES,
  WAREHOUSE_ROLES,
} from '@/types/permission-groups';

const NON_DOCTOR_ROLES = STAFF_ROLES.filter((role) => role !== Role.DOCTOR);

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  roles?: Role[];
  
  end?: boolean;
}

export interface NavGroup {
  
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
      { to: '/staff/customers', label: 'Khách hàng', icon: 'customers', roles: CUSTOMER_ROLES },
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
      
      { to: '/staff/reports', label: 'Báo cáo', icon: 'chart', roles: MANAGEMENT_ROLES },
    ],
  },
  {
    label: 'Tổ chức',
    items: [
      { to: '/staff/branches', label: 'Chi nhánh', icon: 'building', roles: SYSTEM_ROLES },
      { to: '/staff/employees', label: 'Hồ sơ nhân sự', icon: 'id-card', roles: MANAGEMENT_ROLES },
      { to: '/staff/users', label: 'Tài khoản', icon: 'user-cog', roles: SYSTEM_ROLES },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      
      { to: '/staff/permissions', label: 'Phân quyền', icon: 'shield', roles: SYSTEM_ROLES },
      
      { to: '/staff/audit-logs', label: 'Nhật ký kiểm toán', icon: 'history', roles: SYSTEM_ROLES },
    ],
  },
];

export function navGroupsFor(role: Role | undefined): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || (role && item.roles.includes(role))),
  })).filter((group) => group.items.length > 0);
}

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export const CLINICAL_HOME_ROLES = [Role.DOCTOR, Role.RECEPTIONIST];

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
