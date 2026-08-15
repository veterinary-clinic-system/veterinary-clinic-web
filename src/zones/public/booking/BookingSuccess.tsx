import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Appointment } from '@/types/models';
import { SummaryRow } from './SummaryRow';

/**
 * Màn hình sau khi đặt lịch thành công.
 *
 * Thay cả biểu mẫu chứ không phải hiện một hộp thông báo: lịch đã đặt xong rồi, để lại
 * bảy bước phía sau chỉ mời khách bấm nhầm lần nữa.
 */
export function BookingSuccess({
  appointment,
  branchName,
  serviceName,
  doctorName,
  isLoggedIn,
}: {
  appointment: Appointment;
  branchName?: string;
  serviceName?: string;
  doctorName?: string;
  isLoggedIn: boolean;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <span
        aria-hidden="true"
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-3xl"
      >
        ✓
      </span>

      {/*
        `role="status"` để trình đọc màn hình báo ngay - với người không nhìn thấy dấu ✓
        thì đây là tín hiệu duy nhất cho biết việc đặt lịch đã xong.
      */}
      <h1 role="status" className="mt-4 text-2xl font-semibold text-foreground">
        Đặt lịch thành công
      </h1>
      <p className="mt-2 text-muted">Mã lịch hẹn: {appointment.id}</p>

      <dl className="mt-6 rounded-xl border border-border bg-surface p-6 text-left text-sm">
        <SummaryRow
          label="Thời gian"
          value={format(parseISO(appointment.startAt), 'HH:mm, EEEE dd/MM/yyyy', { locale: vi })}
        />
        <SummaryRow label="Bác sĩ" value={appointment.doctor?.fullName ?? doctorName} />
        <SummaryRow label="Chi nhánh" value={branchName} />
        <SummaryRow label="Dịch vụ" value={serviceName} />
      </dl>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {isLoggedIn ? (
          <Link
            to="/my/appointments"
            className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Xem lịch hẹn của tôi
          </Link>
        ) : (
          <Link
            to="/login"
            className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Đăng nhập để theo dõi lịch hẹn
          </Link>
        )}
        <Link
          to="/"
          className="rounded-lg border border-border px-5 py-2.5 font-medium text-foreground hover:bg-surface-muted"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
