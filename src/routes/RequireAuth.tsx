import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types/enums';

/**
 * UX-only gate (prompt.md Section 7.2: "frontend guards are UX, never the security
 * boundary" - the backend's JwtAuthGuard/RolesGuard are the real enforcement). Redirects
 * to /login when unauthenticated, or to a role-appropriate home when the role doesn't
 * match `allow`.
 */
export function RequireAuth({ allow }: { allow?: Role[] }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allow && !allow.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
