import { ReactNode, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { cn } from './utils';
import { useDismissableLayer } from './use-dismissable-layer';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  
  side?: 'left' | 'right';
  width?: 'sm' | 'md' | 'lg';
  className?: string;
  
  bodyClassName?: string;
}

const WIDTH: Record<NonNullable<DrawerProps['width']>, string> = {
  sm: 'max-w-xs',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

const DRAWER_ROOT_ID = 'drawer-root';

function drawerRoot(): HTMLElement {
  let root = document.getElementById(DRAWER_ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = DRAWER_ROOT_ID;
    document.body.appendChild(root);
  }
  return root;
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
  width = 'md',
  className,
  bodyClassName,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useDismissableLayer(panelRef, {
    open,
    onDismiss: onClose,
    trapFocus: true,
    lockScroll: true,
    closeOnOutsideClick: true,
  });

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div aria-hidden="true" className="absolute inset-0 bg-foreground/40" />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'absolute inset-y-0 flex w-full flex-col bg-surface shadow-pop focus:outline-none',
          side === 'right' ? 'right-0' : 'left-0',
          WIDTH[width],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-base font-semibold text-foreground">
              {title}
            </h2>
            {description && <p className="mt-0.5 truncate text-sm text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-foreground"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className={cn('flex-1 overflow-y-auto px-5 py-5', bodyClassName)}>{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    drawerRoot(),
  );
}
