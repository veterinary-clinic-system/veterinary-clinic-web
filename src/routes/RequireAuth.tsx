import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ForbiddenState } from '@/components/basic';
import { useAuth } from '@/context/AuthContext';
import { Role, STAFF_ROLES } from '@/types/enums';

/**
 * Cổng TRẢI NGHIỆM của router - không phải hàng rào bảo mật (tài liệu kiến trúc mục
 * 3.1: backend với `role_permissions` mới là nơi quyết định thật). Ở đây chỉ có ba
 * nhánh, và cái thứ ba là thứ trước đây còn thiếu:
 *
 *   chưa đăng nhập          -> /login, nhớ đường dẫn đang muốn vào
 *   sai KHU VỰC             -> đẩy về khu của mình
 *   đúng khu, thiếu QUYỀN   -> nói thẳng là không có quyền
 *
 * Vì sao nhánh thứ ba không chuyển hướng im lặng: một nhân viên bấm vào liên kết đồng
 * nghiệp gửi (`/staff/reports`) mà bị ném về Tổng quan sẽ tưởng liên kết hỏng và bấm
 * lại vài lần nữa. Hiện ra câu "tài khoản này không được cấp quyền cho khu vực đó" kèm
 * một lối ra là chấm dứt vòng lặp đó - và cũng là trạng thái thứ năm mà mục 5.5 của
 * tài liệu bắt mọi màn hình phải có.
 *
 * Nhánh thứ hai vẫn giữ chuyển hướng, vì đó không phải chuyện thiếu quyền: chủ nuôi lạc
 * vào `/staff` thì thứ đúng đắn là trang của họ, không phải khung làm việc của phòng
 * khám với sidebar rỗng bao quanh một lời từ chối.
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
    const isStaff = STAFF_ROLES.includes(user.role);
    const inStaffConsole = location.pathname.startsWith('/staff');

    // Sai khu vực: nhân viên lạc sang khu chủ nuôi, hoặc chủ nuôi lạc vào khu nhân viên.
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
