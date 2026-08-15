import { ReactNode } from 'react';
import { cn } from './utils';

export interface PageHeaderProps {
  title: string;
  /** Một câu nói rõ trang này để làm gì. Bỏ trống khi tiêu đề đã tự nói hết. */
  description?: string;
  /** Nút hành động chính của trang, dạt về phải trên màn hình rộng. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Tiêu đề trang. Luôn phát ra `h1` - mỗi trang đúng MỘT `h1`, và các thẻ bên dưới bắt
 * đầu từ `h2`, để cấu trúc tiêu đề đọc được bằng trình đọc màn hình.
 *
 * Trước đây mỗi trang tự viết `<h1 className="text-2xl font-semibold">`, chỗ có mô tả
 * chỗ không, khoảng cách dưới tiêu đề thì mỗi nơi một kiểu.
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
