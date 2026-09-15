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
  
  action?: ReactNode;
  className?: string;
}

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
