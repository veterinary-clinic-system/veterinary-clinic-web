import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { appointmentsApi } from '@/api/appointments.api';
import { AppointmentStatus, PRIORITY_COLOR_LABEL_VI, PriorityColor } from '@/types/enums';
import { Appointment } from '@/types/models';
import { APPOINTMENT_STATUS_LABEL_VI, triageColorClasses } from '@/utils/labels';
import { getErrorMessage } from '@/utils/errors';
import { Pagination, usePagination } from '@/components/basic/Pagination';

const CANCELLABLE_STATUSES: AppointmentStatus[] = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED];

/**
 * Bộ lọc theo phản hồi nghiệm thu: "Danh sách các lịch hẹn bao gồm là đã khám, chuẩn bị
 * khám, đã hủy (có thể thêm các trạng thái khác cho tùy trường hợp)."
 *
 * Mỗi thẻ gom nhiều `AppointmentStatus` lại - chủ nuôi không cần biết sự khác nhau giữa
 * "đã check-in" và "đang khám", họ chỉ cần biết ca đó đang diễn ra.
 */
const TABS: { key: string; label: string; statuses: AppointmentStatus[] | null }[] = [
  { key: 'all', label: 'Tất cả', statuses: null },
  {
    key: 'upcoming',
    label: 'Chuẩn bị khám',
    statuses: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
  },
  {
    key: 'in-clinic',
    label: 'Đang tại phòng khám',
    statuses: [AppointmentStatus.CHECKED_IN, AppointmentStatus.IN_PROGRESS],
  },
  { key: 'done', label: 'Đã khám', statuses: [AppointmentStatus.COMPLETED] },
  {
    key: 'closed',
    label: 'Đã hủy / không đến',
    statuses: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
  },
];

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => appointmentsApi.cancel(appointment.id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments', 'mine'] });
    },
  });

  const canCancel = CANCELLABLE_STATUSES.includes(appointment.status);

  /**
   * FR-05-04: lý do hủy là bắt buộc, kể cả khi chính chủ thú cưng tự hủy - phòng khám
   * cần biết vì sao để xếp lại lịch bác sĩ. `cancelledByUserId` khi đó chính là họ.
   */
  const onCancel = () => {
    const reason = window.prompt('Vui lòng cho biết lý do hủy lịch hẹn:', '');
    if (reason === null) return;
    if (reason.trim().length < 3) {
      window.alert('Lý do hủy phải có ít nhất 3 ký tự.');
      return;
    }
    cancelMutation.mutate(reason.trim());
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">
            {format(parseISO(appointment.startAt), 'HH:mm, EEEE dd/MM/yyyy', { locale: vi })}
          </p>
          <p className="mt-1 text-sm text-muted">
            {appointment.service?.item.itemName ?? 'Dịch vụ khám'}
          </p>
          <p className="text-sm text-muted">
            Thú cưng: {appointment.pet?.name ?? 'Chưa xác định'}
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

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to={`/my/appointments/${appointment.id}`}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:border-primary/50"
        >
          Xem chi tiết
        </Link>
        {canCancel && (
          <button
            onClick={onCancel}
            disabled={cancelMutation.isPending}
            className="rounded-lg border border-destructive px-3 py-1.5 text-sm font-medium text-destructive disabled:opacity-60"
          >
            {cancelMutation.isPending ? 'Đang hủy...' : 'Hủy lịch hẹn'}
          </button>
        )}
      </div>
    </div>
  );
}

export function MyAppointmentsPage() {
  const [tab, setTab] = useState('all');

  const {
    data: appointments,
    isLoading,
    isError,
  } = useQuery({ queryKey: ['appointments', 'mine'], queryFn: appointmentsApi.mine });

  const filtered = useMemo(() => {
    const statuses = TABS.find((t) => t.key === tab)?.statuses ?? null;
    return [...(appointments ?? [])]
      .filter((a) => !statuses || statuses.includes(a.status))
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [appointments, tab]);

  // `GET /appointments/mine` trả toàn bộ lịch sử của chủ nuôi trong một lần - phân
  // trang ở phía client là đủ và không cần thêm một cửa API nữa.
  const { page, setPage, pageItems, totalPages } = usePagination(filtered, 10, [tab]);

  const countFor = (key: string) => {
    const statuses = TABS.find((t) => t.key === key)?.statuses ?? null;
    return (appointments ?? []).filter((a) => !statuses || statuses.includes(a.status)).length;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-foreground">Lịch hẹn của tôi</h1>

      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={
              'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ' +
              (tab === item.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-muted text-muted hover:text-foreground')
            }
          >
            {item.label}
            <span className="ml-1.5 opacity-70">{countFor(item.key)}</span>
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-8 text-muted">Đang tải danh sách lịch hẹn...</p>}
      {isError && <p className="mt-8 text-destructive">Không thể tải danh sách lịch hẹn.</p>}

      <div className="mt-6 space-y-4">
        {pageItems.map((appointment) => (
          <AppointmentCard key={appointment.id} appointment={appointment} />
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={filtered.length} />

      {!isLoading && filtered.length === 0 && (
        <p className="mt-8 text-muted">Không có lịch hẹn nào trong mục này.</p>
      )}
    </div>
  );
}
