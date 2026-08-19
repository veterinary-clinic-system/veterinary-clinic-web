import { ReactNode } from 'react';
import { cn } from './utils';

export type BadgeVariant =
  | 'default'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'outline';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

/**
 * Nhãn nhỏ gắn vào một dòng dữ liệu.
 *
 * Bốn biến thể trạng thái dùng token `success`/`warning`/`danger`/`info` của bảng màu
 * (src/index.css). Trước đây `success`/`warning` phải mượn màu của thang phân loại ưu
 * tiên vì bảng token chưa có chúng - hai hệ màu khác nghĩa hẳn nhau bị buộc chung một
 * giá trị, đổi một cái là hỏng cái kia. Thang triage giờ chỉ còn `TriageBadge` dùng.
 *
 * Chữ luôn là kênh thông tin chính: badge không bao giờ chỉ là một chấm màu.
 */
const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary',
  neutral: 'bg-surface-muted text-muted',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  destructive: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  outline: 'border border-border bg-transparent text-foreground',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Badge có thêm một chấm màu ở đầu.
 *
 * Chấm KHÔNG mang thêm thông tin nào - nó chỉ giúp mắt bắt được cột trạng thái khi
 * quét nhanh một bảng dài. Nghĩa vẫn nằm ở chữ, nên người không phân biệt được màu
 * không mất gì.
 */
export function StatusBadge({
  variant = 'neutral',
  children,
  className,
}: BadgeProps) {
  const DOT_CLASSES: Record<BadgeVariant, string> = {
    default: 'bg-primary',
    neutral: 'bg-muted',
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-danger',
    info: 'bg-info',
    outline: 'bg-muted',
  };

  return (
    <Badge variant={variant} className={className}>
      <span aria-hidden="true" className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT_CLASSES[variant])} />
      {children}
    </Badge>
  );
}
