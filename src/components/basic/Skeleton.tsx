import { cn } from './utils';

/**
 * Khối xám nhấp nháy thay cho nội dung đang tải.
 *
 * Dùng skeleton chứ không phải spinner cho NỘI DUNG: spinner chỉ nói "đang chờ", còn
 * skeleton giữ đúng chỗ của thứ sắp hiện ra nên trang không nhảy khi dữ liệu về. Spinner
 * vẫn hợp lý cho một hành động cụ thể (nút đang gửi) - xem `Button loading`.
 *
 * Hiệu ứng nhấp nháy tự tắt khi người dùng bật "giảm chuyển động" của hệ điều hành
 * (xem `@media (prefers-reduced-motion)` trong index.css).
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded bg-surface-muted', className)} />;
}

/**
 * Vài dòng chữ giả. `lines` cuối luôn ngắn hơn để trông giống một đoạn văn thật chứ
 * không phải một khối chữ nhật.
 */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn('h-4', index === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

/**
 * Lưới thẻ giả - dùng cho các trang danh sách dạng thẻ (dịch vụ, bác sĩ, chi nhánh).
 *
 * `aria-busy` + nhãn nằm ở ĐÂY chứ không ở từng khối con: trình đọc màn hình cần đúng
 * một thông báo "đang tải", không phải sáu.
 */
export function SkeletonCards({
  count = 6,
  label = 'Đang tải dữ liệu',
  className,
}: {
  count?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={cn('grid gap-6 sm:grid-cols-2 lg:grid-cols-3', className)}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border bg-surface p-5">
          <Skeleton className="h-5 w-2/3" />
          <SkeletonText lines={2} className="mt-4" />
          <Skeleton className="mt-6 h-9 w-32" />
        </div>
      ))}
    </div>
  );
}
