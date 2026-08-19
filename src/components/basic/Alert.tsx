import { ReactNode } from 'react';
import { Icon, IconName } from './Icon';
import { cn } from './utils';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const TONE: Record<AlertTone, { box: string; icon: string; name: IconName }> = {
  info: { box: 'border-info/25 bg-info-soft', icon: 'text-info', name: 'info' },
  success: { box: 'border-success/25 bg-success-soft', icon: 'text-success', name: 'check' },
  warning: { box: 'border-warning/30 bg-warning-soft', icon: 'text-warning', name: 'alert' },
  danger: { box: 'border-danger/30 bg-danger-soft', icon: 'text-danger', name: 'alert' },
};

export interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  /** Nút hành động - đặt ở cuối, không phải trong dòng chữ. */
  action?: ReactNode;
  className?: string;
}

/**
 * Thông báo nằm trong luồng nội dung (khác `Toast` - thứ tự nổi lên rồi biến mất).
 *
 * `role` đổi theo mức độ: `danger` và `warning` là `alert` (trình đọc màn hình cắt
 * ngang để đọc), `info`/`success` là `status` (đọc xen vào). Một cảnh báo dị ứng thuốc
 * phải được nghe ngay; một dòng "đã lưu" thì không đáng cắt lời.
 *
 * Luôn có icon đi kèm màu: người không phân biệt được đỏ với xanh vẫn đọc ra đây là
 * cảnh báo hay xác nhận.
 */
export function Alert({ tone = 'info', title, children, action, className }: AlertProps) {
  const style = TONE[tone];
  const critical = tone === 'danger' || tone === 'warning';

  return (
    <div
      role={critical ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-lg border p-4 text-sm', style.box, className)}
    >
      <Icon name={style.name} className={cn('mt-0.5 h-5 w-5', style.icon)} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold text-foreground">{title}</p>}
        {children && <div className={cn('text-foreground/80', title && 'mt-1')}>{children}</div>}
        {action && <div className="mt-3 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  );
}
