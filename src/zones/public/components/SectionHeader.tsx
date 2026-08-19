import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, cn } from '@/components/basic';

export interface SectionHeaderProps {
  title: string;
  description?: string;
  /** Liên kết "xem tất cả" - luôn ở cuối tiêu đề, không phải ở cuối danh sách. */
  linkTo?: string;
  linkLabel?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Tiêu đề của một mục trên trang công khai.
 *
 * Liên kết "xem tất cả" đặt CẠNH tiêu đề chứ không dưới danh sách: người quét trang
 * quyết định có xem hết mục này hay không ngay khi đọc tiêu đề, chứ không phải sau khi
 * đã cuộn qua sáu thẻ.
 *
 * Luôn phát ra `h2` - trang công khai chỉ có một `h1` ở đầu trang.
 */
export function SectionHeader({
  title,
  description,
  linkTo,
  linkLabel = 'Xem tất cả',
  children,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-muted">{description}</p>}
      </div>
      {children}
      {linkTo && (
        <Link
          to={linkTo}
          className="inline-flex min-h-touch items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {linkLabel}
          <Icon name="arrow-right" className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
