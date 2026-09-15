import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, IconName } from './Icon';
import { cn } from './utils';

export interface StatTileProps {
  label: string;
  value: ReactNode;
  
  hint?: string;
  icon?: IconName;
  
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
