import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { STAFF_ROLES } from '@/types/enums';

/**
 * Tài khoản nhân viên chỉ làm việc trong giao diện `/staff`. Mọi route công khai
 * (kể cả "/") tự chuyển hướng về đó khi người đang đăng nhập là nhân viên.
 *
 * Giống `RequireAuth`, đây là hàng rào TRẢI NGHIỆM chứ không phải hàng rào bảo mật -
 * backend vẫn là nơi chặn thật.
 */
export function StaffConsoleOnly() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (user && STAFF_ROLES.includes(user.role)) {
    return <Navigate to="/staff" replace />;
  }

  return <Outlet />;
}
