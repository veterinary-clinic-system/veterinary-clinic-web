import { RefObject, useEffect, useRef } from 'react';

/**
 * Những hành vi mà MỌI lớp phủ đều phải có, gom lại một chỗ.
 *
 * Trước đây mỗi hộp thoại tự làm một phần: Modal có Esc và khoá cuộn nhưng không bẫy
 * focus (nhấn Tab là con trỏ đi ra sau lớp phủ, người dùng bàn phím lạc hẳn); Combobox
 * có click-outside nhưng không có Esc. Ba hành vi này luôn đi cùng nhau, nên tách thành
 * hook chứ không chép lại ở từng nơi.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusableWithin(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => element.offsetParent !== null || element === document.activeElement,
  );
}

export interface DismissableLayerOptions {
  open: boolean;
  onDismiss: () => void;
  /** Giữ focus bên trong khi mở. Tắt cho popover không chặn tương tác phía sau. */
  trapFocus?: boolean;
  /** Khoá cuộn của trang. Chỉ bật cho lớp phủ toàn màn hình. */
  lockScroll?: boolean;
  /** Đóng khi bấm ra ngoài. */
  closeOnOutsideClick?: boolean;
}

/**
 * Gắn Esc / bẫy focus / khoá cuộn / bấm-ra-ngoài vào một phần tử container.
 *
 * Khi đóng, focus được trả về đúng phần tử đã mở lớp phủ - nếu không, người dùng bàn
 * phím bị ném về đầu trang sau mỗi lần đóng một hộp thoại.
 */
export function useDismissableLayer<T extends HTMLElement>(
  containerRef: RefObject<T>,
  {
    open,
    onDismiss,
    trapFocus = true,
    lockScroll = false,
    closeOnOutsideClick = true,
  }: DismissableLayerOptions,
): void {
  /* Giữ callback trong ref để hook không phải gắn lại listener mỗi lần render. */
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const container = containerRef.current;

    /*
      Đưa focus vào trong: ưu tiên phần tử tương tác đầu tiên, không có thì chính
      container (nó mang `tabIndex={-1}`), để trình đọc màn hình bắt đầu đọc từ đây.
    */
    if (trapFocus && container) {
      const [first] = focusableWithin(container);
      (first ?? container).focus();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        dismissRef.current();
        return;
      }

      if (!trapFocus || event.key !== 'Tab') return;
      const node = containerRef.current;
      if (!node) return;

      const items = focusableWithin(node);
      if (items.length === 0) {
        event.preventDefault();
        node.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === node)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function handlePointerDown(event: MouseEvent) {
      if (!closeOnOutsideClick) return;
      const node = containerRef.current;
      if (node && !node.contains(event.target as Node)) {
        dismissRef.current();
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousedown', handlePointerDown);

    const previousOverflow = lockScroll ? document.body.style.overflow : null;
    if (lockScroll) document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mousedown', handlePointerDown);
      if (previousOverflow !== null) document.body.style.overflow = previousOverflow;
      /* Trả focus về nút đã mở - chỉ khi nó còn nằm trong trang. */
      const restore = restoreFocusRef.current;
      if (restore && document.contains(restore)) restore.focus();
    };
  }, [open, containerRef, trapFocus, lockScroll, closeOnOutsideClick]);
}
