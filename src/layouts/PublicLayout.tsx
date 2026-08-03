import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * Shell for the marketing site + public booking flow (prompt.md Section 7.2). Kept
 * visually minimal until DESIGN.md exists - see src/components/Placeholder.tsx.
 */
export function PublicLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-semibold">
            Phòng khám thú y
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/branches">Chi nhánh</Link>
            <Link to="/doctors">Bác sĩ</Link>
            <Link to="/chat">Tư vấn AI</Link>
            <Link to="/booking" className="rounded bg-primary px-3 py-1.5 text-primary-foreground">
              Đặt lịch khám
            </Link>
            {user ? (
              <>
                <Link to={user.role === 'PET_OWNER' ? '/my/appointments' : '/staff'}>Tài khoản</Link>
                <button onClick={() => void logout()}>Đăng xuất</button>
              </>
            ) : (
              <Link to="/login">Đăng nhập</Link>
            )}
          </div>
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border px-4 py-6 text-center text-sm text-muted">
        © {new Date().getFullYear()} Veterinary Clinic System - Đồ án tốt nghiệp
      </footer>
    </div>
  );
}
