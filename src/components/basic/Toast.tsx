import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from './utils';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

export interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

const VARIANT_BORDER_CLASSES: Record<ToastVariant, string> = {
  success: 'border-l-triage-green',
  error: 'border-l-destructive',
  info: 'border-l-primary',
};

const VARIANT_DOT_CLASSES: Record<ToastVariant, string> = {
  success: 'bg-triage-green',
  error: 'bg-destructive',
  info: 'bg-primary',
};

/**
 * Mount once near the app root (in main.tsx / App.tsx - out of scope for this
 * component library, another agent owns that wiring) so any descendant can call
 * useToast().show(...). Renders its stack bottom-right via a fixed-position container
 * that lives alongside `children`, no portal needed.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((current) => [...current, { id, message, variant }]);
      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  // Clear any pending auto-dismiss timers if the provider itself unmounts.
  useEffect(() => {
    const timersMap = timers.current;
    return () => {
      timersMap.forEach((timer) => clearTimeout(timer));
      timersMap.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            onClick={() => dismiss(toast.id)}
            className={cn(
              'pointer-events-auto flex items-start gap-2 rounded border border-border border-l-4 bg-surface px-3 py-2 text-left text-sm text-foreground shadow-md',
              'focus:outline-none focus:ring-2 focus:ring-primary',
              VARIANT_BORDER_CLASSES[toast.variant],
            )}
          >
            <span
              className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', VARIANT_DOT_CLASSES[toast.variant])}
              aria-hidden="true"
            />
            <span className="flex-1">{toast.message}</span>
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
