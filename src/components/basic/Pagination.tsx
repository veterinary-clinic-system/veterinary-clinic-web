import { useEffect, useMemo, useState } from 'react';
import { Table, TableProps } from './Table';
import { cn } from './utils';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Tổng số bản ghi — chỉ để hiển thị "N mục". Bỏ trống thì không hiện. */
  total?: number;
  className?: string;
}

/**
 * Thanh phân trang dùng chung cho các danh sách KHÔNG đi qua `<Table>`.
 *
 * `<Table>` đã có pager riêng cho các bảng phân trang phía máy chủ; component này dành
 * cho những màn hình dạng thẻ / danh sách tự do (lịch hẹn của chủ nuôi, hàng chờ, ...).
 * Tự ẩn khi chỉ có một trang để không thêm nhiễu vào những danh sách ngắn.
 */
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
  /** Toàn bộ hàng — component tự cắt trang. */
  data: T[];
  pageSize?: number;
  /** Giá trị bộ lọc; đổi thì quay về trang 1. */
  resetKeys?: unknown[];
}

/**
 * `<Table>` với phân trang phía CLIENT, cho những danh sách API trả về trọn vẹn trong
 * một lần gọi (lịch sử khám của một thú cưng, lịch hẹn của một khách hàng...).
 *
 * `<Table>` gốc cố ý chỉ phân trang phía máy chủ — nó luôn vẽ đúng `data` được truyền
 * vào. Wrapper này giữ nguyên hợp đồng đó, chỉ tự lo phần cắt mảng.
 */
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

/**
 * Cắt trang phía client cho những danh sách API đã trả về trọn vẹn trong một lần
 * (`/appointments/mine`, hàng chờ trong ngày, ...). Với các danh sách có phân trang
 * phía máy chủ, hãy truyền `page`/`limit` xuống API thay vì dùng hook này.
 *
 * `resetKeys` là các giá trị mà khi đổi thì phải quay về trang 1 - thường là bộ lọc.
 * Không có nó, đổi bộ lọc khi đang ở trang 5 sẽ cho ra một danh sách trống khó hiểu.
 */
export function usePagination<T>(
  items: T[],
  pageSize = 10,
  resetKeys: unknown[] = [],
): UsePaginationResult<T> {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetKeys);

  // Danh sách co lại (ví dụ sau khi hủy bớt mục) có thể làm trang hiện tại vượt quá
  // trang cuối - kéo về trang cuối thay vì hiển thị trống.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );

  return { page, setPage, pageItems, totalPages };
}
