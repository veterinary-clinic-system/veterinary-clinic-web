import { Link } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Icon,
  Skeleton,
  TriageBadge,
  cn,
} from '@/components/basic';
import { AppointmentStatus } from '@/types/enums';
import { Appointment } from '@/types/models';
import { APPOINTMENT_STATUS_TONE } from '@/utils/appointment-status';
import { formatTime } from '@/utils/format';
import { APPOINTMENT_STATUS_LABEL_VI } from '@/utils/labels';

export interface TodayScheduleProps {
  appointments: Appointment[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

/**
 * Lịch hẹn trong ngày, dạng dòng thời gian.
 *
 * **Ca kế tiếp được đánh dấu.** Trên một danh sách 20 ca, câu hỏi thật sự của người
 * đang mở trang không phải "hôm nay có gì" mà là "ai tiếp theo" - và trả lời nó bằng
 * một đường kẻ ngang có nhãn thì nhanh hơn mọi cách sắp xếp khác.
 *
 * Mật độ cao có chủ ý: giờ ở cột trái cố định, mỗi hàng một dòng, không có ảnh lớn.
 * Đây là màn hình được liếc mắt hàng chục lần mỗi ngày, không phải đọc một lần.
 */
export function TodaySchedule({ appointments, isLoading, isError, onRetry }: TodayScheduleProps) {
  const now = Date.now();
  const nextIndex = appointments.findIndex(
    (appointment) =>
      new Date(appointment.startAt).getTime() >= now &&
      (appointment.status === AppointmentStatus.PENDING ||
        appointment.status === AppointmentStatus.CONFIRMED),
  );

  return (
    <Card as="section">
      <CardHeader>
        <CardTitle as="h2">Lịch hẹn hôm nay</CardTitle>
        <Link to="/staff/appointments" className="text-sm font-medium text-primary hover:underline">
          Mở lịch đầy đủ
        </Link>
      </CardHeader>

      <CardBody className="pt-3">
        {isError ? (
          <ErrorState
            title="Không tải được lịch hẹn hôm nay"
            description="Máy chủ chưa phản hồi."
            onRetry={onRetry}
          />
        ) : isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-row w-full" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <EmptyState
            className="border-0 bg-transparent"
            icon="📅"
            title="Hôm nay chưa có lịch hẹn nào"
            description="Khách vãng lai vẫn có thể được tiếp nhận trực tiếp tại quầy."
            action={
              <Link
                to="/staff/queue"
                className="inline-flex min-h-touch items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Mở hàng chờ
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {appointments.map((appointment, index) => {
              const status = appointment.status as AppointmentStatus;
              const closed =
                status === AppointmentStatus.CANCELLED ||
                status === AppointmentStatus.NO_SHOW ||
                status === AppointmentStatus.COMPLETED;

              return (
                <li key={appointment.id}>
                  {index === nextIndex && (
                    <p className="flex items-center gap-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                      <span aria-hidden="true" className="h-px flex-1 bg-primary/30" />
                      Ca kế tiếp
                      <span aria-hidden="true" className="h-px flex-1 bg-primary/30" />
                    </p>
                  )}

                  <Link
                    to={`/staff/appointments/${appointment.id}`}
                    className={cn(
                      'flex min-h-row items-center gap-3 py-2 transition-colors hover:bg-surface-muted/60',
                      closed && 'opacity-60',
                    )}
                  >
                    <span className="w-12 shrink-0 text-data font-semibold tabular-nums text-foreground">
                      {formatTime(appointment.startAt)}
                    </span>

                    <Avatar name={appointment.pet?.name ?? '?'} src={appointment.pet?.avatarUrl} size="sm" />

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-data font-medium text-foreground">
                        {appointment.pet?.name ?? 'Chưa có hồ sơ'}
                        {appointment.pet?.breed?.breedName && (
                          <span className="font-normal text-muted">
                            {' · '}
                            {appointment.pet.breed.breedName}
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {appointment.service?.item.itemName}
                        {appointment.doctor?.fullName && ` · ${appointment.doctor.fullName}`}
                      </span>
                    </span>

                    <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
                      {appointment.priorityColor && (
                        <TriageBadge color={appointment.priorityColor} />
                      )}
                      <Badge variant={APPOINTMENT_STATUS_TONE[status] ?? 'neutral'}>
                        {APPOINTMENT_STATUS_LABEL_VI[status]}
                      </Badge>
                    </span>

                    <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
