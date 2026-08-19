/**
 * Design system của ứng dụng - một bộ dùng chung cho CẢ HAI khung hiển thị.
 *
 * `PublicLayout` (khách vãng lai + chủ nuôi) và `StaffLayout` (lâm sàng + quản trị)
 * khác nhau ở kiến trúc thông tin và mật độ, KHÔNG khác nhau ở ngôn ngữ thị giác. Một
 * cái nút ở trang đặt lịch và cái nút ở màn hình kê đơn là cùng một component.
 *
 * Xem `docs/01-thong-tin-kien-truc.md` mục 5 để biết vì sao chia như vậy.
 */

/* Nền tảng */
export * from './Icon';
export * from './utils';

/* Nhập liệu */
export * from './Button';
export * from './Input';
export * from './Textarea';
export * from './Checkbox';
export * from './CheckboxGroup';
export * from './Select';
export * from './Combobox';
export * from './DatePicker';
export * from './SearchInput';

/* Hiển thị dữ liệu */
export * from './Avatar';
export * from './Badge';
export * from './TriageBadge';
export * from './Card';
export * from './DescriptionList';
export * from './Table';
export * from './DataTable';
export * from './Pagination';
export * from './StatTile';
export * from './Timeline';

/* Khung và điều hướng */
export * from './PageHeader';
export * from './Breadcrumb';
export * from './Tabs';

/* Lớp phủ */
export * from './Modal';
export * from './Drawer';
export * from './DropdownMenu';
export * from './ConfirmDialog';
export * from './Tooltip';
export * from './Toast';

/* Phản hồi và trạng thái */
export * from './Alert';
export * from './Skeleton';
export * from './States';
