import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, cn } from '@/components/basic';

export interface SectionHeaderProps {
  title: string;
  description?: string;
  
  linkTo?: string;
  linkLabel?: string;
  children?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  linkTo,
  linkLabel = 'Xem tất cả',
  children,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('pet-section-header flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-muted">{description}</p>}
      </div>
      {children}
      {linkTo && (
        <Link
          to={linkTo}
          className="inline-flex min-h-touch items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {linkLabel}
          <Icon name="arrow-right" className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
