import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/api/products.api';
import { ErrorState, Pagination, Select, Skeleton } from '@/components/basic';
import { ItemType } from '@/types/models';
import { flattenCategories } from '@/utils/categories';

export const PAGE_SIZE = 20;

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
