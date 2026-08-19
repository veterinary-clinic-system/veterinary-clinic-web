import { ErrorState, ForbiddenState } from '@/components/basic';
import { useAuth } from '@/context/AuthContext';
import { STAFF_ROLES } from '@/types/enums';
import { isForbiddenError } from '@/utils/errors';

export interface QueryErrorStateProps {
  /** Lỗi của react-query - `query.error`. */
  error: unknown;
  /** Tiêu đề khi lỗi là lỗi tải dữ liệu thường. */
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Một lỗi tải dữ liệu, HAI màn hình.
 *
 * `RequireAuth` chỉ chặn được theo VAI TRÒ, mà ma trận `role_permissions` của backend
 * mịn hơn thế: một quản lý vào được `/staff/pharmacy` để xem, nhưng vài lời gọi API
 * trong trang vẫn có thể trả 403; một tài khoản bị thu hồi quyền giữa phiên làm việc
 * cũng vậy. Những lần đó, `ErrorState` với nút "Thử lại" là câu trả lời sai - bấm bao
 * nhiêu lần cũng vẫn 403, và người dùng không biết là do quyền chứ không phải do mạng.
 *
 * Không nằm trong `components/basic/`: design system chỉ biết vẽ, không biết gì về
 * axios hay về vai trò đang đăng nhập. Đây là chỗ nối hai thứ đó lại.
 */
export function QueryErrorState({
  error,
  title,
  description,
  onRetry,
  className,
}: QueryErrorStateProps) {
  const { user } = useAuth();

  if (isForbiddenError(error)) {
    const isStaff = user !== null && STAFF_ROLES.includes(user.role);
    return (
      <ForbiddenState
        description="Tài khoản của bạn không được cấp quyền xem dữ liệu này. Nếu bạn cho rằng đây là nhầm lẫn, liên hệ quản trị viên của phòng khám."
        backTo={isStaff ? '/staff' : '/'}
        backLabel={isStaff ? 'Về Tổng quan' : 'Về trang chủ'}
        className={className}
      />
    );
  }

  return (
    <ErrorState title={title} description={description} onRetry={onRetry} className={className} />
  );
}
