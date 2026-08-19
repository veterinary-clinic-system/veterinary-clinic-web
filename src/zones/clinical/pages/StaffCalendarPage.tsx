import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { addDays, addMonths, addWeeks, format, parseISO, subDays, subMonths, subWeeks } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { branchesApi } from '@/api/branches.api';
import { doctorsApi } from '@/api/doctors.api';
import { appointmentsApi } from '@/api/appointments.api';
import { SlotStatus } from '@/types/enums';
import { SLOT_STATUS_LABEL_VI } from '@/utils/labels';
import { DoctorAbsenceModal } from '../calendar/DoctorAbsenceModal';
import { MonthGrid } from '../calendar/MonthGrid';
import { CELL_CLASSES } from '../calendar/shared';
import { SlotGrid } from '../calendar/SlotGrid';

/** FR-05-03 đòi bốn cách xem: ngày / tuần / tháng / theo bác sĩ. */
type ViewMode = 'day' | 'week' | 'month';

const VIEW_LABELS: Record<ViewMode, string> = {
  day: 'Ngày',
  week: 'Tuần',
  month: 'Tháng',
};

/**
 * Lịch làm việc của nhân viên: chọn chi nhánh + bác sĩ, xem theo ngày / tuần / tháng.
 *
 * Ba chế độ dùng chung một `anchor` (ngày đang xem) nên chuyển qua lại không mất chỗ:
 * đang ở tháng 9, bấm vào ngày 12 thì sang chế độ ngày của đúng 12/9.
 *
 * `SlotGrid`, `MonthGrid`, `DoctorAbsenceModal` là ba component độc lập trong
 * `../calendar/` - trang này chỉ còn bộ lọc, chuyển chế độ xem và lắp ráp.
 */
