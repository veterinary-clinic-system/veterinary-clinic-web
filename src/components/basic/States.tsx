import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { Icon } from './Icon';
import { cn } from './utils';

/**
 * Ba trạng thái mà mọi danh sách đều phải có: đang tải, rỗng, lỗi.
 *
 * Trước đây mỗi trang tự viết một câu ("Không tìm thấy...", "Không thể tải..."), nên
 * chỗ thì là một dòng chữ xám lọt thỏm, chỗ thì không có gì cả - người dùng nhìn một
 * màn hình trắng và không biết là đang tải, hỏng, hay thật sự chưa có dữ liệu.
 */

export interface EmptyStateProps {
  /** Biểu tượng gợi ý - emoji là đủ, dự án chưa có bộ icon riêng. */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Hành động đưa người dùng thoát khỏi trạng thái rỗng (tạo mới, xoá bộ lọc...). */
  action?: ReactNode;
  className?: string;
}

/**
 * `role="status"` chứ không phải `alert`: danh sách rỗng là thông tin bình thường, đọc
 * xen vào chứ không cắt ngang thứ người dùng đang nghe.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <span aria-hidden="true" className="text-3xl opacity-60">
          {icon}
        </span>
      )}
      <h3 className="mt-3 text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  /** Câu giải thích cho người dùng - KHÔNG phải thông báo lỗi kỹ thuật. */
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * `role="alert"` để trình đọc màn hình báo ngay - khác với `EmptyState`, đây là thứ
 * người dùng cần biết lập tức vì thao tác của họ đã không thành.
 */
export function ErrorState({
  title = 'Không tải được dữ liệu',
  description = 'Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.',
  onRetry,
  retryLabel = 'Thử lại',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center',
        className,
      )}
    >
      {/* Có cả biểu tượng lẫn chữ: không dựa mỗi màu đỏ để truyền đạt "hỏng". */}
      <span aria-hidden="true" className="text-2xl">
        ⚠️
      </span>
      <h3 className="mt-2 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export interface ForbiddenStateProps {
  title?: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
  className?: string;
}

/**
 * Màn hình "không có quyền".
 *
 * Lý do phải có, thay vì cứ điều hướng về trang chủ: một cú chuyển hướng im lặng khiến
 * người dùng tưởng liên kết hỏng và bấm lại liên tục. Nói thẳng ra là tài khoản này
 * không được vào, kèm một lối ra rõ ràng.
 *
 * Đây vẫn chỉ là lớp trải nghiệm - backend mới là nơi chặn thật. Xem
 * `docs/01-thong-tin-kien-truc.md` mục 3.1.
 */
export function ForbiddenState({
  title = 'Bạn không có quyền truy cập trang này',
  description = 'Tài khoản của bạn không được cấp quyền cho khu vực này. Nếu bạn cho rằng đây là nhầm lẫn, liên hệ quản trị viên của phòng khám.',
  backTo = '/staff',
  backLabel = 'Về Tổng quan',
  className,
}: ForbiddenStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center rounded-xl border border-border bg-surface px-6 py-14 text-center',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft text-warning">
        <Icon name="shield" className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
      <Link
        to={backTo}
        className="mt-6 inline-flex min-h-touch items-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary/90"
      >
        {backLabel}
      </Link>
    </div>
  );
}
