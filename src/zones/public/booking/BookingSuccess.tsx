import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Appointment } from '@/types/models';
import { SummaryRow } from './SummaryRow';
import { PaymentStatus } from '@/types/enums';
import { sepayApi, SepayQrTicket } from '@/api/billing.api';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/utils/format';
import type { BookingForm } from './use-booking-form';

export function BookingSuccess({
  appointment,
  branchName,
  serviceName,
  doctorName,
  isLoggedIn,
  payment,
}: {
  appointment: Appointment;
  branchName?: string;
  serviceName?: string;
  doctorName?: string;
  isLoggedIn: boolean;
  payment: BookingForm['payment'];
}) {
  const statusQuery = useQuery({
    queryKey: ['public-sepay-ticket', payment.ticket?.paymentId],
    queryFn: () => sepayApi.publicTicket(payment.ticket!.paymentId),
    enabled: !!payment.ticket,
    refetchInterval: (query) =>
      query.state.data?.status === PaymentStatus.PENDING ? 3_000 : false,
  });
  const paid = statusQuery.data?.status === PaymentStatus.SUCCESS;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <span
        aria-hidden="true"
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-3xl"
      >
        ✓
      </span>

      {}
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

      {payment.option === 'SEPAY_QR' && (
        <BookingPayment
          ticket={payment.ticket}
          isStarting={payment.isStarting}
          error={payment.error}
          paid={paid}
          onRetry={payment.retry}
        />
      )}

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

function BookingPayment({
  ticket,
  isStarting,
  error,
  paid,
  onRetry,
}: {
  ticket: SepayQrTicket | null;
  isStarting: boolean;
  error: string | null;
  paid: boolean;
  onRetry: () => void | null;
}) {
  if (isStarting) {
    return <p className="mt-6 text-sm text-muted">Đang tạo mã QR thanh toán...</p>;
  }
  if (error || !ticket) {
    return (
      <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-left">
        <p className="text-sm text-destructive">{error ?? 'Chưa thể tạo mã QR thanh toán.'}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-sm font-medium text-primary hover:underline"
        >
          Thử mở thanh toán lại
        </button>
      </div>
    );
  }
  if (paid) {
    return (
      <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
        <p className="text-lg font-semibold text-primary">Thanh toán thành công</p>
        <p className="mt-1 text-sm text-muted">
          Phòng khám đã nhận {formatCurrency(ticket.amount)}.
        </p>
      </div>
    );
  }
  return (
    <div className="mt-6 rounded-xl border border-border bg-surface p-5">
      <h2 className="font-semibold text-foreground">
        Quét mã để thanh toán {formatCurrency(ticket.amount)}
      </h2>
      <img
        src={ticket.qrImageUrl}
        alt="Mã QR thanh toán phí đặt lịch"
        className="mx-auto mt-4 w-full max-w-64 rounded-lg"
      />
      <p className="mt-3 text-sm text-muted">Nội dung chuyển khoản</p>
      <p className="mt-1 select-all font-mono font-semibold text-foreground">
        {ticket.transferContent}
      </p>
      <p className="mt-3 text-xs text-muted">Hệ thống đang tự động chờ xác nhận thanh toán.</p>
    </div>
  );
}
