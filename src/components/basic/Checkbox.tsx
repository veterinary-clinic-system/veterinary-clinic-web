import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from './utils';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, checked, onChange, id, className, disabled, ...rest },
  ref,
) {
  const generatedId = useId();
  const checkboxId = id ?? `checkbox-${generatedId}`;

  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        'inline-flex items-center gap-2 text-sm text-foreground',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className,
      )}
    >
      <input
        ref={ref}
        id={checkboxId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 shrink-0 rounded border-border accent-primary focus:outline-none focus:ring-2 focus:ring-primary"
        {...rest}
      />
      {label}
    </label>
  );
});
