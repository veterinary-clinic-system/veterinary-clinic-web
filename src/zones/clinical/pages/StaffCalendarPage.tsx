import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { branchesApi } from '@/api/branches.api';
import { doctorsApi, usersApi } from '@/api/doctors.api';
import { appointmentsApi } from '@/api/appointments.api';
import { EmptyState, ErrorState, Skeleton } from '@/components/basic';
import { Role, SlotStatus } from '@/types/enums';
import {
  addVnDays,
  addVnMonths,
  addVnWeeks,
  formatDate,
  formatMonthYear,
  formatWeekdayDate,
  todayLocalIso,
} from '@/utils/format';
import { SLOT_STATUS_LABEL_VI } from '@/utils/labels';
import { DoctorAbsenceModal } from '../calendar/DoctorAbsenceModal';
import { MonthGrid } from '../calendar/MonthGrid';
import { CELL_CLASSES } from '../calendar/shared';
import { SlotGrid } from '../calendar/SlotGrid';

type ViewMode = 'day' | 'week' | 'month';

const VIEW_LABELS: Record<ViewMode, string> = {
  day: 'Ngày',
  week: 'Tuần',
  month: 'Tháng',
};

export function StaffCalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [branchId, setBranchId] = useState<string>(user?.branchId ?? '');
  const [doctorId, setDoctorId] = useState<string>('');
  const [view, setView] = useState<ViewMode>('week');
  const [anchorStr, setAnchorStr] = useState<string>(() => todayLocalIso());
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

  const isDoctor = user?.role === Role.DOCTOR;
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => usersApi.me(),
    enabled: isDoctor,
  });
  const ownDoctor = isDoctor
    ? (doctorsQuery.data ?? []).find((d) => d.fullName === meQuery.data?.fullName)
    : undefined;

  useEffect(() => {
    if (doctorsQuery.data && doctorsQuery.data.length > 0) {
      if (ownDoctor) {
        if (doctorId !== ownDoctor.id) setDoctorId(ownDoctor.id);
      } else if (!doctorsQuery.data.some((d) => d.id === doctorId)) {
        setDoctorId(doctorsQuery.data[0].id);
      }
    } else if (doctorsQuery.data && doctorsQuery.data.length === 0) {
      setDoctorId('');
    }
  }, [doctorId, doctorsQuery.data, ownDoctor]);

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
    queryKey: ['staff-calendar-month', branchId, doctorId, anchorStr.slice(0, 7)],
    queryFn: () => appointmentsApi.staffMonthCalendar(branchId, doctorId, anchorStr),
    enabled: view === 'month' && !!branchId,
  });

  function shift(direction: -1 | 1) {
    setAnchorStr((current) => {
      if (view === 'day') return addVnDays(current, direction);
      if (view === 'week') return addVnWeeks(current, direction);
      return addVnMonths(current, direction);
    });
  }

  function openDay(date: string) {
    setAnchorStr(date);
    setView('day');
  }

  const periodLabel =
    view === 'month'
      ? formatMonthYear(anchorStr)
      : view === 'day'
        ? formatWeekdayDate(anchorStr)
        : `Tuần từ ${formatDate(anchorStr)}`;

  const needsDoctor = view !== 'month';
  
  const activeQuery = view === 'week' ? weekQuery : view === 'day' ? dayQuery : monthQuery;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Lịch làm việc</h1>

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
            {}
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
            onClick={() => setAnchorStr(todayLocalIso())}
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
            onChange={(e) => e.target.value && setAnchorStr(e.target.value)}
            className="rounded border border-border bg-surface px-3 py-2 text-sm"
          />
        </label>

        {}
        <button
          type="button"
          disabled={!doctorId || (isDoctor && !!ownDoctor && doctorId !== ownDoctor.id)}
          onClick={() => setAbsenceOpen(true)}
          className="ml-auto rounded border border-destructive px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/5 disabled:opacity-40"
        >
          Báo bác sĩ nghỉ
        </button>
      </div>

      {view !== 'month' && (
        <div className="flex flex-wrap gap-3 text-xs">
          {}
          {Object.values(SlotStatus)
            .filter((status) => status !== SlotStatus.PAST)
            .map((status) => (
            <span key={status} className={`rounded px-2 py-1 ${CELL_CLASSES[status]}`}>
              {SLOT_STATUS_LABEL_VI[status]}
            </span>
          ))}
        </div>
      )}

      {activeQuery.isLoading ? (
        
        <Skeleton className="h-[28rem] w-full rounded-xl" />
      ) : !branchId ? (
        <EmptyState
          title="Chọn chi nhánh để xem lịch"
          description="Lịch làm việc khác nhau giữa các chi nhánh, nên phải chọn một chi nhánh trước."
        />
      ) : needsDoctor && !doctorId ? (
        <EmptyState
          title={`Chọn bác sĩ để xem lịch theo ${VIEW_LABELS[view].toLowerCase()}`}
          description="Chế độ xem này hiển thị khung giờ của một bác sĩ."
        />
      ) : activeQuery.isError ? (
        
        <ErrorState
          title="Không tải được lịch làm việc"
          description="Máy chủ không trả lời. Đây KHÔNG có nghĩa là lịch trống."
          onRetry={() => void activeQuery.refetch()}
        />
      ) : view === 'month' ? (
        <MonthGrid
          days={monthQuery.data?.days ?? []}
          anchor={anchorStr}
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
