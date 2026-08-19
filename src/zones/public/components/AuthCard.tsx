import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/basic';

export interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  /** Dòng cuối: câu hỏi + liên kết sang biểu mẫu còn lại. */
  footer: ReactNode;
}

/**
 * Khung chung cho các biểu mẫu xác thực.
 *
 * Cố ý hẹp (`max-w-md`) và ngắn: biểu mẫu đăng nhập dài là biểu mẫu bị bỏ dở. Đăng ký
 * chỉ hỏi những trường backend thật sự cần để tạo tài khoản; phần còn lại của hồ sơ
 * được điền dần trong lúc đặt lịch, khi người dùng đã thấy lý do phải nhập.
 */
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <Link to="/" className="inline-flex items-center gap-2.5" aria-label="Về trang chủ">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          >
            <Icon name="stethoscope" className="h-5 w-5" />
          </span>
          <span className="font-semibold text-foreground">Phòng khám thú y</span>
        </Link>

        <h1 className="mt-6 text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted">{description}</p>

        <div className="mt-6">{children}</div>
      </div>

      <p className="mt-5 text-center text-sm text-muted">{footer}</p>
    </div>
  );
}
