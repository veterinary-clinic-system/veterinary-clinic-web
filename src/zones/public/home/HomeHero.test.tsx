import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeHero } from './HomeHero';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const showHero = () =>
  render(
    <MemoryRouter>
      <HomeHero />
    </MemoryRouter>,
  );

describe('Garden homepage actions', () => {
  it('keeps the booking, service and owner-profile destinations', () => {
    showHero();
    expect(screen.getByRole('link', { name: /Đặt lịch cho bé/ }).getAttribute('href')).toBe(
      '/booking',
    );
    expect(screen.getByRole('link', { name: /Khám phá dịch vụ/ }).getAttribute('href')).toBe(
      '/services',
    );
    expect(screen.getByRole('link', { name: /Hồ sơ sức khỏe/ }).getAttribute('href')).toBe(
      '/my/pets',
    );
  });
  it('plays the film only on request, and stops it when the dialog closes', () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    const { container } = showHero();
    const dialog = container.querySelector('dialog')!;
    // jsdom has no native modal implementation; stub only this instance.
    const show = vi.fn(() => {
      dialog.open = true;
    });
    Object.defineProperty(dialog, 'showModal', { value: show });
    expect(play).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /XEM MỘT CHÚT YÊU THƯƠNG/ }));
    expect(show).toHaveBeenCalledOnce();
    expect(play).toHaveBeenCalledOnce();
    fireEvent(container.querySelector('dialog')!, new Event('close'));
    expect(pause).toHaveBeenCalledOnce();
  });
  it('loads pet artwork from Cloudinary instead of a local asset', () => {
    const { container } = showHero();
    const img = container.querySelector<HTMLImageElement>('.garden-photo img')!;
    expect(img.src).toContain('res.cloudinary.com');
    expect(img.src).toContain('/vetcare/web/images/golden-retriever-walking-v1.png');
  });
});
