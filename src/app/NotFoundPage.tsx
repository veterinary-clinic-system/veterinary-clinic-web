import { Link } from 'react-router-dom';
import { Icon } from '@/components/basic';
import { useAuth } from '@/context/AuthContext';
import { STAFF_ROLES } from '@/types/enums';

/**
 * 404 - nằm NGOÀI cả hai khung hiển thị, vì router không biết đường dẫn hỏng này lẽ ra
 * thuộc về khung nào.
 *
 * Bù lại, lối ra phải đúng người: một lễ tân gõ nhầm `/staff/appointmnets` mà bị mời
 * "Về trang chủ" sẽ rơi ra trang giới thiệu phòng khám rồi bị `StaffConsoleOnly` đẩy
 * ngược lại `/staff` - hai lần nhảy trang cho một cú gõ nhầm. Đưa thẳng họ về Tổng quan.
 */
export function NotFoundPage() {
  const { user } = useAuth();
  const isStaff = user !== null && STAFF_ROLES.includes(user.role);
  const backTo = isStaff ? '/staff' : '/';

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted text-muted">
        <Icon name="search" className="h-7 w-7" />
      </span>

      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted">Lỗi 404</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
        Không tìm thấy trang này
      </h1>
      <p className="mt-2 text-sm text-muted">
        Đường dẫn có thể đã bị gõ sai, hoặc trang đã được chuyển đi nơi khác.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to={backTo}
          className="inline-flex min-h-touch items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {isStaff ? 'Về Tổng quan' : 'Về trang chủ'}
        </Link>
        {!isStaff && (
          <Link
            to="/booking"
            className="inline-flex min-h-touch items-center rounded-lg border border-border px-5 text-sm font-semibold text-foreground hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Đặt lịch khám
          </Link>
        )}
      </div>
    </main>
  );
}
