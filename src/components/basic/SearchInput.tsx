import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { Icon } from './Icon';
import { cn } from './utils';

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: string;
  onValueChange: (value: string) => void;
  
  label?: string;
  placeholder?: string;
  className?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onValueChange, label = 'Tìm kiếm', placeholder = 'Tìm kiếm...', id, className, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? `search-${generatedId}`;

  return (
    <div className={cn('relative', className)}>
      <Icon
        name="search"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      />
      <input
        ref={ref}
        id={inputId}
        type="search"
        role="searchbox"
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn(
          'h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-9 text-sm text-foreground placeholder:text-muted',
          'focus:outline-none focus:ring-2 focus:ring-primary',
          
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
        {...rest}
      />
      {value && (
        <button
          type="button"
          onClick={() => onValueChange('')}
          aria-label="Xoá từ khoá tìm kiếm"
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-muted hover:bg-surface-muted hover:text-foreground"
        >
          <Icon name="close" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});
