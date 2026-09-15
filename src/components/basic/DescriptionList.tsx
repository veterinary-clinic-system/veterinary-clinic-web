import { ReactNode } from 'react';
import { cn } from './utils';

export interface DescriptionItem {
  label: string;
  value: ReactNode;
  
  wide?: boolean;
}

export function DescriptionList({
  items,
  columns = 2,
  className,
}: {
  items: DescriptionItem[];
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const gridClass =
    columns === 1 ? 'sm:grid-cols-1' : columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3';

  return (
    <dl className={cn('grid grid-cols-1 gap-x-6 gap-y-4', gridClass, className)}>
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className={cn('min-w-0', item.wide && 'sm:col-span-full')}>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">{item.label}</dt>
          <dd className="mt-1 text-data text-foreground">
            {item.value === null || item.value === undefined || item.value === '' ? (
              <span className="text-muted">—</span>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
