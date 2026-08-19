import { Link } from 'react-router-dom';
import { Badge, EmptyState, Icon, SkeletonCards } from '@/components/basic';
import { AppointmentStatus } from '@/types/enums';
import { Appointment } from '@/types/models';
import { APPOINTMENT_STATUS_TONE } from '@/utils/appointment-status';
import { formatDate, formatTime } from '@/utils/format';
import { APPOINTMENT_STATUS_LABEL_VI } from '@/utils/labels';

export interface AppointmentListProps {
  appointments: Appointment[];
  isLoading: boolean;
  emptyTitle: string;
  emptyDescription?: string;
}

/**
 * Danh sách lịch hẹn của chủ nuôi - dùng ở cả trang "Lịch hẹn của tôi" và tab lịch hẹn
 * trong hồ sơ từng bé.
 *
 * Ngày giờ tách thành một cột riêng bên trái, cỡ chữ lớn: khi lướt một danh sách lịch
 * hẹn, thứ người ta tìm là "hôm nào", còn tên dịch vụ chỉ đọc sau khi đã khoanh được
 * ngày. Xếp ngày sang bên trái cũng làm mọi hàng thẳng cột, quét mắt được theo chiều dọc.
 */
export function AppointmentList({
  appointments,
  isLoading,
  emptyTitle,
  emptyDescription,
}: AppointmentListProps) {
  if (isLoading) {
    return <SkeletonCards count={3} label="Đang tải lịch hẹn" className="sm:grid-cols-1 lg:grid-cols-1" />;
  }

  if (appointments.length === 0) {
    return (
      <EmptyState
        icon="📅"
        title={emptyTitle}
        description={emptyDescription}
        action={
          <Link
            to="/booking"
            className="inline-flex min-h-touch items-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Đặt lịch khám
          </Link>
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {appointments.map((appointment) => {
        const status = appointment.status as AppointmentStatus;
        return (
          <li key={appointment.id}>
            <Link
              to={`/my/appointments/${appointment.id}`}
              className="flex gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/40"
            >
              <div className="w-20 shrink-0 border-r border-border pr-4 text-center">
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {formatTime(appointment.startAt)}
                </p>
                <p className="text-xs tabular-nums text-muted">{formatDate(appointment.startAt)}</p>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium text-foreground">
                    {appointment.service?.item.itemName ?? 'Khám thú y'}
                  </p>
                  <Badge variant={APPOINTMENT_STATUS_TONE[status] ?? 'neutral'}>
                    {APPOINTMENT_STATUS_LABEL_VI[status] ?? appointment.status}
                  </Badge>
                </div>

                <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                  {appointment.pet?.name && (
                    <div className="flex items-center gap-1.5">
                      <dt className="sr-only">Thú cưng</dt>
                      <Icon name="paw" className="h-4 w-4" />
                      <dd>{appointment.pet.name}</dd>
                    </div>
                  )}
                  {appointment.doctor?.fullName && (
                    <div className="flex items-center gap-1.5">
                      <dt className="sr-only">Bác sĩ</dt>
                      <Icon name="stethoscope" className="h-4 w-4" />
                      <dd>{appointment.doctor.fullName}</dd>
                    </div>
                  )}
                  {appointment.branch?.branchName && (
                    <div className="flex items-center gap-1.5">
                      <dt className="sr-only">Chi nhánh</dt>
                      <Icon name="building" className="h-4 w-4" />
                      <dd>{appointment.branch.branchName}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <Icon name="chevron-right" className="mt-1 h-5 w-5 shrink-0 self-center text-muted" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
