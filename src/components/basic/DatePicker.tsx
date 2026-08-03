import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { FieldWrapper, cn, describedBy } from './utils';

export interface DatePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'min' | 'max'> {
  label?: string;
  error?: string;
  hint?: string;
  /** "yyyy-MM-dd", or null when empty. */
  value: string | null;
  onChange: (value: string | null) => void;
  min?: string;
  max?: string;
}

/**
 * Wraps a native <input type="date"> rather than a custom month-grid calendar.
 * Rationale: no calendar-UI/date-picker dependency is installed in this project (see
 * package.json - only react, react-dom, clsx and date-fns are available here), and a
 * fully custom, keyboard- and screen-reader-accessible date-grid picker is a
 * substantial piece of UI on its own. Native date inputs are keyboard-accessible,
 * localized by the browser for free, and use the exact "yyyy-MM-dd" value format this
 * component's `value`/`onChange` contract exposes, so there is no format-conversion
 * layer to get wrong. If a custom popover calendar becomes a real requirement later
 * (e.g. to show doctor availability inline while picking a date), swap the <input>
 * below for one - the label/error/hint chrome and the `string | null` <-> "yyyy-MM-dd"
 * contract can stay identical so callers don't need to change.
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  { label, error, hint, value, onChange, min, max, id, className, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? `date-${generatedId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <FieldWrapper id={inputId} label={label} error={error} hint={hint}>
      <input
        ref={ref}
        id={inputId}
        type="date"
        value={value ?? ''}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(errorId, hintId)}
        className={cn(
          'h-10 rounded border border-border bg-surface px-3 text-sm text-foreground',
          'focus:outline-none focus:ring-2 focus:ring-primary',
          'disabled:cursor-not-allowed disabled:opacity-60',
          error && 'border-destructive focus:ring-destructive',
          className,
        )}
        {...rest}
      />
    </FieldWrapper>
  );
});
