import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ForbiddenState } from '@/components/basic';
import { useAuth } from '@/context/AuthContext';
import { Role, STAFF_ROLES } from '@/types/enums';

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
    const isStaff = STAFF_ROLES.includes(user.role);
    const inStaffConsole = location.pathname.startsWith('/staff');

    if (isStaff !== inStaffConsole) {
      return <Navigate to={isStaff ? '/staff' : '/'} replace />;
    }

    return (
      <ForbiddenState
        backTo={isStaff ? '/staff' : '/'}
        backLabel={isStaff ? 'Về Tổng quan' : 'Về trang chủ'}
      />
    );
  }

  return <Outlet />;
}
