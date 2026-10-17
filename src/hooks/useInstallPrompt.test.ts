import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useInstallPrompt } from './useInstallPrompt';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function fireInstallPrompt(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn(async () => {}),
    userChoice: Promise.resolve({ outcome }),
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

describe('useInstallPrompt', () => {
  it('keeps a prompt fired before the banner mounts', () => {
    const event = fireInstallPrompt();
    expect(event.defaultPrevented).toBe(true);

    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.mode).toBe('prompt');
  });

  it('shows the native prompt once and hides after the user accepts', async () => {
    const event = fireInstallPrompt('accepted');
    const { result } = renderHook(() => useInstallPrompt());

    await act(() => result.current.install());

    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(result.current.mode).toBeNull();
  });

  it('remembers "Không, cảm ơn" across visits', () => {
    fireInstallPrompt();
    const first = renderHook(() => useInstallPrompt());
    act(() => first.result.current.dismiss());
    expect(first.result.current.mode).toBeNull();
    first.unmount();

    fireInstallPrompt();
    const second = renderHook(() => useInstallPrompt());
    expect(second.result.current.mode).toBeNull();
  });
});
