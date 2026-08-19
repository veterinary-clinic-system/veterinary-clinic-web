import { ReactElement, cloneElement, useId, useState } from 'react';
import { cn } from './utils';

export interface TooltipProps {
  /** Nội dung giải thích. Một câu ngắn - dài hơn thì thuộc về `hint` của trường nhập. */
  label: string;
  children: ReactElement;
  side?: 'top' | 'bottom' | 'right';
  className?: string;
}

/**
 * Chú giải ngắn khi rê chuột hoặc khi phần tử nhận focus.
 *
 * Hiện cả khi **focus bằng bàn phím**, không chỉ khi rê chuột: tooltip chỉ hiện lúc
 * hover là một trong những lỗi tiếp cận phổ biến nhất - người đi bằng bàn phím và người
 * dùng màn hình cảm ứng không bao giờ đọc được nó.
 *
 * Nối vào phần tử con bằng `aria-describedby` chứ không phải `aria-label`: `label` sẽ
 * THAY THẾ tên của nút, còn `describedby` thì bổ sung. Tooltip là phần bổ sung.
 *
 * Không dùng tooltip để chứa thông tin bắt buộc phải đọc mới thao tác được.
 */
export function Tooltip({ label, children, side = 'top', className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  const position =
    side === 'top'
      ? 'bottom-full left-1/2 mb-1.5 -translate-x-1/2'
      : side === 'bottom'
        ? 'top-full left-1/2 mt-1.5 -translate-x-1/2'
        : 'left-full top-1/2 ml-1.5 -translate-y-1/2';

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {cloneElement(children, { 'aria-describedby': open ? id : undefined })}
      {open && (
        <span
          role="tooltip"
          id={id}
          className={cn(
            'pointer-events-none absolute z-50 w-max max-w-[16rem] rounded-md bg-foreground px-2 py-1 text-xs text-surface shadow-pop',
            position,
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
