import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { STAFF_ROLES } from '@/types/enums';

export function StaffConsoleOnly() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (user && STAFF_ROLES.includes(user.role)) {
    return <Navigate to="/staff" replace />;
  }

  return <Outlet />;
}