export function StaffCalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [branchId, setBranchId] = useState<string>(user?.branchId ?? '');
  const [doctorId, setDoctorId] = useState<string>('');
  const [view, setView] = useState<ViewMode>('week');
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [absenceOpen, setAbsenceOpen] = useState(false);

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });

  useEffect(() => {
    if (!branchId && branchesQuery.data && branchesQuery.data.length > 0) {
      setBranchId(user?.branchId ?? branchesQuery.data[0].id);
    }
  }, [branchId, branchesQuery.data, user?.branchId]);

  const doctorsQuery = useQuery({
    queryKey: ['doctors-public', branchId],
    queryFn: () => doctorsApi.listPublic(branchId),
    enabled: !!branchId,
  });

  useEffect(() => {
    if (doctorsQuery.data && doctorsQuery.data.length > 0) {
      if (!doctorsQuery.data.some((d) => d.id === doctorId)) {
        setDoctorId(doctorsQuery.data[0].id);
      }
    } else if (doctorsQuery.data && doctorsQuery.data.length === 0) {
      setDoctorId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorsQuery.data]);

  const anchorStr = format(anchor, 'yyyy-MM-dd');

  // Ba truy vấn tách rời, mỗi cái chỉ chạy ở chế độ của nó - React Query giữ cache nên
  // chuyển qua lại giữa các chế độ không phải tải lại trang (và thường không phải gọi lại API).
  const weekQuery = useQuery({
    queryKey: ['staff-calendar-week', branchId, doctorId, anchorStr],
    queryFn: () => appointmentsApi.staffCalendar(branchId, doctorId, anchorStr),
    enabled: view === 'week' && !!branchId && !!doctorId,
  });

  const dayQuery = useQuery({
    queryKey: ['staff-calendar-day', branchId, doctorId, anchorStr],
    queryFn: () => appointmentsApi.staffDayCalendar(branchId, doctorId, anchorStr),
    enabled: view === 'day' && !!branchId && !!doctorId,
  });

  const monthQuery = useQuery({
    queryKey: ['staff-calendar-month', branchId, doctorId, format(anchor, 'yyyy-MM')],
    queryFn: () => appointmentsApi.staffMonthCalendar(branchId, doctorId, anchorStr),
    enabled: view === 'month' && !!branchId,
  });

  function shift(direction: -1 | 1) {
    setAnchor((current) => {
      if (view === 'day') return direction === 1 ? addDays(current, 1) : subDays(current, 1);
      if (view === 'week') return direction === 1 ? addWeeks(current, 1) : subWeeks(current, 1);
      return direction === 1 ? addMonths(current, 1) : subMonths(current, 1);
    });
  }

  /** Bấm vào một ô ngày ở chế độ tháng → mở đúng ngày đó ở chế độ ngày. */
  function openDay(date: string) {
    setAnchor(parseISO(date));
    setView('day');
  }

  const periodLabel =
    view === 'month'
      ? format(anchor, "'Tháng' M/yyyy", { locale: vi })
      : view === 'day'
        ? format(anchor, "EEEE, dd/MM/yyyy", { locale: vi })
        : `Tuần chứa ${format(anchor, 'dd/MM/yyyy')}`;

  const needsDoctor = view !== 'month';
  const isLoading =
    (view === 'week' && weekQuery.isLoading) ||
    (view === 'day' && dayQuery.isLoading) ||
    (view === 'month' && monthQuery.isLoading);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Lịch làm việc</h1>

      <div className="flex flex-wrap items-end gap-4 rounded border border-border bg-surface p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Chi nhánh</span>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="rounded border border-border bg-surface px-3 py-2 text-sm"
          >
            {(branchesQuery.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.branchName}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Bác sĩ</span>
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="rounded border border-border bg-surface px-3 py-2 text-sm"
          >
            {/* Chỉ chế độ tháng chạy được khi không chọn bác sĩ - hai chế độ kia cần
                lưới slot của một bác sĩ cụ thể. */}
            {view === 'month' && <option value="">Tất cả bác sĩ</option>}
            {(doctorsQuery.data ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>
        </label>

        <div className="flex overflow-hidden rounded border border-border">
          {(Object.keys(VIEW_LABELS) as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              className={`px-4 py-2 text-sm font-medium ${
                view === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface text-muted hover:bg-surface-muted'
              }`}
            >
              {VIEW_LABELS[mode]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="rounded border border-border px-3 py-2 text-sm hover:bg-surface-muted"
          >
            ←
          </button>
          <span className="min-w-[190px] text-center text-sm font-medium capitalize">
            {periodLabel}
          </span>
          <button
            type="button"
            onClick={() => shift(1)}
            className="rounded border border-border px-3 py-2 text-sm hover:bg-surface-muted"
          >
            →
          </button>
          <button
            type="button"
            onClick={() => setAnchor(new Date())}
            className="rounded border border-border px-3 py-2 text-sm hover:bg-surface-muted"
          >
            Hôm nay
          </button>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Đến ngày</span>
          <input
            type="date"
            value={anchorStr}
            onChange={(e) => e.target.value && setAnchor(parseISO(e.target.value))}
            className="rounded border border-border bg-surface px-3 py-2 text-sm"
          />
        </label>

        {/* Bác sĩ nghỉ đột xuất — đóng lịch ngày đang xem và dồn ca sang người khác. */}
        <button
          type="button"
          disabled={!doctorId}
          onClick={() => setAbsenceOpen(true)}
          className="ml-auto rounded border border-destructive px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/5 disabled:opacity-40"
        >
          Báo bác sĩ nghỉ
        </button>
      </div>

      {view !== 'month' && (
        <div className="flex flex-wrap gap-3 text-xs">
          {/* `PAST` chỉ tồn tại ở lịch công khai — không đưa vào chú giải của nhân viên. */}
          {Object.values(SlotStatus)
            .filter((status) => status !== SlotStatus.PAST)
            .map((status) => (
            <span key={status} className={`rounded px-2 py-1 ${CELL_CLASSES[status]}`}>
              {SLOT_STATUS_LABEL_VI[status]}
            </span>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="text-muted">Đang tải lịch…</p>
      ) : !branchId ? (
        <p className="text-muted">Chọn chi nhánh để xem lịch.</p>
      ) : needsDoctor && !doctorId ? (
        <p className="text-muted">Chọn bác sĩ để xem lịch theo {VIEW_LABELS[view].toLowerCase()}.</p>
      ) : view === 'month' ? (
        <MonthGrid
          days={monthQuery.data?.days ?? []}
          anchor={anchor}
          onSelectDay={openDay}
          emptyMessage="Không có dữ liệu lịch cho tháng này."
        />
      ) : (
        <SlotGrid
          days={view === 'day' ? (dayQuery.data ? [dayQuery.data] : []) : (weekQuery.data ?? [])}
          onOpenAppointment={(id) => navigate(`/staff/appointments/${id}`)}
        />
      )}

      <DoctorAbsenceModal
        open={absenceOpen}
        doctorId={doctorId}
        doctorName={doctorsQuery.data?.find((d) => d.id === doctorId)?.fullName ?? ''}
        date={anchorStr}
        onClose={() => setAbsenceOpen(false)}
      />
    </div>
  );
}
