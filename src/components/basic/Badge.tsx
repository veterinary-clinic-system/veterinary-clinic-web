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
