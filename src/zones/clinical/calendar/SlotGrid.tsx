import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { PRIORITY_COLOR_LABEL_VI, SlotStatus } from '@/types/enums';
import { DayAvailability, SlotInfo } from '@/types/models';
import { SLOT_STATUS_LABEL_VI, triageColorClasses, triagePriorityBar } from '@/utils/labels';
import { CELL_CLASSES } from './shared';

/** Lưới slot dùng chung cho chế độ ngày (1 cột) và chế độ tuần (7 cột). */
export function SlotGrid({
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
                      {/*
                        Ô lịch phải đọc được mà không cần mở chi tiết: chủ nuôi, thú
                        cưng + (loài, giống), dịch vụ và nhãn màu ưu tiên. Dải màu bên
                        trái cho phép quét nhanh cả tuần bằng mắt.
                      */}
                      <button
                        type="button"
                        onClick={() => onOpenAppointment(detail.id)}
                        title={`${detail.petName} · ${detail.ownerName}${detail.serviceName ? ` · ${detail.serviceName}` : ''}`}
                        className={`flex w-full gap-1.5 rounded p-2 text-left text-xs hover:bg-primary/10 ${cellClass}`}
                      >
                        <span
                          aria-hidden
                          className={`w-1 shrink-0 rounded-full ${detail.priorityColor ? triagePriorityBar(detail.priorityColor) : 'bg-primary/40'}`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-foreground">
                            {detail.ownerName}
                          </span>
                          <span className="block truncate text-foreground">
                            {detail.petName}
                            {(detail.petSpeciesName || detail.petBreedName) && (
                              <span className="text-muted">
                                {' '}
                                ({[detail.petSpeciesName, detail.petBreedName].filter(Boolean).join(', ')})
                              </span>
                            )}
                          </span>
                          {detail.serviceName && (
                            <span className="block truncate text-muted">{detail.serviceName}</span>
                          )}
                          {detail.priorityColor && (
                            <span
                              className={`mt-1 inline-block rounded-full px-1.5 py-0.5 ${triageColorClasses(detail.priorityColor)}`}
                            >
                              {PRIORITY_COLOR_LABEL_VI[detail.priorityColor]}
                            </span>
                          )}
                        </span>
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
