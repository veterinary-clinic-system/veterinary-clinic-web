import { cn } from './utils';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded bg-surface-muted', className)} />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn('h-4', index === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

export function SkeletonCards({
  count = 6,
  label = 'Đang tải dữ liệu',
  className,
}: {
  count?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={cn('grid gap-6 sm:grid-cols-2 lg:grid-cols-3', className)}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border bg-surface p-5">
          <Skeleton className="h-5 w-2/3" />
          <SkeletonText lines={2} className="mt-4" />
          <Skeleton className="mt-6 h-9 w-32" />
        </div>
      ))}
    </div>
  );
}
