import { Role } from './enums';

/**
 * Các NHÓM VAI TRÒ suy ra từ ma trận `role_permissions` phía backend.
 *
 * Trước đây mỗi nhóm được khai báo hai lần: một lần trong `layouts/staff/nav-model.ts`
 * để lọc sidebar, một lần nữa (viết thẳng ra thành mảng) trong `routes.tsx` của từng zone để
 * chặn route. Hai bản sao đã lệch nhau: sidebar giấu "Hàng chờ" khỏi dược sĩ, nhưng gõ
 * thẳng `/staff/queue` thì vẫn vào được — đúng cái mà mục 3.1 của tài liệu kiến trúc
 * nói là không được xảy ra ("không render module không có quyền").
 *
 * Đặt ở `types/` chứ không ở `layouts/`: route của zone không có lý do gì phải phụ
 * thuộc vào file dựng sidebar chỉ để biết ai được vào đâu.
 *
 * Đây vẫn là lớp TRẢI NGHIỆM. Backend mới là hàng rào thật; lọc ở đây chỉ để không đưa
 * người dùng tới một trang họ chắc chắn nhận 403.
 * Xem `docs/01-thong-tin-kien-truc.md` mục 3.2.
 */

/** Bốn vai trò làm việc trực tiếp với bệnh nhân. */
export const CLINIC_ROLES: Role[] = [Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.RECEPTIONIST];

/** Bốn vai trò đứng quầy — có `POS_SELL` trong ma trận quyền. */
export const COUNTER_ROLES: Role[] = [Role.ADMIN, Role.MANAGER, Role.RECEPTIONIST, Role.STAFF];

/** Ba vai trò duy nhất có `INVENTORY_IMPORT` / `INVENTORY_EXPORT`. */
export const WAREHOUSE_ROLES: Role[] = [Role.ADMIN, Role.MANAGER, Role.PHARMACIST];

/** Danh mục, báo cáo doanh thu, hồ sơ nhân sự — BR-15. */
export const MANAGEMENT_ROLES: Role[] = [Role.ADMIN, Role.MANAGER];

/** Chỉ quản trị hệ thống: chi nhánh, tài khoản, phân quyền, nhật ký — BR-16, BR-17. */
export const SYSTEM_ROLES: Role[] = [Role.ADMIN];

/**
 * Khách hàng và thú cưng: bốn vai trò phòng khám cộng nhân viên quầy — người bán hàng
 * cần tra cứu khách để gắn hoá đơn.
 */
export const CUSTOMER_ROLES: Role[] = [...CLINIC_ROLES, Role.STAFF];
