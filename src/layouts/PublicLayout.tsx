import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types/enums';

/**
 * Shell for the marketing site + public booking flow (prompt.md Section 7.2).
 *
 * Điều hướng dùng `NavLink` chứ không phải `Link`: mục đang mở phải tự đánh dấu khi
 * đổi tab, và `NavLink` còn tự đặt `aria-current="page"` nên trình đọc màn hình cũng
 * biết đang ở đâu. `end` chỉ đặt cho "/" để trang chủ không sáng ở mọi route con.
 *
 * Trên màn hình hẹp, danh sách này gấp vào một bảng đóng/mở: ở 375px hàng ngang cũ
 * rộng 501px, làm CẢ TRANG cuộn ngang - lỗi thấy được trên mọi trang công khai.
 */
interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/services', label: 'Dịch vụ' },
  { to: '/doctors', label: 'Bác sĩ' },
  { to: '/branches', label: 'Chi nhánh' },
  { to: '/chat', label: 'Tư vấn AI' },
];

/** Mục điều hướng ngang (thanh trên màn hình rộng). */
function navClass({ isActive }: { isActive: boolean }): string {
  return (
    'relative py-1.5 transition-colors ' +
    (isActive
      ? 'font-semibold text-primary after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary'
      : 'text-foreground hover:text-primary')
  );
}

/**
 * Mục điều hướng trong bảng gấp. Dạng hàng cao 44px chứ không phải chữ trơn: đây là
 * mục tiêu chạm trên điện thoại, và 44px là ngưỡng tối thiểu dùng được bằng ngón tay.
 */
