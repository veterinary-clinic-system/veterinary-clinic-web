import { Category } from '@/types/models';

/**
 * Làm phẳng cây danh mục thành danh sách chọn, thụt đầu dòng theo độ sâu.
 *
 * `Select` của bộ component chỉ nhận danh sách phẳng. Thụt bằng khoảng trắng giữ được
 * quan hệ cha–con mà không phải dựng một cây chọn riêng — đúng mức đầu tư cho một ô
 * chọn danh mục.
 *
 * Để ở `utils/` chứ không cạnh trang dùng nó: cả `ProductsPage` lẫn `CatalogAdminPage`
 * đều cần, và một file trang chỉ nên xuất component (quy tắc `react-refresh`).
 */
export function flattenCategories(
  nodes: Category[],
  depth = 0,
): { value: string; label: string }[] {
  return nodes.flatMap((node) => [
    { value: node.id, label: `${'  '.repeat(depth)}${depth > 0 ? '└ ' : ''}${node.categoryName}` },
    ...flattenCategories(node.children ?? [], depth + 1),
  ]);
}
