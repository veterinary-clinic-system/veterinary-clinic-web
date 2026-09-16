import { Outlet } from 'react-router-dom';
import { PublicFooter } from './public/PublicFooter';
import { PublicHeader } from './public/PublicHeader';
import { GardenBackdrop } from './public/GardenBackdrop';
import { useGardenMotion } from './public/useGardenMotion';

export function PublicLayout() {
  const { paused, toggle } = useGardenMotion();
  return (
    <div
      className="pet-public garden-experience flex min-h-screen flex-col"
      data-motion={paused ? 'paused' : 'playing'}
    >
      <GardenBackdrop paused={paused} />
      <a
        href="#noi-dung-chinh"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:font-medium focus:text-primary-foreground"
      >
        Bỏ qua điều hướng, tới nội dung chính
      </a>

      <PublicHeader />

      <main id="noi-dung-chinh" className="flex-1">
        <Outlet />
      </main>

      <PublicFooter />
      <button
        type="button"
        className="garden-motion-control"
        onClick={toggle}
        aria-pressed={paused}
        aria-label={paused ? 'Bật chuyển động nền' : 'Tạm dừng chuyển động nền'}
      >
        <span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span>
        <span>{paused ? 'Bật chuyển động' : 'Dừng chuyển động'}</span>
      </button>
    </div>
  );
}
