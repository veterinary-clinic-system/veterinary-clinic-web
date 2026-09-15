import { useEffect, useMemo, useState } from 'react';
import { Table, TableProps } from './Table';
import { cn } from './utils';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  
  total?: number;
  className?: string;
}

export function Pagination({ page, totalPages, onPageChange, total, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={cn('mt-6 flex items-center justify-between gap-3 text-sm text-muted', className)}>
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        Trước
      </button>
      <span>
        Trang {page} / {totalPages}
        {total !== undefined && ` · ${total} mục`}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        Sau
      </button>
    </div>
  );
}

export interface ClientPagedTableProps<T> extends Omit<TableProps<T>, 'page' | 'limit' | 'onPageChange'> {
  
  data: T[];
  pageSize?: number;
  
  resetKeys?: unknown[];
}

export function ClientPagedTable<T>({
  data,
  pageSize = 10,
  resetKeys = [],
  ...tableProps
}: ClientPagedTableProps<T>) {
  const { page, setPage, pageItems } = usePagination(data, pageSize, resetKeys);

  return (
    <Table
      {...tableProps}
      data={pageItems}
      page={page}
      limit={pageSize}
      total={data.length}
      onPageChange={setPage}
    />
  );
}

export interface UsePaginationResult<T> {
  page: number;
  setPage: (page: number) => void;
  pageItems: T[];
  totalPages: number;
}

export function usePagination<T>(
  items: T[],
  pageSize = 10,
  resetKeys: unknown[] = [],
): UsePaginationResult<T> {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(1);
    
  }, resetKeys);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );

  return { page, setPage, pageItems, totalPages };
}
