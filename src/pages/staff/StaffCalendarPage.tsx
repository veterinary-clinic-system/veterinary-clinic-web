import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { addWeeks, format, parseISO, subWeeks } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { branchesApi } from '@/api/branches.api';
import { doctorsApi } from '@/api/doctors.api';
import { appointmentsApi } from '@/api/appointments.api';
import { PRIORITY_COLOR_LABEL_VI, SlotStatus } from '@/types/enums';
import { SlotInfo } from '@/types/models';
import { SLOT_STATUS_LABEL_VI, triageColorClasses } from '@/utils/labels';

const CELL_CLASSES: Record<SlotStatus, string> = {
  [SlotStatus.FREE]: 'border border-dashed border-border bg-surface text-muted',
  [SlotStatus.BOOKED]: 'border border-primary/40 bg-primary/5 text-left',
  [SlotStatus.BREAK]: 'border border-border bg-surface-muted text-muted',
  [SlotStatus.OFF_SHIFT]: 'border border-transparent bg-surface-muted/50 text-muted/60',
};

/** Full-detail staff calendar: branch/doctor selectors + week grid of slots. */
export function StaffCalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [branchId, setBranchId] = useState<string>(user?.branchId ?? '');
  const [doctorId, setDoctorId] = useState<string>('');
  const [weekAnchor, setWeekAnchor] = useState<Date>(new Date());

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

  const weekOf = format(weekAnchor, 'yyyy-MM-dd');

  const calendarQuery = useQuery({
    queryKey: ['staff-calendar', branchId, doctorId, weekOf],
    queryFn: () => appointmentsApi.staffCalendar(branchId, doctorId, weekOf),
    enabled: !!branchId && !!doctorId,
  });

  const days = calendarQuery.data ?? [];

  const rowTimes = useMemo(() => {
    const set = new Set<string>();
    days.forEach((day) => day.slots.forEach((slot) => set.add(slot.start)));
    return Array.from(set).sort();
  }, [days]);

  const slotAt = (date: string, time: string): SlotInfo | undefined =>
    days.find((d) => d.date === date)?.slots.find((s) => s.start === time);

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
            {(doctorsQuery.data ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekAnchor((d) => subWeeks(d, 1))}
            className="rounded border border-border px-3 py-2 text-sm hover:bg-surface-muted"
          >
            ← Tuần trước
          </button>
          <button
            type="button"
            onClick={() => setWeekAnchor((d) => addWeeks(d, 1))}
            className="rounded border border-border px-3 py-2 text-sm hover:bg-surface-muted"
          >
            Tuần sau →
          </button>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Đến ngày</span>
          <input
            type="date"
            value={format(weekAnchor, 'yyyy-MM-dd')}
            onChange={(e) => e.target.value && setWeekAnchor(parseISO(e.target.value))}
            className="rounded border border-border bg-surface px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        {Object.values(SlotStatus).map((status) => (
          <span key={status} className={`rounded px-2 py-1 ${CELL_CLASSES[status]}`}>
            {SLOT_STATUS_LABEL_VI[status]}
          </span>
        ))}
      </div>

      {calendarQuery.isLoading ? (
        <p className="text-muted">Đang tải lịch…</p>
      ) : !branchId || !doctorId ? (
        <p className="text-muted">Chọn chi nhánh và bác sĩ để xem lịch.</p>
      ) : days.length === 0 ? (
        <p className="text-muted">Không có dữ liệu lịch cho tuần này.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-surface-muted">
                <th className="w-20 border-b border-border px-2 py-2 text-left">Giờ</th>
                {days.map((day) => (
                  <th key={day.date} className="border-b border-border px-2 py-2 text-left">
                    <div className="capitalize">
                      {format(parseISO(day.date), 'EEEE', { locale: vi })}
                    </div>
                    <div className="font-normal text-muted">
                      {format(parseISO(day.date), 'dd/MM')}
                    </div>
                    {!day.isBranchOpen && (
                      <div className="text-xs font-normal text-destructive">Đóng cửa</div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
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
                            onClick={() => navigate(`/staff/appointments/${detail.id}`)}
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
      )}
    </div>
  );
}
