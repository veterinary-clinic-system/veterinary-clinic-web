import { ReactNode } from 'react';
import { cn } from './utils';

/**
 * Thẻ nội dung. Ghép từ nhiều mảnh (`Card` / `CardHeader` / `CardTitle` / `CardBody`)
 * thay vì nhận một đống prop cấu hình - trang nào cần gì thì dựng nấy, và không phải
 * thêm một prop mới mỗi lần có một biến thể.
 *
 * Gom lại ở đây vì chuỗi `rounded-xl border border-border bg-surface p-5` đang được
 * chép tay ở hơn hai chục chỗ, và đã bắt đầu trôi (`p-4` / `p-5` / `p-6`, `rounded-lg`
 * lẫn `rounded-xl`).
 */
export function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  /** Đổi sang `section`/`article`/`li` khi ngữ nghĩa đòi - mặc định là `div`. */
  as?: 'div' | 'section' | 'article' | 'li';
}) {
  return (
    <Tag className={cn('rounded-xl border border-border bg-surface', className)}>{children}</Tag>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 px-5 pt-5', className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  id,
  as: Tag = 'h3',
}: {
  children: ReactNode;
  className?: string;
  /** Để `aria-labelledby` của biểu đồ/bảng bên trong trỏ ngược lên tiêu đề thẻ. */
  id?: string;
  /** Cấp tiêu đề phải khớp với cấu trúc trang - đừng nhảy cóc h1 -> h3. */
  as?: 'h2' | 'h3' | 'h4';
}) {
  return (
    <Tag id={id} className={cn('text-base font-semibold text-foreground', className)}>
      {children}
    </Tag>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 border-t border-border px-5 py-4', className)}>
      {children}
    </div>
  );
}
