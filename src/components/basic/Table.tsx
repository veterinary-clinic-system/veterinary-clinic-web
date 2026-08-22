import { ReactNode } from 'react';
import { Icon } from './Icon';
import { Skeleton } from './Skeleton';
import { ErrorState } from './States';
import { cn } from './utils';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
}

export type SortOrder = 'ASC' | 'DESC';

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  getRowId: (row: T) => string;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSortChange?: (sortBy: string, sortOrder: SortOrder) => void;
  page?: number;
  limit?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  /**
   * Lời gọi API đứng sau bảng đã hỏng.
   *
   * Không có cờ này thì một lần tải hỏng và một danh sách thật sự rỗng hiện ra GIỐNG
   * HỆT nhau: cùng dòng "Không có dữ liệu" giữa bảng. Trên màn hình tồn kho, đó là
   * khác biệt giữa "máy chủ không trả lời" và "kho hết sạch hàng" - hai kết luận dẫn
   * tới hai hành động hoàn toàn khác nhau.
   */
  error?: boolean;
  onRetry?: () => void;
  /**
   * Tiêu đề của trạng thái lỗi. Mặc định là câu chung của `ErrorState`.
   *
   * Đáng đặt riêng khi trên cùng một trang có nhiều bảng độc lập - hồ sơ thú cưng có
   * năm tab, mỗi tab một lời gọi API riêng. "Không tải được dữ liệu" ở đó không cho
   * bác sĩ biết thứ gì đã hỏng; "Không tải được sổ tiêm chủng" thì có.
   */
  errorTitle?: string;
  emptyMessage?: string;
  className?: string;
}

/**
 * Generic data table for both large admin lists and small embedded lists.
 *
 * Sorting and pagination are opt-in and always server-driven: clicking a sortable
 * header (or Prev/Next) never reorders/re-slices `data` itself - it only calls
 * onSortChange/onPageChange so the caller can refetch from the API with new query
 * params, matching how PaginatedResult<T> ({data, total, page, limit}, see
 * src/types/models.ts) already works across src/api/*.ts. `data` is always rendered
 * as-is, in the order it arrives.
 *
 * Omit onSortChange to render sortable-looking columns as plain static headers (no
 * click handler), and omit onPageChange to hide the pager entirely - so the same
 * component also works as a plain, fully-controlled-by-the-caller list table for small
 * embedded lists that already have all their rows in hand.
 */
export function Table<T>({
  columns,
  data,
  getRowId,
  sortBy,
  sortOrder,
  onSortChange,
  page,
  limit,
  total,
  onPageChange,
  loading = false,
  error = false,
  onRetry,
  errorTitle,
  emptyMessage = 'Không có dữ liệu',
  className,
}: TableProps<T>) {
  const sortingEnabled = Boolean(onSortChange);
  const paginationEnabled = Boolean(onPageChange);

  function handleHeaderClick(column: Column<T>) {
    if (!onSortChange || !column.sortable) return;
    const nextOrder: SortOrder = sortBy === column.key && sortOrder === 'ASC' ? 'DESC' : 'ASC';
    onSortChange(column.key, nextOrder);
  }

  const effectiveLimit = limit && limit > 0 ? limit : data.length || 1;
  const effectiveTotal = total ?? data.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / effectiveLimit));
  const currentPage = page ?? 1;

  if (error) {
    /*
      Thay CẢ bảng chứ không chỉ phần thân: giữ lại hàng tiêu đề của một bảng không có
      dữ liệu chỉ tạo ra một bộ khung rỗng trông như đang chờ, trong khi thứ người dùng
      cần lúc này là một câu giải thích và một nút bấm. Cùng cách `DataTable` làm.
    */
    return <ErrorState title={errorTitle} onRetry={onRetry} className={className} />;
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/*
        Cuộn ngang nằm TRONG khung của bảng, không ở trang: một bảng kho 12 cột ở màn
        hình 1024px vẫn phải đọc được mà không kéo cả trang sang phải.
      */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full border-collapse text-data">
          <thead>
            <tr className="border-b border-border-strong bg-surface-muted text-left">
              {columns.map((column) => {
                const isSortable = sortingEnabled && column.sortable;
                const isActive = isSortable && sortBy === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={isSortable ? (isActive ? (sortOrder === 'ASC' ? 'ascending' : 'descending') : 'none') : undefined}
                    className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted"
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => handleHeaderClick(column)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded hover:text-foreground',
                          isActive && 'text-foreground',
                        )}
                      >
                        {column.header}
                        <Icon
                          name={isActive && sortOrder === 'DESC' ? 'chevron-down' : 'chevron-right'}
                          className={cn(
                            'h-3.5 w-3.5',
                            isActive && sortOrder === 'ASC' && '-rotate-90',
                            !isActive && 'opacity-40',
                          )}
                        />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              /* Skeleton theo hình dạng hàng thật, không phải dòng chữ "Đang tải":
                 bảng giữ nguyên chiều cao nên trang không nhảy khi dữ liệu về. */
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="border-b border-border last:border-b-0">
                  <td colSpan={columns.length} className="px-3">
                    <div className="flex h-row items-center">
                      <Skeleton className="h-3.5 w-full max-w-sm" />
                    </div>
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={getRowId(row)} className="border-b border-border last:border-b-0 hover:bg-surface-muted/60">
                  {columns.map((column) => (
                    <td key={column.key} className="h-row px-3 py-2 align-middle text-foreground">
                      {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {paginationEnabled && (
        <div className="flex items-center justify-between text-sm text-muted">
          <button
            type="button"
            onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="inline-flex min-h-touch items-center gap-1 rounded-lg border border-border px-3 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon name="chevron-left" className="h-4 w-4" />
            Trước
          </button>
          <span>
            Trang {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="inline-flex min-h-touch items-center gap-1 rounded-lg border border-border px-3 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sau
            <Icon name="chevron-right" className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
