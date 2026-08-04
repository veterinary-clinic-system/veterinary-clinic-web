import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  getDay,
  parseISO,
  startOfMonth,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { branchesApi } from '@/api/branches.api';
import { doctorsApi } from '@/api/doctors.api';
import { appointmentsApi } from '@/api/appointments.api';
import { PRIORITY_COLOR_LABEL_VI, SlotStatus } from '@/types/enums';
import { DayAvailability, MonthDaySummary, SlotInfo } from '@/types/models';
import { SLOT_STATUS_LABEL_VI, triageColorClasses } from '@/utils/labels';

const CELL_CLASSES: Record<SlotStatus, string> = {
  [SlotStatus.FREE]: 'border border-dashed border-border bg-surface text-muted',
  [SlotStatus.BOOKED]: 'border border-primary/40 bg-primary/5 text-left',
  [SlotStatus.BREAK]: 'border border-border bg-surface-muted text-muted',
  [SlotStatus.OFF_SHIFT]: 'border border-transparent bg-surface-muted/50 text-muted/60',
};

/** FR-05-03 đòi bốn cách xem: ngày / tuần / tháng / theo bác sĩ. */
type ViewMode = 'day' | 'week' | 'month';

const VIEW_LABELS: Record<ViewMode, string> = {
  day: 'Ngày',
  week: 'Tuần',
  month: 'Tháng',
};

/** Thứ Hai đầu tuần, khớp với `startOfWeek(..., { weekStartsOn: 1 })` của backend. */
const WEEKDAY_HEADERS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/**
 * Lịch làm việc của nhân viên: chọn chi nhánh + bác sĩ, xem theo ngày / tuần / tháng.
 *
 * Ba chế độ dùng chung một `anchor` (ngày đang xem) nên chuyển qua lại không mất chỗ:
 * đang ở tháng 9, bấm vào ngày 12 thì sang chế độ ngày của đúng 12/9.
 */
