import { Outlet } from 'react-router-dom';
import { PublicFooter } from './public/PublicFooter';
import { PublicHeader } from './public/PublicHeader';

export function PublicLayout() {
  return (
    <div className="pet-public flex min-h-screen flex-col bg-surface-muted">
      {}
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
    </div>
  );
}
