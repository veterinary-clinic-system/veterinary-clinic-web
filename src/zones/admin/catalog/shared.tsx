import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/api/products.api';
import { Pagination, Select } from '@/components/basic';
import { ItemType } from '@/types/models';
import { flattenCategories } from '@/utils/categories';

/**
 * Số dòng mỗi trang cho mọi bảng của Danh mục.
 *
 * Trước đây cả năm tab gọi API với `limit: 100` rồi vẽ thẳng toàn bộ kết quả: không có
 * thanh phân trang nào (phản hồi nghiệm thu: "Tất cả danh sách phải được hiển thị dưới
 * dạng phân trang"), và tệ hơn là dòng thứ 101 trở đi biến mất không một dấu hiệu.
 * Giờ mỗi tab phân trang phía MÁY CHỦ, nên không còn trần cứng nữa.
 */
export const PAGE_SIZE = 20;

/** Thanh phân trang dùng chung - đổi `total` của API sang số trang. */
export function TabPagination({
  page,
  total,
  onPageChange,
}: {
  page: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <Pagination
      page={page}
      totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
      onPageChange={onPageChange}
      total={total}
    />
  );
}

/**
 * Ô chọn danh mục dùng chung cho tab Dịch vụ, tab Thuốc và tab Vaccine.
 *
 * Dùng `Select` với cây đã làm phẳng (thụt đầu dòng theo độ sâu) thay vì `Combobox`
 * như kế hoạch phase gợi ý: cùng cách đã dùng ở `ProductsPage`, và danh mục của một
 * phòng khám là hàng chục dòng chứ không hàng nghìn nên chưa cần ô tìm kiếm. Đổi sang
 * Combobox sau này chỉ phải sửa đúng ở đây.
 */
export function CategorySelect({
  itemType,
  value,
  onChange,
  label = 'Danh mục',
}: {
  itemType: ItemType;
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const query = useQuery({
    queryKey: ['categories', itemType],
    queryFn: () => categoriesApi.tree({ itemType }),
  });
  return (
    <Select
      label={label}
      value={value}
      onChange={onChange}
      options={[
        { value: '', label: '— Chưa phân loại —' },
        ...flattenCategories(query.data ?? []),
      ]}
    />
  );
}
