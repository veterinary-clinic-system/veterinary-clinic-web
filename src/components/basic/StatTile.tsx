import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, IconName } from './Icon';
import { cn } from './utils';

export interface StatTileProps {
  label: string;
  value: ReactNode;
  /** Một câu ngắn nói con số này nghĩa là gì hoặc so với cái gì. */
  hint?: string;
  icon?: IconName;
  /** Biến ô thành liên kết tới danh sách đứng sau con số. */
  to?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const TONE: Record<NonNullable<StatTileProps['tone']>, string> = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

/**
 * Một con số của trang tổng quan.
 *
 * Quy tắc: con số nào cũng phải **bấm được để xem danh sách đứng sau nó**. Một ô hiện
 * "7 ca đang chờ" mà không đi tới đâu chỉ tạo thêm một bước - người dùng đọc xong vẫn
 * phải tự tìm đường tới hàng chờ. Ô nào không có danh sách tương ứng thì thường là ô
 * không đáng có trên trang.
 *
 * Không đặt biểu đồ sparkline vào đây: đường kẻ 40px không đọc được xu hướng gì, nó chỉ
 * là trang trí.
 */
export function StatTile({
  label,
  value,
  hint,
  icon,
  to,
  tone = 'default',
  className,
}: StatTileProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        {icon && <Icon name={icon} className="h-5 w-5 text-muted/70" />}
      </div>
      <p className={cn('mt-2 text-2xl font-semibold tabular-nums', TONE[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </>
  );

  const shell = 'rounded-xl border border-border bg-surface p-card';

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          shell,
          'block transition-colors hover:border-primary/40 hover:bg-primary-soft',
          className,
        )}
      >
        {body}
      </Link>
    );
  }

  return <div className={cn(shell, className)}>{body}</div>;
}
