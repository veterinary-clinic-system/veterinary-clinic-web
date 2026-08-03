import clsx from 'clsx';
import { ReactNode } from 'react';

/**
 * Internal helpers shared by the primitives in this directory. Not re-exported from
 * ./index.ts - implementation detail of src/components/basic only.
 */

/** Thin wrapper around clsx so class merging stays consistent across every component. */
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

/**
 * Shared label / control / hint / error chrome used by Input, Textarea, Select and
 * DatePicker so all form primitives look and behave identically. (Combobox renders its
 * own markup instead - it needs a single wrapping element to attach the click-outside
 * ref/listener to, and doesn't take a `hint` prop.) Only the hint OR the error is shown
 * at a time (an error always takes priority over a hint) to avoid the field growing two
 * lines of helper text at once.
 */
export function FieldWrapper({ id, label, error, hint, children, className }: FieldWrapperProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
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

/** Builds an `aria-describedby` value from optional hint/error ids, or undefined if neither applies. */
export function describedBy(errorId?: string, hintId?: string): string | undefined {
  const value = cn(errorId, hintId);
  return value || undefined;
}
