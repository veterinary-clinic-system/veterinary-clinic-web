import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Drawer, cn } from '@/components/basic';
import { useAuth } from '@/context/AuthContext';
import { StaffSidebar } from './staff/StaffSidebar';
import { StaffTopbar } from './staff/StaffTopbar';
import { isClinicalPath } from './staff/nav-model';

const COLLAPSE_KEY = 'vetcare:sidebar-collapsed';

export function StaffLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [collapsed, setCollapsed] = useState<boolean>(
    () => localStorage.getItem(COLLAPSE_KEY) === '1',
  );

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const density = isClinicalPath(location.pathname, user?.role) ? 'compact' : 'comfortable';

  return (
    <div data-density={density} className="flex min-h-screen bg-surface-muted">
      <a
        href="#noi-dung-chinh"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:font-medium focus:text-primary-foreground"
      >
        Bỏ qua điều hướng, tới nội dung chính
      </a>

      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 border-r border-border transition-[width] lg:block',
          collapsed ? 'w-[68px]' : 'w-60',
        )}
      >
        <StaffSidebar
          role={user?.role}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((value) => !value)}
        />
      </aside>

      <Drawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        title="Điều hướng"
        side="left"
        width="sm"
        className="lg:hidden"
        bodyClassName="p-0"
      >
        <StaffSidebar
          bare
          role={user?.role}
          collapsed={false}
          onToggleCollapse={() => undefined}
          onNavigate={() => setMobileNavOpen(false)}
        />
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <StaffTopbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main id="noi-dung-chinh" className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
