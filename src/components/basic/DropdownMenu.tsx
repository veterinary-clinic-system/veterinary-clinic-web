import { KeyboardEvent, ReactNode, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, IconName } from './Icon';
import { cn } from './utils';
import { useDismissableLayer } from './use-dismissable-layer';

export interface MenuAction {
  id: string;
  label: string;
  icon?: IconName;
  to?: string;
  onSelect?: () => void;
  disabled?: boolean;
  /** Hành động phá huỷ - hiện màu cảnh báo và luôn nằm cuối nhóm. */
  destructive?: boolean;
}

export interface DropdownMenuProps {
  /** Nút mở menu. Nhận sẵn các thuộc tính ARIA cần thiết. */
  trigger: (props: {
    ref: React.Ref<HTMLButtonElement>;
    onClick: () => void;
    'aria-expanded': boolean;
    'aria-haspopup': 'menu';
  }) => ReactNode;
  items: MenuAction[];
  /** Neo menu về bên nào của nút. Mặc định phải - hợp với nút ở cuối hàng. */
  align?: 'left' | 'right';
  className?: string;
}

/**
 * Menu thả xuống theo mẫu `menu`/`menuitem` của WAI-ARIA.
 *
 * Mũi tên lên/xuống di chuyển giữa các mục, Esc đóng và trả focus về nút - phần trả
 * focus do `useDismissableLayer` lo. Mục `to` render thành `<Link>` để bấm giữa chuột
 * vẫn mở tab mới được; mục `onSelect` render thành `<button>`.
 *
 * Menu này dành cho HÀNH ĐỘNG. Chọn giá trị trong danh sách thì dùng `Select` hoặc
 * `Combobox` - hai thứ đó có ngữ nghĩa khác hẳn với trình đọc màn hình.
 */
export function DropdownMenu({ trigger, items, align = 'right', className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useDismissableLayer(containerRef, {
    open,
    onDismiss: () => setOpen(false),
    trapFocus: false,
    closeOnOutsideClick: true,
  });

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const nodes = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? [],
    );
    if (nodes.length === 0) return;
    const current = nodes.indexOf(document.activeElement as HTMLElement);
    const delta = event.key === 'ArrowDown' ? 1 : -1;
    nodes[(current + delta + nodes.length) % nodes.length].focus();
  }

  const itemClass = (item: MenuAction) =>
    cn(
      'flex min-h-touch w-full items-center gap-2.5 px-3 text-left text-sm transition-colors',
      item.disabled
        ? 'cursor-not-allowed text-muted/60'
        : item.destructive
          ? 'text-danger hover:bg-danger-soft'
          : 'text-foreground hover:bg-surface-muted',
    );

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {trigger({
        ref: triggerRef,
        onClick: () => setOpen((value) => !value),
        'aria-expanded': open,
        'aria-haspopup': 'menu',
      })}

      {open && (
        <div
          role="menu"
          onKeyDown={handleMenuKeyDown}
          className={cn(
            'absolute z-40 mt-1 min-w-[13rem] overflow-hidden rounded-lg border border-border bg-surface-raised py-1 shadow-pop',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item) =>
            item.to && !item.disabled ? (
              <Link
                key={item.id}
                role="menuitem"
                to={item.to}
                onClick={() => setOpen(false)}
                className={itemClass(item)}
              >
                {item.icon && <Icon name={item.icon} className="h-4 w-4 opacity-70" />}
                {item.label}
              </Link>
            ) : (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                aria-disabled={item.disabled || undefined}
                onClick={() => {
                  if (item.disabled) return;
                  setOpen(false);
                  item.onSelect?.();
                }}
                className={itemClass(item)}
              >
                {item.icon && <Icon name={item.icon} className="h-4 w-4 opacity-70" />}
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