function mobileNavClass({ isActive }: { isActive: boolean }): string {
  return (
    'flex min-h-[44px] items-center rounded-lg px-3 transition-colors ' +
    (isActive ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground hover:bg-surface-muted')
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      {open ? (
        <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
      ) : (
        <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
      )}
    </svg>
  );
}

export function PublicLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isOwner = user?.role === Role.PET_OWNER;
  const accountHref = isOwner ? '/my/appointments' : '/staff';

  /* Đổi trang thì đóng bảng gấp - nếu không, bấm một mục xong menu vẫn che nội dung. */
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  /* Esc đóng menu: cùng phản xạ với mọi lớp phủ khác trên web. */
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  /*
    Hai trang chính của tài khoản chủ nuôi (phản hồi nghiệm thu #9) được đưa thẳng lên
    thanh điều hướng thay vì giấu sau một mục "Tài khoản".
  */
  const accountItems: NavItem[] = isOwner
    ? [
        { to: '/my/appointments', label: 'Lịch hẹn của tôi' },
        { to: '/my/pets', label: 'Thú cưng của tôi' },
      ]
    : user
      ? [{ to: accountHref, label: 'Tài khoản' }]
      : [];

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      {/*
        Lối tắt cho người đi bằng bàn phím: nhấn Tab lần đầu là nhảy thẳng tới nội dung,
        không phải lách qua toàn bộ thanh điều hướng trên mỗi trang.
      */}
      <a
        href="#noi-dung-chinh"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:font-medium focus:text-primary-foreground"
      >
        Bỏ qua điều hướng, tới nội dung chính
      </a>

      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
        <nav aria-label="Điều hướng chính" className="mx-auto max-w-6xl px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link to="/" className="flex shrink-0 items-center gap-2 text-lg font-bold text-foreground">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"
              >
                🐾
              </span>
              <span className="hidden sm:inline">Phòng khám thú y</span>
            </Link>

            {/* Thanh ngang - chỉ từ lg trở lên, nơi thật sự đủ chỗ cho cả 7 mục. */}
            <div className="hidden items-center gap-5 text-sm lg:flex">
              {[...NAV_ITEMS, ...accountItems].map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                  {item.label}
                </NavLink>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <NavLink
                to="/booking"
                className={({ isActive }) =>
                  'hidden rounded-lg px-3.5 py-2 text-sm font-semibold shadow-sm transition-colors sm:inline-flex ' +
                  (isActive
                    ? 'bg-primary/90 text-primary-foreground ring-2 ring-primary/30'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90')
                }
              >
                Đặt lịch khám
              </NavLink>

              {user ? (
                <button
                  onClick={() => void logout()}
                  className="hidden text-sm text-muted hover:text-foreground lg:inline"
                >
                  Đăng xuất
                </button>
              ) : (
                <NavLink to="/login" className={'hidden text-sm lg:inline ' + 'text-foreground hover:text-primary'}>
                  Đăng nhập
                </NavLink>
              )}

              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-controls="menu-dieu-huong"
                aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground hover:bg-surface-muted lg:hidden"
              >
                <MenuIcon open={menuOpen} />
              </button>
            </div>
          </div>

          {/*
            Giữ trong DOM và ẩn bằng `hidden` thay vì tháo ra: `aria-controls` ở nút trên
            phải trỏ tới một phần tử có thật thì trình đọc màn hình mới lần ra được.
          */}
          <div id="menu-dieu-huong" hidden={!menuOpen} className="border-t border-border py-3 lg:hidden">
            <div className="flex flex-col gap-1 text-sm">
              {[...NAV_ITEMS, ...accountItems].map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={mobileNavClass}>
                  {item.label}
                </NavLink>
              ))}

              <NavLink
                to="/booking"
                className="mt-2 flex min-h-[44px] items-center justify-center rounded-lg bg-primary px-3 font-semibold text-primary-foreground"
              >
                Đặt lịch khám
              </NavLink>

              {user ? (
                <button
                  onClick={() => void logout()}
                  className="mt-1 flex min-h-[44px] items-center rounded-lg px-3 text-left text-muted hover:bg-surface-muted hover:text-foreground"
                >
                  Đăng xuất
                </button>
              ) : (
                <NavLink to="/login" className={mobileNavClass}>
                  Đăng nhập
                </NavLink>
              )}
            </div>
          </div>
        </nav>
      </header>

      <main id="noi-dung-chinh" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="flex items-center gap-2 font-bold text-foreground">
              <span aria-hidden="true">🐾</span> Phòng khám thú y
            </p>
            <p className="mt-2 text-sm text-muted">
              Hệ thống phòng khám thú y nhiều chi nhánh - khám chữa bệnh, tiêm phòng và chăm sóc
              thú cưng.
            </p>
          </div>

          <nav aria-label="Liên kết nhanh">
            <h2 className="text-sm font-semibold text-foreground">Dịch vụ</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li>
                <Link to="/services" className="text-muted hover:text-primary">
                  Bảng giá dịch vụ
                </Link>
              </li>
              <li>
                <Link to="/booking" className="text-muted hover:text-primary">
                  Đặt lịch khám
                </Link>
              </li>
              <li>
                <Link to="/chat" className="text-muted hover:text-primary">
                  Tư vấn cùng AI
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Về phòng khám">
            <h2 className="text-sm font-semibold text-foreground">Phòng khám</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li>
                <Link to="/doctors" className="text-muted hover:text-primary">
                  Đội ngũ bác sĩ
                </Link>
              </li>
              <li>
                <Link to="/branches" className="text-muted hover:text-primary">
                  Chi nhánh
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold text-foreground">Giờ làm việc</h2>
            {/*
              `<dl>` chứ không phải hai dòng chữ: đây là các cặp nhãn - giá trị, và
              trình đọc màn hình đọc ra đúng quan hệ đó.
            */}
            <dl className="mt-3 space-y-1 text-sm text-muted">
              <div className="flex justify-between gap-4">
                <dt>Thứ Hai - Thứ Sáu</dt>
                <dd>07:00 - 17:30</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Thứ Bảy - Chủ Nhật</dt>
                <dd>Nghỉ</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-muted">
              Trường hợp cấp cứu ngoài giờ, vui lòng gọi trực tiếp chi nhánh gần nhất.
            </p>
          </div>
        </div>

        <div className="border-t border-border px-4 py-5 text-center text-sm text-muted">
          © {new Date().getFullYear()} Veterinary Clinic System - Đồ án tốt nghiệp
        </div>
      </footer>
    </div>
  );
}
