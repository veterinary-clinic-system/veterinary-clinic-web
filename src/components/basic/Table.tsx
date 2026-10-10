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
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
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
  error?: boolean;
  onRetry?: () => void;
  errorTitle?: string;
  emptyMessage?: string;
  className?: string;
  minWidth?: string;
}

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
  minWidth,
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
    return <ErrorState title={errorTitle} onRetry={onRetry} className={className} />;
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Table view */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
        <table
          className="w-full min-w-full border-collapse text-data"
          style={minWidth ? { minWidth } : undefined}
        >
          <thead>
            <tr className="border-b border-border-strong bg-surface-muted text-left">
              {columns.map((column) => {
                const isSortable = sortingEnabled && column.sortable;
                const isActive = isSortable && sortBy === column.key;
                const alignClass =
                  column.align === 'right'
                    ? 'text-right'
                    : column.align === 'center'
                      ? 'text-center'
                      : 'text-left';

                return (
                  <th
                    key={column.key}
                    scope="col"
                    style={{
                      width: column.width,
                      minWidth: column.minWidth,
                    }}
                    aria-sort={
                      isSortable
                        ? isActive
                          ? sortOrder === 'ASC'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                        : undefined
                    }
                    className={cn(
                      'px-3.5 py-3 text-xs font-semibold uppercase tracking-wide text-muted whitespace-nowrap',
                      alignClass,
                      column.headerClassName,
                    )}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => handleHeaderClick(column)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded hover:text-foreground whitespace-nowrap transition-colors',
                          column.align === 'right' && 'flex-row-reverse',
                          column.align === 'center' && 'justify-center',
                          isActive && 'text-foreground font-bold',
                        )}
                      >
                        <span>{column.header}</span>
                        <Icon
                          name={isActive && sortOrder === 'DESC' ? 'chevron-down' : 'chevron-right'}
                          className={cn(
                            'h-3.5 w-3.5 transition-transform',
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
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="border-b border-border last:border-b-0">
                  <td colSpan={columns.length} className="px-3.5">
                    <div className="flex h-row items-center">
                      <Skeleton className="h-3.5 w-full max-w-sm" />
                    </div>
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3.5 py-8 text-center text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={getRowId(row)}
                  className="border-b border-border last:border-b-0 transition-colors hover:bg-surface-muted/60"
                >
                  {columns.map((column) => {
                    const alignClass =
                      column.align === 'right'
                        ? 'text-right'
                        : column.align === 'center'
                          ? 'text-center'
                          : 'text-left';

                    return (
                      <td
                        key={column.key}
                        style={{
                          width: column.width,
                          minWidth: column.minWidth,
                        }}
                        className={cn(
                          'h-row px-3.5 py-2.5 align-middle text-foreground',
                          alignClass,
                          column.className,
                        )}
                      >
                        {column.render
                          ? column.render(row)
                          : String((row as Record<string, unknown>)[column.key] ?? '')}
                      </td>
                    );
                  })}
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
