import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GardenBackdrop } from './GardenBackdrop';

const mocks = vi.hoisted(() => ({ create: vi.fn(), dispose: vi.fn(), setPaused: vi.fn() }));
vi.mock('./garden-scene', () => ({ createGardenScene: mocks.create }));
beforeEach(() => {
  mocks.create.mockReset();
  mocks.dispose.mockReset();
  mocks.setPaused.mockReset();
  mocks.create.mockReturnValue({ dispose: mocks.dispose, setPaused: mocks.setPaused });
});
afterEach(cleanup);

describe('Public garden lifecycle', () => {
  it('passes the reduced-motion preference to the renderer before the first frame', async () => {
    render(<GardenBackdrop paused />);
    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith(expect.any(HTMLDivElement), true),
    );
  });
  it('pauses the running renderer without recreating the canvas', async () => {
    const { rerender } = render(<GardenBackdrop paused={false} />);
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    rerender(<GardenBackdrop paused />);
    expect(mocks.setPaused).toHaveBeenLastCalledWith(true);
    expect(mocks.create).toHaveBeenCalledTimes(1);
  });
  it('releases GPU resources when leaving the public layout', async () => {
    const { unmount } = render(<GardenBackdrop paused={false} />);
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    unmount();
    expect(mocks.dispose).toHaveBeenCalledTimes(1);
  });
  it('retains the CSS background if WebGL is unavailable', async () => {
    mocks.create.mockImplementation(() => {
      throw new Error('WebGL unavailable');
    });
    const { container } = render(<GardenBackdrop paused={false} />);
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    expect(container.querySelector('.garden-light-sun')).toBeTruthy();
    expect(container.querySelector('.garden-backdrop')?.getAttribute('aria-hidden')).toBe('true');
  });
  it('does not initialize a renderer if navigation wins the asynchronous import', async () => {
    const { unmount } = render(<GardenBackdrop paused={false} />);
    unmount();
    await Promise.resolve();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
