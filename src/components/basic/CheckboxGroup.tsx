import { Checkbox } from './Checkbox';
import { cn } from './utils';

export interface CheckboxGroupOption {
  value: string;
  label: string;
}

export interface CheckboxGroupProps {
  /** Optional group heading, rendered as a <legend>. */
  label?: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: CheckboxGroupOption[];
  disabled?: boolean;
  className?: string;
}

/**
 * Generic multi-select checklist over an arbitrary {value, label}[] option list -
 * deliberately not tied to any one domain concept (e.g. symptoms) so it can be reused
 * anywhere a "pick any of these" control is needed.
 */
export function CheckboxGroup({ label, value, onChange, options, disabled, className }: CheckboxGroupProps) {
  function toggle(optionValue: string, checked: boolean) {
    if (checked) {
      if (!value.includes(optionValue)) {
        onChange([...value, optionValue]);
      }
    } else {
      onChange(value.filter((current) => current !== optionValue));
    }
  }

  return (
    <fieldset className={cn('flex flex-col gap-2 border-0 p-0', className)}>
      {label && <legend className="mb-1 text-sm font-medium text-foreground">{label}</legend>}
      {options.map((option) => (
        <Checkbox
          key={option.value}
          label={option.label}
          checked={value.includes(option.value)}
          onChange={(checked) => toggle(option.value, checked)}
          disabled={disabled}
        />
      ))}
    </fieldset>
  );
}
