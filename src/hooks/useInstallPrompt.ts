import { useCallback, useState, useSyncExternalStore } from 'react';

// Chromium-only event; not in the DOM lib typings.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'vetcare.install-dismissed-at';
const DISMISS_FOR_MS = 30 * 24 * 60 * 60 * 1000;

export type InstallMode = 'prompt' | 'ios' | null;

// The browser fires `beforeinstallprompt` once, often before the auth bootstrap
// finishes and the banner mounts, so it is captured at module load instead of
// in an effect.
let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    notify();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const ios =
    /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
  // Other iOS browsers cannot add to the home screen themselves; only Safari's share sheet can.
  return ios && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

function wasDismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISSED_KEY));
    return at > 0 && Date.now() - at < DISMISS_FOR_MS;
  } catch {
    return false;
  }
}

/**
 * Which "install this app" invitation the current browser supports: the native
 * prompt (Android/desktop Chromium), manual steps in iOS Safari, or none
 * (already installed, dismissed recently, or unsupported browser).
 */
export function useInstallPrompt() {
  const event = useSyncExternalStore(subscribe, () => deferred, () => null);
  const isInstalled = useSyncExternalStore(subscribe, () => installed, () => false);
  const [dismissed, setDismissed] = useState(() => isStandalone() || wasDismissedRecently());

  const install = useCallback(async () => {
    if (!deferred) return;
    const current = deferred;
    deferred = null;
    notify();
    await current.prompt();
    const { outcome } = await current.userChoice;
    if (outcome === 'accepted') setDismissed(true);
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // Storage blocked: the invitation simply comes back next visit.
    }
  }, []);

  let mode: InstallMode = null;
  if (!dismissed && !isInstalled) mode = event ? 'prompt' : isIosSafari() ? 'ios' : null;

  return { mode, install, dismiss };
}
