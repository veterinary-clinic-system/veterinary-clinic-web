import { RefObject, useEffect, useRef } from 'react';

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
  
  trapFocus?: boolean;
  
  lockScroll?: boolean;
  
  closeOnOutsideClick?: boolean;
}

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
  
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const container = containerRef.current;

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
      
      const restore = restoreFocusRef.current;
      if (restore && document.contains(restore)) restore.focus();
    };
  }, [open, containerRef, trapFocus, lockScroll, closeOnOutsideClick]);
}
