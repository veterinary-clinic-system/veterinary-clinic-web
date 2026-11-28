import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
const mockSocket = {
  emit: vi.fn(),
  on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
    const set = listeners.get(event) ?? new Set();
    set.add(cb);
    listeners.set(event, set);
  }),
  off: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
    listeners.get(event)?.delete(cb);
  }),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

import { useRealtimeBranchRoom } from './socket';

function RoomHarness({
  branchId,
  enabled = true,
}: {
  branchId: string | null | undefined;
  enabled?: boolean;
}) {
  useRealtimeBranchRoom(branchId, enabled);
  return null;
}

describe('useRealtimeBranchRoom — BUG-14', () => {
  beforeEach(() => {
    listeners.clear();
    mockSocket.emit.mockClear();
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('emit branch:join khi mount, tự join lại khi connect và emit branch:leave + gỡ listener khi unmount', () => {
    const { unmount } = render(<RoomHarness branchId="branch-1" enabled />);

    expect(mockSocket.emit).toHaveBeenCalledWith('branch:join', { branchId: 'branch-1' });
    expect(listeners.get('connect')?.size).toBe(1);

    mockSocket.emit.mockClear();
    for (const cb of listeners.get('connect') ?? []) {
      cb();
    }
    expect(mockSocket.emit).toHaveBeenCalledWith('branch:join', { branchId: 'branch-1' });

    mockSocket.emit.mockClear();
    unmount();
    expect(listeners.get('connect')?.size).toBe(0);
    expect(mockSocket.emit).toHaveBeenCalledWith('branch:leave', { branchId: 'branch-1' });
  });

  it('chuẩn hóa undefined/null thành { branchId: null } cho ADMIN', () => {
    const { unmount } = render(<RoomHarness branchId={undefined} enabled />);

    expect(mockSocket.emit).toHaveBeenCalledWith('branch:join', { branchId: null });
    unmount();
    expect(mockSocket.emit).toHaveBeenCalledWith('branch:leave', { branchId: null });
  });

  it('không emit gì khi enabled = false', () => {
    render(<RoomHarness branchId="branch-1" enabled={false} />);

    expect(mockSocket.emit).not.toHaveBeenCalled();
    expect(mockSocket.on).not.toHaveBeenCalled();
  });
});
