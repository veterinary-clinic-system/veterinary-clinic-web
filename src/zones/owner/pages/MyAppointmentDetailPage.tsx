import { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { appointmentsApi } from '@/api/appointments.api';
import {
  AppointmentStatus,
  COMMON_SYMPTOM_LABEL_VI,
  PRIORITY_COLOR_LABEL_VI,
  PriorityColor,
} from '@/types/enums';
import { formatCurrency } from '@/utils/format';
import { APPOINTMENT_STATUS_LABEL_VI, triageColorClasses } from '@/utils/labels';
import { getErrorMessage } from '@/utils/errors';

const CANCELLABLE_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
];

function Row({ label, children }: { label: string; children: ReactNode }) {
  if (children === null || children === undefined || children === '') return null;
  return (
    <div className="flex flex-wrap justify-between gap-4 border-b border-border py-2.5 last:border-none">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right text-foreground">{children}</dd>
    </div>
  );
}

/**
 * Chi tiết một lịch hẹn của CHÍNH chủ nuôi. Dùng `GET /appointments/:id` - route đó
 * không gắn `@RequirePermissions` mà tự kiểm tra quyền sở hữu trong service
 * (`findOneForOwner`), nên lịch của người khác trả về 403 chứ không lộ dữ liệu.
 */
export function MyAppointmentDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: appointment,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['appointments', id],
    queryFn: () => appointmentsApi.getOne(id),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => appointmentsApi.cancel(id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const onCancel = () => {
    const reason = window.prompt('Vui lòng cho biết lý do hủy lịch hẹn:', '');
    if (reason === null) return;
    if (reason.trim().length < 3) {
      window.alert('Lý do hủy phải có ít nhất 3 ký tự.');
      return;
    }
    cancelMutation.mutate(reason.trim());
  };

  if (isLoading) {
    return <p className="mx-auto max-w-3xl px-4 py-10 text-muted">Đang tải lịch hẹn...</p>;
  }

  if (isError || !appointment) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-destructive">
          {getErrorMessage(error, 'Không tìm thấy lịch hẹn hoặc bạn không có quyền xem lịch hẹn này.')}
        </p>
        <button
          type="button"
          onClick={() => navigate('/my/appointments')}
          className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground"
        >
          Về danh sách lịch hẹn
        </button>
      </div>
    );
  }

  const canCancel = CANCELLABLE_STATUSES.includes(appointment.status);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/my/appointments" className="text-sm font-medium text-primary">
        ← Lịch hẹn của tôi
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {format(parseISO(appointment.startAt), 'HH:mm, EEEE dd/MM/yyyy', { locale: vi })}
          </h1>
          <p className="mt-1 text-sm text-muted">Mã lịch hẹn: {appointment.id}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-medium text-muted">
            {APPOINTMENT_STATUS_LABEL_VI[appointment.status]}
          </span>
          {appointment.priorityColor && (
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${triageColorClasses(appointment.priorityColor)}`}
            >
              {PRIORITY_COLOR_LABEL_VI[appointment.priorityColor as PriorityColor]}
            </span>
          )}
        </div>
      </div>

      <section className="mt-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold text-foreground">Thông tin buổi khám</h2>
        <dl className="mt-3 text-sm">
          <Row label="Chi nhánh">{appointment.branch?.branchName}</Row>
          <Row label="Địa chỉ">{appointment.branch?.address}</Row>
          <Row label="Bác sĩ">{appointment.doctor?.fullName ?? 'Phòng khám sắp xếp'}</Row>
          <Row label="Dịch vụ">
            {appointment.service?.item.itemName}
            {appointment.service?.item.unitPrice !== undefined &&
              ` · ${formatCurrency(appointment.service.item.unitPrice)}`}
          </Row>
          <Row label="Kết thúc dự kiến">
            {format(parseISO(appointment.endAt), 'HH:mm dd/MM/yyyy')}
          </Row>
        </dl>
      </section>

      <section className="mt-5 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Thú cưng</h2>
          {appointment.petId && (
            <Link to={`/my/pets/${appointment.petId}`} className="text-sm font-medium text-primary">
              Xem hồ sơ →
            </Link>
          )}
        </div>
        <dl className="mt-3 text-sm">
          <Row label="Tên">{appointment.pet?.name}</Row>
          <Row label="Giống">{appointment.pet?.breed?.breedName}</Row>
          <Row label="Loài">{appointment.pet?.breed?.species?.speciesName}</Row>
        </dl>
      </section>

      <section className="mt-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold text-foreground">Triệu chứng đã khai</h2>
        {appointment.commonSymptoms.length === 0 && !appointment.otherSymptoms ? (
          <p className="mt-2 text-sm text-muted">Không có mô tả triệu chứng.</p>
        ) : (
          <>
            {appointment.commonSymptoms.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {appointment.commonSymptoms.map((symptom) => (
                  <span
                    key={symptom}
                    className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-foreground"
                  >
                    {COMMON_SYMPTOM_LABEL_VI[symptom]}
                  </span>
                ))}
              </div>
            )}
            {appointment.otherSymptoms && (
              <p className="mt-3 whitespace-pre-line text-sm text-foreground">
                {appointment.otherSymptoms}
              </p>
            )}
          </>
        )}

        {appointment.photoUrls.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {appointment.photoUrls.map((url) => (
              <img
                key={url}
                src={url}
                alt="Ảnh triệu chứng"
                className="h-24 w-24 rounded-lg border border-border object-cover"
              />
            ))}
          </div>
        )}
      </section>

      {appointment.cancelledAt && (
        <section className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <h2 className="font-semibold text-destructive">Lịch hẹn đã kết thúc bất thường</h2>
          <dl className="mt-3 text-sm">
            <Row label="Thời điểm">{format(parseISO(appointment.cancelledAt), 'HH:mm dd/MM/yyyy')}</Row>
            <Row label="Người thực hiện">{appointment.cancelledBy?.fullName}</Row>
            <Row label="Lý do">{appointment.cancelReason}</Row>
          </dl>
        </section>
      )}

      {cancelMutation.isError && (
        <p className="mt-4 text-sm text-destructive">
          {getErrorMessage(cancelMutation.error, 'Không thể hủy lịch hẹn.')}
        </p>
      )}

      {canCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={cancelMutation.isPending}
          className="mt-6 rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive disabled:opacity-60"
        >
          {cancelMutation.isPending ? 'Đang hủy...' : 'Hủy lịch hẹn'}
        </button>
      )}
    </div>
  );
}
