import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { Icon } from './Icon';
import { cn } from './utils';

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: string;
  onValueChange: (value: string) => void;
  /** Nhãn cho trình đọc màn hình. Ô tìm kiếm hiếm khi có nhãn nhìn thấy được. */
  label?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Ô tìm kiếm.
 *
 * `type="search"` chứ không phải `text`: trình duyệt di động đổi phím Enter thành "Tìm"
 * và trình đọc màn hình đọc ra đúng vai trò của ô.
 *
 * Nút xoá chỉ hiện khi có chữ, và là `<button>` thật (44px, tới được bằng Tab) chứ
 * không phải một icon bấm được - người dùng bàn phím cũng cần xoá bộ lọc.
 *
 * Component này KHÔNG tự debounce: nơi gọi quyết định chờ bao lâu trước khi gọi API
 * (xem `useDebouncedValue`). Gõ vào ô mà chữ hiện chậm hơn ngón tay là lỗi khó chịu
 * nhất, nên trạng thái chữ luôn cập nhật tức thì.
 */
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
          // Chrome vẽ sẵn một nút xoá của riêng nó - bỏ đi để không có hai nút cạnh nhau.
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
