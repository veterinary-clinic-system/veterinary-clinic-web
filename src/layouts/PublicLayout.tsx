import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types/enums';

/**
 * Shell for the marketing site + public booking flow (prompt.md Section 7.2).
 *
 * Điều hướng dùng `NavLink` chứ không phải `Link`: mục đang mở phải tự đánh dấu khi
 * đổi tab. `end` chỉ đặt cho "/" để trang chủ không sáng ở mọi route con.
 */
const NAV_ITEMS: { to: string; label: string; end?: boolean }[] = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/services', label: 'Dịch vụ' },
  { to: '/doctors', label: 'Bác sĩ' },
  { to: '/branches', label: 'Chi nhánh' },
  { to: '/chat', label: 'Tư vấn AI' },
];

function navClass({ isActive }: { isActive: boolean }): string {
  return (
    'relative py-1.5 transition-colors ' +
    (isActive
      ? 'font-semibold text-primary after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary'
      : 'text-foreground hover:text-primary')
  );
}

export function PublicLayout() {
  const { user, logout } = useAuth();
  const accountHref = user?.role === Role.PET_OWNER ? '/my/appointments' : '/staff';

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-foreground">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              🐾
            </span>
            Phòng khám thú y
          </Link>

          <div className="flex items-center gap-5 text-sm">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                {item.label}
              </NavLink>
            ))}

            <NavLink
              to="/booking"
              className={({ isActive }) =>
                'rounded-lg px-3.5 py-2 font-semibold shadow-sm transition-colors ' +
                (isActive
                  ? 'bg-primary/90 text-primary-foreground ring-2 ring-primary/30'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90')
              }
            >
              Đặt lịch khám
            </NavLink>

            {user ? (
              <>
                {/*
                  Hai trang chính của tài khoản chủ nuôi (phản hồi nghiệm thu #9) được
                  đưa thẳng lên thanh điều hướng thay vì giấu sau một mục "Tài khoản".
                */}
                {user.role === Role.PET_OWNER ? (
                  <>
                    <NavLink to="/my/appointments" className={navClass}>
                      Lịch hẹn của tôi
                    </NavLink>
                    <NavLink to="/my/pets" className={navClass}>
                      Thú cưng của tôi
                    </NavLink>
                  </>
                ) : (
                  <NavLink to={accountHref} className={navClass}>
                    Tài khoản
                  </NavLink>
                )}
                <button onClick={() => void logout()} className="text-muted hover:text-foreground">
                  Đăng xuất
                </button>
              </>
            ) : (
              <NavLink to="/login" className={navClass}>
                Đăng nhập
              </NavLink>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface px-4 py-6 text-center text-sm text-muted">
        © {new Date().getFullYear()} Veterinary Clinic System - Đồ án tốt nghiệp
      </footer>
    </div>
  );
}
