import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Drawer, cn } from '@/components/basic';
import { useAuth } from '@/context/AuthContext';
import { StaffSidebar } from './staff/StaffSidebar';
import { StaffTopbar } from './staff/StaffTopbar';
import { isClinicalPath } from './staff/nav-model';

const COLLAPSE_KEY = 'vetcare:sidebar-collapsed';

/**
 * Khung của khu nhân viên - dùng chung cho CẢ HAI zone `clinical` và `admin`.
 *
 * Zone là ranh giới gói JavaScript, không phải ranh giới thị giác: bác sĩ và quản lý
 * nhìn cùng một khung, cùng một bộ component, chỉ khác nội dung điều hướng và mật độ.
 * Xem `docs/01-thong-tin-kien-truc.md` mục 1.
 *
 * Bố cục:
 *
 *     +---------------------------------------------+
 *     | Topbar: breadcrumb, chuông, chi nhánh, avatar|
 *     +----------+----------------------------------+
 *     | Sidebar  | Nội dung trang                    |
 *     | 6 nhóm   | (cuộn độc lập với sidebar)        |
 *     +----------+----------------------------------+
 *
 * Sidebar chỉ cố định từ `lg` trở lên. Dưới ngưỡng đó nó là `Drawer` - trên 1024px thì
 * 240px điều hướng cố định chiếm gần một phần tư màn hình và không còn chỗ cho bảng.
 */
export function StaffLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  /*
    Nhớ trạng thái thu gọn giữa các phiên: người đã chọn màn hình rộng cho bảng thì lần
    sau mở lên vẫn muốn như vậy, không phải thu gọn lại mỗi sáng.
  */
  const [collapsed, setCollapsed] = useState<boolean>(
    () => localStorage.getItem(COLLAPSE_KEY) === '1',
  );

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  /* Đổi trang thì đóng drawer - nếu không, bấm một mục xong menu vẫn che nội dung. */
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  /*
    Mật độ đặt ở GỐC theo đường dẫn, không phải theo zone: `data-density` chảy xuống
    mọi component qua CSS variable (xem src/index.css), nên không component nào phải
    nhận thêm một prop chỉ để biết mình đang ở màn hình lâm sàng hay quản trị.
  */
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