export function StaffCalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [branchId, setBranchId] = useState<string>(user?.branchId ?? '');
  const [doctorId, setDoctorId] = useState<string>('');
  const [view, setView] = useState<ViewMode>('week');
  const [anchor, setAnchor] = useState<Date>(new Date());

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
      </div>

      {view !== 'month' && (
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.values(SlotStatus).map((status) => (
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
    </div>
  );
}

/** Lưới slot dùng chung cho chế độ ngày (1 cột) và chế độ tuần (7 cột). */
function SlotGrid({
  days,
  onOpenAppointment,
}: {
  days: DayAvailability[];
  onOpenAppointment: (appointmentId: string) => void;
}) {
  const rowTimes = useMemo(() => {
    const set = new Set<string>();
    days.forEach((day) => day.slots.forEach((slot) => set.add(slot.start)));
    return Array.from(set).sort();
  }, [days]);

  if (days.length === 0) {
    return <p className="text-muted">Không có dữ liệu lịch cho khoảng thời gian này.</p>;
  }

  const slotAt = (date: string, time: string): SlotInfo | undefined =>
    days.find((d) => d.date === date)?.slots.find((s) => s.start === time);

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table
        className={`w-full border-collapse text-sm ${days.length > 1 ? 'min-w-[900px]' : 'min-w-[420px]'}`}
      >
        <thead>
          <tr className="bg-surface-muted">
            <th className="w-20 border-b border-border px-2 py-2 text-left">Giờ</th>
            {days.map((day) => (
              <th key={day.date} className="border-b border-border px-2 py-2 text-left">
                <div className="capitalize">{format(parseISO(day.date), 'EEEE', { locale: vi })}</div>
                <div className="font-normal text-muted">{format(parseISO(day.date), 'dd/MM')}</div>
                {!day.isBranchOpen && (
                  <div className="text-xs font-normal text-destructive">Đóng cửa</div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowTimes.length === 0 && (
            <tr>
              <td
                colSpan={days.length + 1}
                className="px-3 py-6 text-center text-muted"
              >
                Chi nhánh không mở cửa trong khoảng thời gian này.
              </td>
            </tr>
          )}
          {rowTimes.map((time) => (
            <tr key={time}>
              <td className="border-b border-border px-2 py-2 align-top text-muted">{time}</td>
              {days.map((day) => {
                const slot = slotAt(day.date, time);
                if (!slot) {
                  return <td key={day.date} className="border-b border-border px-1 py-1" />;
                }
                const cellClass = CELL_CLASSES[slot.status];
                if (slot.status === SlotStatus.BOOKED && slot.appointmentDetail) {
                  const detail = slot.appointmentDetail;
                  return (
                    <td key={day.date} className="border-b border-border px-1 py-1 align-top">
                      <button
                        type="button"
                        onClick={() => onOpenAppointment(detail.id)}
                        className={`w-full rounded p-2 text-xs hover:bg-primary/10 ${cellClass}`}
                      >
                        <p className="font-medium">{detail.petName}</p>
                        <p className="text-muted">{detail.ownerName}</p>
                        {detail.priorityColor && (
                          <span
                            className={`mt-1 inline-block rounded-full px-1.5 py-0.5 ${triageColorClasses(detail.priorityColor)}`}
                          >
                            {PRIORITY_COLOR_LABEL_VI[detail.priorityColor]}
                          </span>
                        )}
                      </button>
                    </td>
                  );
                }
                return (
                  <td key={day.date} className="border-b border-border px-1 py-1 align-top">
                    <div className={`rounded p-2 text-center text-xs ${cellClass}`}>
                      {SLOT_STATUS_LABEL_VI[slot.status]}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Lưới tháng: mỗi ô là một ngày với số ca và màu ưu tiên nặng nhất. Cố tình KHÔNG vẽ
 * lưới slot 30 phút cho cả tháng — xem ghi chú trong `AvailabilityService.getMonthOverview`.
 */
function MonthGrid({
  days,
  anchor,
  onSelectDay,
  emptyMessage,
}: {
  days: MonthDaySummary[];
  anchor: Date;
  onSelectDay: (date: string) => void;
  emptyMessage: string;
}) {
  if (days.length === 0) {
    return <p className="text-muted">{emptyMessage}</p>;
  }

  // getDay(): 0 = Chủ Nhật. Lưới bắt đầu từ Thứ Hai nên Chủ Nhật là cột thứ 7.
  const firstDayOfWeek = getDay(startOfMonth(anchor));
  const leadingBlanks = (firstDayOfWeek + 6) % 7;
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[700px] grid-cols-7 gap-px rounded border border-border bg-border">
        {WEEKDAY_HEADERS.map((label) => (
          <div key={label} className="bg-surface-muted px-2 py-2 text-center text-xs font-medium">
            {label}
          </div>
        ))}

        {Array.from({ length: leadingBlanks }, (_, i) => (
          <div key={`blank-${i}`} className="min-h-[92px] bg-surface-muted/40" />
        ))}

        {days.map((day) => {
          const isToday = day.date === todayStr;
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDay(day.date)}
              className={`min-h-[92px] p-2 text-left transition hover:bg-primary/5 ${
                day.isBranchOpen ? 'bg-surface' : 'bg-surface-muted/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm ${isToday ? 'rounded-full bg-primary px-2 py-0.5 font-semibold text-primary-foreground' : ''}`}
                >
                  {format(parseISO(day.date), 'd')}
                </span>
                {!day.isBranchOpen && <span className="text-[10px] text-muted">Đóng cửa</span>}
              </div>

              {day.appointmentCount > 0 ? (
                <p className="mt-2 text-sm font-medium">{day.appointmentCount} ca</p>
              ) : (
                day.isBranchOpen && <p className="mt-2 text-xs text-muted">—</p>
              )}

              {day.closedCount > 0 && (
                <p className="text-xs text-muted">{day.closedCount} hủy/vắng</p>
              )}

              {day.topPriorityColor && (
                <span
                  className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] ${triageColorClasses(day.topPriorityColor)}`}
                >
                  {PRIORITY_COLOR_LABEL_VI[day.topPriorityColor]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
