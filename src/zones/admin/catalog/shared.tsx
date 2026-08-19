import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/api/products.api';
import { ErrorState, Pagination, Select, Skeleton } from '@/components/basic';
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

/**
 * Ba trạng thái của một bảng trong tab Danh mục, vẽ dưới dạng HÀNG của `<tbody>`.
 *
 * Ba tab Dịch vụ, Thuốc và Vaccine dựng bảng bằng tay (mỗi hàng có chế độ sửa tại chỗ)
 * nên chưa dùng được `Table`. Cái giá phải trả trước đây là chúng không có trạng thái
 * nào cả: đang tải thì bảng trống, API hỏng thì cũng bảng trống, mà danh mục rỗng thật
 * thì vẫn bảng trống. Ba tình huống khác hẳn nhau, cùng một màn hình.
 *
 * Trả về `null` khi có dữ liệu - nơi gọi cứ vẽ tiếp các hàng thật ngay sau nó.
 */
export function TabTableStates({
  loading,
  error,
  onRetry,
  isEmpty,
  colSpan,
  emptyMessage = 'Chưa có dữ liệu trong danh mục này.',
}: {
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  isEmpty: boolean;
  colSpan: number;
  emptyMessage?: string;
}) {
  if (loading) {
    return (
      <>
        {Array.from({ length: 5 }).map((_, index) => (
          <tr key={`skeleton-${index}`} className="border-t border-border">
            <td colSpan={colSpan} className="px-3">
              <div className="flex h-row items-center">
                <Skeleton className="h-3.5 w-full max-w-sm" />
              </div>
            </td>
          </tr>
        ))}
      </>
    );
  }

  if (error) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-3 py-6">
          <ErrorState onRetry={onRetry} />
        </td>
      </tr>
    );
  }

  if (isEmpty) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-3 py-6 text-center text-muted">
          {emptyMessage}
        </td>
      </tr>
    );
  }

  return null;
}
