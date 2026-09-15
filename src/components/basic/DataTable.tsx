import { ReactNode, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { Skeleton } from './Skeleton';
import { EmptyState, ErrorState } from './States';
import type { SortOrder } from './Table';
import { cn } from './utils';

export interface DataColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  
  align?: 'left' | 'right';
  
  hideBelow?: 'sm' | 'md' | 'lg';
  width?: string;
}

export interface DataTableProps<T> {
  columns: DataColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;

  toolbar?: ReactNode;
  
  actions?: ReactNode;

  sortBy?: string;
  sortOrder?: SortOrder;
  onSortChange?: (sortBy: string, sortOrder: SortOrder) => void;

  page?: number;
  limit?: number;
  total?: number;
  onPageChange?: (page: number) => void;

  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  
  bulkActions?: (selectedIds: string[]) => ReactNode;

  onRowClick?: (row: T) => void;
  
  rowActions?: (row: T) => ReactNode;

  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  toolbar,
  actions,
  sortBy,
  sortOrder,
  onSortChange,
  page,
  limit,
  total,
  onPageChange,
  selectedIds,
  onSelectionChange,
  bulkActions,
  onRowClick,
  rowActions,
  loading = false,
  error = false,
  onRetry,
  emptyTitle = 'Chưa có dữ liệu',
  emptyDescription,
  emptyAction,
  className,
}: DataTableProps<T>) {
  const selectable = Boolean(selectedIds && onSelectionChange);
  const selected = selectedIds ?? [];
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const pageIds = data.map(getRowId);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const someSelected = pageIds.some((id) => selected.includes(id));

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

  function toggleAll() {
    if (!onSelectionChange) return;
    onSelectionChange(
      allSelected ? selected.filter((id) => !pageIds.includes(id)) : [...new Set([...selected, ...pageIds])],
    );
  }

  function toggleOne(id: string) {
    if (!onSelectionChange) return;
    onSelectionChange(
      selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id],
    );
  }

  function handleHeaderClick(column: DataColumn<T>) {
    if (!onSortChange || !column.sortable) return;
    onSortChange(column.key, sortBy === column.key && sortOrder === 'ASC' ? 'DESC' : 'ASC');
  }

  const effectiveLimit = limit && limit > 0 ? limit : data.length || 1;
  const effectiveTotal = total ?? data.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / effectiveLimit));
  const currentPage = page ?? 1;

  const hideClass: Record<NonNullable<DataColumn<T>['hideBelow']>, string> = {
    sm: 'hidden sm:table-cell',
    md: 'hidden md:table-cell',
    lg: 'hidden lg:table-cell',
  };

  const columnCount = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {(toolbar || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">{toolbar}</div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}

      {}
      {selectable && selected.length > 0 && bulkActions && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary-soft px-4 py-2.5 text-sm"
        >
          <span className="font-medium text-foreground">Đã chọn {selected.length} mục</span>
          <div className="flex flex-wrap items-center gap-2">{bulkActions(selected)}</div>
          <button
            type="button"
            onClick={() => onSelectionChange?.([])}
            className="ml-auto text-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            Bỏ chọn
          </button>
        </div>
      )}

      {error ? (
        <ErrorState onRetry={onRetry} />
      ) : !loading && data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full border-collapse text-data">
            <thead>
              <tr className="border-b border-border-strong bg-surface-muted text-left">
                {selectable && (
                  <th scope="col" className="w-10 px-3">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Chọn tất cả hàng trên trang này"
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                  </th>
                )}
                {columns.map((column) => {
                  const isSortable = Boolean(onSortChange) && column.sortable;
                  const isActive = isSortable && sortBy === column.key;
                  return (
                    <th
                      key={column.key}
                      scope="col"
                      style={column.width ? { width: column.width } : undefined}
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
                        'px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted',
                        column.align === 'right' && 'text-right',
                        column.hideBelow && hideClass[column.hideBelow],
                      )}
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
                {rowActions && <th scope="col" className="w-12 px-3" />}
              </tr>
            </thead>

            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <tr key={`skeleton-${index}`} className="border-b border-border last:border-b-0">
                      <td colSpan={columnCount} className="px-3">
                        <div className="flex h-row items-center">
                          <Skeleton className="h-3.5 w-full max-w-md" />
                        </div>
                      </td>
                    </tr>
                  ))
                : data.map((row) => {
                    const id = getRowId(row);
                    const isSelected = selected.includes(id);
                    return (
                      <tr
                        key={id}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        className={cn(
                          'border-b border-border last:border-b-0',
                          isSelected ? 'bg-primary-soft' : 'hover:bg-surface-muted/60',
                          onRowClick && 'cursor-pointer',
                        )}
                      >
                        {selectable && (
                          <td className="px-3" onClick={(event) => event.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleOne(id)}
                              aria-label={`Chọn hàng ${id}`}
                              className="h-4 w-4 rounded border-border accent-primary"
                            />
                          </td>
                        )}
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={cn(
                              'h-row px-3 py-2 align-middle text-foreground',
                              column.align === 'right' && 'text-right',
                              column.hideBelow && hideClass[column.hideBelow],
                            )}
                          >
                            {column.render
                              ? column.render(row)
                              : String((row as Record<string, unknown>)[column.key] ?? '')}
                          </td>
                        ))}
                        {rowActions && (
                          <td className="px-3 text-right" onClick={(event) => event.stopPropagation()}>
                            {rowActions(row)}
                          </td>
                        )}
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      )}

      {onPageChange && !error && data.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <p>
            {effectiveTotal} mục · trang {currentPage}/{totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="inline-flex min-h-touch items-center gap-1 rounded-lg border border-border px-3 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="chevron-left" className="h-4 w-4" />
              Trước
            </button>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex min-h-touch items-center gap-1 rounded-lg border border-border px-3 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
              <Icon name="chevron-right" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
