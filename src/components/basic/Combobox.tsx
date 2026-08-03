import { KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from './utils';

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  label?: string;
  options: ComboboxOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  /** True while the caller is asynchronously fetching `options`. This component never fetches itself. */
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/** Strips Vietnamese diacritics (and normalizes đ/Đ) so search is diacritics-tolerant. */
function normalizeForSearch(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/**
 * Searchable single-select dropdown (no headless-UI/Radix dependency installed, so this
 * is plain React state + DOM event handling). Filters `options` client-side by
 * case-insensitive, diacritics-tolerant substring match on `label` - it never fetches
 * data itself, the caller owns fetching and passes `loading` while it does.
 *
 * Keyboard contract: ArrowDown/ArrowUp open the list (if closed) and move the
 * highlighted option; Enter selects the highlighted option; Escape closes the list and
 * discards the in-progress query (reverting the input to the current selection's
 * label); clicking outside (via a document `mousedown` listener) also closes without
 * selecting.
 */
export function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder,
  error,
  loading = false,
  disabled = false,
  className,
  id,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const generatedId = useId();
  const inputId = id ?? `combobox-${generatedId}`;
  const listId = `${inputId}-listbox`;
  const errorId = error ? `${inputId}-error` : undefined;

  const selectedOption = useMemo(() => options.find((option) => option.value === value) ?? null, [options, value]);

  const filteredOptions = useMemo(() => {
    const needle = normalizeForSearch(query.trim());
    if (!needle) return options;
    return options.filter((option) => normalizeForSearch(option.label).includes(needle));
  }, [options, query]);

  const displayValue = isOpen ? query : (selectedOption?.label ?? '');

  // Keep the highlighted row valid (and reset to the top) whenever the filtered set changes.
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  // Scroll the highlighted option into view as the user navigates with the keyboard.
  useEffect(() => {
    if (!isOpen) return;
    const option = listRef.current?.querySelector<HTMLElement>(`[data-index="${highlightedIndex}"]`);
    option?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex, isOpen]);

  // Click-outside-to-close.
  useEffect(() => {
    if (!isOpen) return;
    function handleDocumentMouseDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown);
  }, [isOpen]);

  function openDropdown() {
    if (disabled) return;
    setQuery(selectedOption?.label ?? '');
    setIsOpen(true);
    setHighlightedIndex(0);
  }

  function selectOption(option: ComboboxOption) {
    onChange(option.value);
    setQuery(option.label);
    setIsOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        openDropdown();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex((current) => Math.min(current + 1, filteredOptions.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex((current) => Math.max(current - 1, 0));
        break;
      case 'Enter': {
        event.preventDefault();
        const option = filteredOptions[highlightedIndex];
        if (option) selectOption(option);
        break;
      }
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        break;
      default:
        break;
    }
  }

  const activeOption = filteredOptions[highlightedIndex];

  return (
    <div ref={containerRef} className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          autoComplete="off"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={isOpen && activeOption ? `${listId}-option-${highlightedIndex}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          disabled={disabled}
          value={displayValue}
          placeholder={placeholder}
          onFocus={openDropdown}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            'h-10 w-full rounded border border-border bg-surface px-3 pr-8 text-sm text-foreground placeholder:text-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary',
            'disabled:cursor-not-allowed disabled:opacity-60',
            error && 'border-destructive focus:ring-destructive',
          )}
        />
        {loading && (
          <Spinner className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        )}
        {isOpen && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-auto rounded border border-border bg-surface py-1 text-sm shadow-md"
          >
            {filteredOptions.length === 0 && (
              <li className="px-3 py-2 text-muted">{loading ? 'Đang tải...' : 'Không tìm thấy kết quả'}</li>
            )}
            {filteredOptions.map((option, index) => (
              <li
                key={option.value}
                id={`${listId}-option-${index}`}
                data-index={index}
                role="option"
                aria-selected={option.value === value}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectOption(option);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  'cursor-pointer px-3 py-2 text-foreground',
                  index === highlightedIndex && 'bg-primary/10',
                  option.value === value && 'font-medium',
                )}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
