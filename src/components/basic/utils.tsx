import clsx from 'clsx';
import { ReactNode } from 'react';

export function cn(...inputs: Parameters<typeof clsx>): string {
  return clsx(...inputs);
}

export interface FieldWrapperProps {
  id: string;
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function FieldWrapper({ id, label, error, hint, children, className }: FieldWrapperProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(errorId?: string, hintId?: string): string | undefined {
  const value = cn(errorId, hintId);
  return value || undefined;
}
