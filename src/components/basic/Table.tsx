import { ReactNode } from 'react';
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

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-left">
              {columns.map((column) => {
                const isSortable = sortingEnabled && column.sortable;
                const isActive = isSortable && sortBy === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={isSortable ? (isActive ? (sortOrder === 'ASC' ? 'ascending' : 'descending') : 'none') : undefined}
                    className="px-3 py-2 font-medium text-foreground"
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => handleHeaderClick(column)}
                        className="inline-flex items-center gap-1 rounded hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {column.header}
                        <span className="text-muted" aria-hidden="true">
                          {isActive ? (sortOrder === 'ASC' ? '▲' : '▼') : '↕'}
                        </span>
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
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-muted">
                  Đang tải...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={getRowId(row)} className="border-b border-border last:border-b-0 hover:bg-surface-muted/50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-3 py-2 text-foreground">
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
            className="rounded border border-border px-3 py-1.5 hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Trước
          </button>
          <span>
            Trang {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="rounded border border-border px-3 py-1.5 hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
