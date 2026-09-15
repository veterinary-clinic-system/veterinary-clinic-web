import { KeyboardEvent, ReactNode, useId } from 'react';
import { cn } from './utils';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  
  count?: number;
  disabled?: boolean;
}

export interface TabsProps<T extends string = string> {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  
  variant?: 'line' | 'pill';
  className?: string;
}

export function Tabs<T extends string = string>({
  items,
  value,
  onChange,
  variant = 'line',
  className,
}: TabsProps<T>) {
  const baseId = useId();

  function move(delta: number, from: number) {
    const usable = items.filter((item) => !item.disabled);
    if (usable.length === 0) return;
    const currentIndex = usable.findIndex((item) => item.id === items[from].id);
    const next = usable[(currentIndex + delta + usable.length) % usable.length];
    onChange(next.id);
    document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        move(1, index);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        move(-1, index);
        break;
      case 'Home': {
        event.preventDefault();
        const first = items.find((item) => !item.disabled);
        if (first) {
          onChange(first.id);
          document.getElementById(`${baseId}-tab-${first.id}`)?.focus();
        }
        break;
      }
      case 'End': {
        event.preventDefault();
        const last = [...items].reverse().find((item) => !item.disabled);
        if (last) {
          onChange(last.id);
          document.getElementById(`${baseId}-tab-${last.id}`)?.focus();
        }
        break;
      }
      default:
    }
  }

  const isLine = variant === 'line';

  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center gap-1 overflow-x-auto',
        isLine ? 'border-b border-border' : 'rounded-lg bg-surface-muted p-1',
        className,
      )}
    >
      {items.map((item, index) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            id={`${baseId}-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`${baseId}-panel-${item.id}`}
            tabIndex={active ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'inline-flex min-h-touch shrink-0 items-center gap-2 whitespace-nowrap px-3 text-sm font-medium transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isLine
                ? cn(
                    '-mb-px border-b-2 pb-2.5 pt-2',
                    active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted hover:text-foreground',
                  )
                : cn(
                    'rounded-md py-1.5',
                    active
                      ? 'bg-surface text-foreground shadow-sm'
                      : 'text-muted hover:text-foreground',
                  ),
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-xs tabular-nums',
                  active ? 'bg-primary/10 text-primary' : 'bg-surface-muted text-muted',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  id,
  labelledBy,
  children,
  className,
}: {
  id: string;
  labelledBy: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="tabpanel" id={id} aria-labelledby={labelledBy} tabIndex={0} className={className}>
      {children}
    </div>
  );
}
