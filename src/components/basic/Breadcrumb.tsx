import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import { cn } from './utils';

export interface Crumb {
  label: string;
  /** Bỏ trống ở mục cuối - trang hiện tại không phải là một liên kết. */
  to?: string;
}

/**
 * Đường dẫn phân cấp trong `StaffLayout`.
 *
 * Mục cuối dùng `aria-current="page"` và KHÔNG phải liên kết: một liên kết trỏ tới
 * chính trang đang mở là cái bẫy nhỏ nhưng gặp ở khắp nơi - người dùng bấm vào rồi
 * không hiểu vì sao không có gì xảy ra.
 *
 * Trên màn hình hẹp chỉ giữ lại mục cuối cùng: ba cấp đường dẫn ở 375px đẩy hết mọi
 * thứ khác ra khỏi thanh trên.
 */
export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Đường dẫn" className={cn('min-w-0', className)}>
      <ol className="flex items-center gap-1 text-sm">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              <li className={cn('min-w-0', !last && 'hidden md:flex md:items-center')}>
                {item.to && !last ? (
                  <Link
                    to={item.to}
                    className="truncate text-muted transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={last ? 'page' : undefined}
                    className={cn('truncate', last ? 'font-medium text-foreground' : 'text-muted')}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!last && (
                <li aria-hidden="true" className="hidden md:block">
                  <Icon name="chevron-right" className="h-4 w-4 text-muted/60" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
