import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { appointmentsApi } from '@/api/appointments.api';
import { AppointmentStatus, PRIORITY_COLOR_LABEL_VI, PriorityColor } from '@/types/enums';
import { Appointment } from '@/types/models';
import { APPOINTMENT_STATUS_LABEL_VI, triageColorClasses } from '@/utils/labels';
import { getErrorMessage } from '@/utils/errors';

const CANCELLABLE_STATUSES: AppointmentStatus[] = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED];

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: () => appointmentsApi.cancel(appointment.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments', 'mine'] });
    },
  });

  const canCancel = CANCELLABLE_STATUSES.includes(appointment.status);

  const onCancel = () => {
    if (window.confirm('Bạn có chắc muốn hủy lịch hẹn này?')) {
      cancelMutation.mutate();
    }
  };

  return (
    <div className="rounded border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">
            {format(parseISO(appointment.startAt), 'HH:mm, EEEE dd/MM/yyyy', { locale: vi })}
          </p>
          <p className="mt-1 text-sm text-muted">
            {appointment.service?.item.itemName ?? 'Dịch vụ khám'}
          </p>
          <p className="text-sm text-muted">
            Bác sĩ: {appointment.doctor?.fullName ?? 'Chưa xác định'}
          </p>
          <p className="text-sm text-muted">
            Chi nhánh: {appointment.branch?.branchName ?? 'Chưa xác định'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-muted">
            {APPOINTMENT_STATUS_LABEL_VI[appointment.status]}
          </span>
          {appointment.priorityColor && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${triageColorClasses(appointment.priorityColor)}`}
            >
              {PRIORITY_COLOR_LABEL_VI[appointment.priorityColor as PriorityColor]}
            </span>
          )}
        </div>
      </div>

      {cancelMutation.isError && (
        <p className="mt-2 text-sm text-destructive">
          {getErrorMessage(cancelMutation.error, 'Không thể hủy lịch hẹn.')}
        </p>
      )}

      {canCancel && (
        <button
          onClick={onCancel}
          disabled={cancelMutation.isPending}
          className="mt-3 rounded border border-destructive px-3 py-1.5 text-sm font-medium text-destructive disabled:opacity-60"
        >
          {cancelMutation.isPending ? 'Đang hủy...' : 'Hủy lịch hẹn'}
        </button>
      )}
    </div>
  );
}

export function MyAppointmentsPage() {
  const {
    data: appointments,
    isLoading,
    isError,
  } = useQuery({ queryKey: ['appointments', 'mine'], queryFn: appointmentsApi.mine });

  const sorted = [...(appointments ?? [])].sort(
    (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-foreground">Lịch hẹn của tôi</h1>

      {isLoading && <p className="mt-8 text-muted">Đang tải danh sách lịch hẹn...</p>}
      {isError && <p className="mt-8 text-destructive">Không thể tải danh sách lịch hẹn.</p>}

      <div className="mt-6 space-y-4">
        {sorted.map((appointment) => (
          <AppointmentCard key={appointment.id} appointment={appointment} />
        ))}
      </div>

      {appointments && appointments.length === 0 && (
        <p className="mt-8 text-muted">Bạn chưa có lịch hẹn nào.</p>
      )}
    </div>
  );
}
