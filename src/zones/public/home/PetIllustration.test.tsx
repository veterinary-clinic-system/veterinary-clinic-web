import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PetIllustration } from './PetIllustration';

let reducedMotion = false;
let paused = true;
beforeEach(() => {
  reducedMotion = false;
  paused = true;
  vi.stubGlobal('matchMedia', () => ({ matches: reducedMotion, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockImplementation(() => paused);
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
    paused = false;
    this.dispatchEvent(new Event('play'));
    return Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (this: HTMLMediaElement) {
    paused = true;
    this.dispatchEvent(new Event('pause'));
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Homepage footage', () => {
  it('plays real footage and lets the visitor pause and resume', () => {
    render(<PetIllustration />);
    fireEvent.click(screen.getByRole('button', { name: 'Tạm dừng video thú cưng' }));
    expect(paused).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Phát video thú cưng' }));
    expect(paused).toBe(false);
  });
  it('respects reduced motion and still allows deliberate playback', () => {
    reducedMotion = true;
    render(<PetIllustration />);
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Phát video thú cưng' }));
    expect(paused).toBe(false);
  });
  it('keeps a play button if the browser blocks autoplay', async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValue(new Error('NotAllowedError'));
    render(<PetIllustration />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Phát video thú cưng' })).toBeTruthy());
  });
  it('retains a poster and hides unusable playback controls on a media error', () => {
    const { container } = render(<PetIllustration />);
    const video = container.querySelector('video')!;
    fireEvent.error(video);
    expect(video.poster).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
