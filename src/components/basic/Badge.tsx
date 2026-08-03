import { ReactNode } from 'react';
import { cn } from './utils';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'outline';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

/**
 * There is no dedicated "success"/"warning" pair of semantic tokens in the current
 * placeholder token set (src/index.css only defines primary/surface/border/foreground/
 * muted/destructive plus the fixed 5-color triage scale). Rather than inventing new
 * `--color-success`/`--color-warning` variables (out of scope for this component
 * library - see tailwind.config.ts/src/index.css ownership), `success` and `warning`
 * reuse the existing triage green/yellow tokens, which are the only green/yellow in the
 * palette. Revisit if DESIGN.md later defines dedicated status colors.
 */
const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-triage-green/10 text-triage-green',
  warning: 'bg-triage-yellow/10 text-triage-yellow',
  destructive: 'bg-destructive/10 text-destructive',
  outline: 'border border-border bg-transparent text-foreground',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
