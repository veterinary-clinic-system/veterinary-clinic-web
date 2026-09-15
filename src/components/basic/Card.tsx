import { ReactNode } from 'react';
import { cn } from './utils';

export function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  
  as?: 'div' | 'section' | 'article' | 'li';
}) {
  return (
    <Tag className={cn('rounded-xl border border-border bg-surface', className)}>{children}</Tag>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 px-5 pt-5', className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  id,
  as: Tag = 'h3',
}: {
  children: ReactNode;
  className?: string;
  
  id?: string;
  
  as?: 'h2' | 'h3' | 'h4';
}) {
  return (
    <Tag id={id} className={cn('text-base font-semibold text-foreground', className)}>
      {children}
    </Tag>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 border-t border-border px-5 py-4', className)}>
      {children}
    </div>
  );
}
