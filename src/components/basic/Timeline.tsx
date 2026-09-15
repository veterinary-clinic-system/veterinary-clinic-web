import { ReactNode } from 'react';
import { cn } from './utils';

export type TimelineTone = 'default' | 'success' | 'warning' | 'danger' | 'muted';

const DOT: Record<TimelineTone, string> = {
  default: 'border-primary bg-surface',
  success: 'border-success bg-success',
  warning: 'border-warning bg-warning',
  danger: 'border-danger bg-danger',
  muted: 'border-border bg-surface',
};

export interface TimelineEntry {
  id: string;
  
  time: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: TimelineTone;
  
  footer?: ReactNode;
}

export function Timeline({ entries, className }: { entries: TimelineEntry[]; className?: string }) {
  return (
    <ol className={cn('relative', className)}>
      {entries.map((entry, index) => {
        const last = index === entries.length - 1;
        return (
          <li key={entry.id} className={cn('relative pl-7', !last && 'pb-6')}>
            {!last && (
              <span aria-hidden="true" className="absolute left-[5px] top-3 h-full w-px bg-border" />
            )}
            <span
              aria-hidden="true"
              className={cn(
                'absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full border-2',
                DOT[entry.tone ?? 'default'],
              )}
            />
            <p className="text-xs tabular-nums text-muted">{entry.time}</p>
            <div className="mt-0.5 text-data font-medium text-foreground">{entry.title}</div>
            {entry.description && (
              <div className="mt-1 text-sm text-muted">{entry.description}</div>
            )}
            {entry.footer && <div className="mt-2">{entry.footer}</div>}
          </li>
        );
      })}
    </ol>
  );
}
