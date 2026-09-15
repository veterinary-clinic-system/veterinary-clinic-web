import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { FieldWrapper, cn, describedBy } from './utils';

export interface DatePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'min' | 'max'> {
  label?: string;
  error?: string;
  hint?: string;
  
  value: string | null;
  onChange: (value: string | null) => void;
  min?: string;
  max?: string;
}

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
