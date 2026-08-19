import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Avatar, Drawer, DropdownMenu, Icon, cn } from '@/components/basic';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types/enums';

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

/**
 * Điều hướng công khai - giữ nguyên vị trí kể cả khi chủ nuôi đã đăng nhập.
 *
 * Chủ nuôi vẫn là khách của trang giới thiệu: họ xem dịch vụ rồi đặt lịch cho bé đã có
 * hồ sơ. Thay nhóm này bằng một menu tài khoản khi đăng nhập sẽ cắt mất đúng con đường
 * họ hay đi.
 */
const PUBLIC_NAV: NavItem[] = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/services', label: 'Dịch vụ' },
  { to: '/doctors', label: 'Bác sĩ' },
  { to: '/branches', label: 'Chi nhánh' },
  { to: '/chat', label: 'Tư vấn AI' },
];

/** Phần THÊM VÀO khi đã đăng nhập bằng tài khoản chủ nuôi. */
const OWNER_NAV: NavItem[] = [
  { to: '/my/pets', label: 'Thú cưng của tôi' },
  { to: '/my/appointments', label: 'Lịch hẹn' },
];

function desktopNavClass({ isActive }: { isActive: boolean }): string {
  return cn(
    'relative py-1.5 text-sm transition-colors',
    isActive
      ? 'font-semibold text-primary after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-primary'
      : 'text-foreground hover:text-primary',
  );
}

function drawerNavClass({ isActive }: { isActive: boolean }): string {
  return cn(
    'flex min-h-touch items-center rounded-lg px-3 text-sm transition-colors',
    isActive ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground hover:bg-surface-muted',
  );
}

/**
 * Thanh trên của trang công khai và khu chủ nuôi.
 *
 * Hai trạng thái, MỘT cấu trúc (xem `docs/01-thong-tin-kien-truc.md` mục 3.5): phần
 * tài khoản được thêm vào bên phải chứ không thay thế điều hướng công khai.
 *
 * "Đặt lịch khám" là hành động chính của cả zone nên luôn hiện, kể cả ở 320px - đó là
 * lý do nó nằm ngoài menu gấp chứ không nằm trong.
 */
export function PublicHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isOwner = user?.role === Role.PET_OWNER;
  const navItems = isOwner ? [...PUBLIC_NAV, ...OWNER_NAV] : PUBLIC_NAV;

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <nav aria-label="Điều hướng chính" className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          >
            <Icon name="stethoscope" className="h-5 w-5" />
          </span>
          <span className="hidden text-base font-semibold text-foreground sm:block">
            Phòng khám thú y
          </span>
        </Link>

        <div className="hidden flex-1 items-center gap-5 lg:flex">
          {PUBLIC_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={desktopNavClass}>
              {item.label}
            </NavLink>
          ))}
          {isOwner && (
            <>
              <span aria-hidden="true" className="h-5 w-px bg-border" />
              {OWNER_NAV.map((item) => (
                <NavLink key={item.to} to={item.to} className={desktopNavClass}>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Link
            to="/booking"
            className="inline-flex min-h-touch items-center rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Đặt lịch khám
          </Link>

          {user ? (
            <DropdownMenu
              items={[
                { id: 'pets', label: 'Thú cưng của tôi', icon: 'paw', to: '/my/pets' },
                {
                  id: 'appointments',
                  label: 'Lịch hẹn của tôi',
                  icon: 'appointments',
                  to: '/my/appointments',
                },
                { id: 'logout', label: 'Đăng xuất', icon: 'logout', onSelect: () => void logout() },
              ]}
              trigger={({ ref, onClick, ...aria }) => (
                <button
                  ref={ref}
                  type="button"
                  onClick={onClick}
                  {...aria}
                  aria-label="Menu tài khoản"
                  className="flex min-h-touch min-w-touch items-center justify-center rounded-lg hover:bg-surface-muted"
                >
                  <Avatar name={user.phone} size="sm" />
                </button>
              )}
            />
          ) : (
            <Link
              to="/login"
              className="hidden min-h-touch items-center rounded-lg border border-border px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted sm:inline-flex"
            >
              Đăng nhập
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Mở menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground hover:bg-surface-muted lg:hidden"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/*
        Màn hình hẹp dùng ngăn kéo thay cho bảng gấp trong luồng. Bảng gấp đẩy nội dung
        trang xuống khi mở, nên bấm "menu" xong thứ đang đọc nhảy đi mất; ngăn kéo phủ
        lên trên và trả lại đúng vị trí cũ khi đóng.
      */}
      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Điều hướng"
        side="left"
        width="sm"
        className="lg:hidden"
      >
        <div className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={drawerNavClass}>
              {item.label}
            </NavLink>
          ))}

          <div className="mt-4 border-t border-border pt-4">
            {user ? (
              <button
                type="button"
                onClick={() => void logout()}
                className="flex min-h-touch w-full items-center rounded-lg px-3 text-left text-sm text-muted hover:bg-surface-muted hover:text-foreground"
              >
                Đăng xuất
              </button>
            ) : (
              <>
                <NavLink to="/login" className={drawerNavClass}>
                  Đăng nhập
                </NavLink>
                <NavLink to="/register" className={drawerNavClass}>
                  Đăng ký tài khoản
                </NavLink>
              </>
            )}
          </div>
        </div>
      </Drawer>
    </header>
  );
}
