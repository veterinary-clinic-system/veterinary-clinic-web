import { ErrorState, ForbiddenState } from '@/components/basic';
import { useAuth } from '@/context/AuthContext';
import { STAFF_ROLES } from '@/types/enums';
import { isForbiddenError } from '@/utils/errors';

export interface QueryErrorStateProps {
  
  error: unknown;
  
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

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
