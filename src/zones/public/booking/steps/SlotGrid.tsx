import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { SlotStatus } from '@/types/enums';
import { DayAvailability, SlotInfo } from '@/types/models';
import { slotFitsService } from '../slot-fit';
import { SelectedSlot } from '../types';

/**
 * Bảng khung giờ của một tuần: hàng là giờ, cột là ngày.
 *
 * Tách khỏi `StepSchedule` vì đây là phần duy nhất phải quyết định trạng thái của từng
 * ô, và luật đó (`slotFitsService`) đã được kiểm thử riêng.
 */
export function SlotGrid({
  days,
  serviceDuration,
  selectedSlot,
  onSelect,
}: {
  days: DayAvailability[];
  serviceDuration: number;
  selectedSlot: SelectedSlot | null;
  onSelect: (slot: SelectedSlot) => void;
}) {
  /* Hợp của mọi giờ bắt đầu trong tuần - các ngày có thể mở cửa lệch nhau. */
  const rowTimes = Array.from(new Set(days.flatMap((d) => d.slots.map((s) => s.start)))).sort();

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <caption className="sr-only">
          Khung giờ còn trống theo ngày. Ô bị làm mờ là đã qua, đã kín, hoặc không đủ{' '}
          {serviceDuration} phút liên tục cho dịch vụ đã chọn.
        </caption>
        <thead>
          <tr>
            <th scope="col" className="border-b border-border p-2 text-left text-muted">
              Giờ
            </th>
            {days.map((day) => (
              <th
                key={day.date}
                scope="col"
                className="border-b border-border p-2 text-center font-medium text-foreground"
              >
                {format(parseISO(day.date), 'EEEE dd/MM', { locale: vi })}
                {!day.isBranchOpen && (
                  <span className="block text-xs font-normal text-muted">(Đóng cửa)</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowTimes.map((time) => (
            <tr key={time}>
              <th scope="row" className="border-b border-border p-2 text-left font-normal text-muted">
                {time}
              </th>
              {days.map((day) => (
                <SlotCell
                  key={day.date}
                  day={day}
                  slot={day.slots.find((s) => s.start === time)}
                  serviceDuration={serviceDuration}
                  isSelected={
                    !!selectedSlot && selectedSlot.startAt === day.slots.find((s) => s.start === time)?.startAt
                  }
                  onSelect={onSelect}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SlotCell({
  day,
  slot,
  serviceDuration,
  isSelected,
  onSelect,
}: {
  day: DayAvailability;
  slot?: SlotInfo;
  serviceDuration: number;
  isSelected: boolean;
  onSelect: (slot: SelectedSlot) => void;
}) {
  if (!slot) {
    return (
      <td className="border-b border-border p-1 text-center text-muted">
        <span aria-label="Không có khung giờ">—</span>
      </td>
    );
  }

  const isPast = slot.status === SlotStatus.PAST;
  /*
    Ô trống nhưng dịch vụ dài không đủ chỗ thì cũng không chọn được - backend sẽ từ
    chối (`slotsCovering`), nên khoá luôn ở đây thay vì để khách chọn xong mới nhận lỗi.
  */
  const fits = slotFitsService(day.slots, slot, serviceDuration);
  const isFree = slot.status === SlotStatus.FREE && fits;
  const tooShort = slot.status === SlotStatus.FREE && !fits;

  /* Lý do khoá nói bằng CHỮ chứ không chỉ bằng màu - và cùng chuỗi cho cả chuột lẫn trình đọc màn hình. */
  const reason = isPast
    ? 'Đã qua - chỉ đặt được từ ngày mai'
    : tooShort
      ? `Không đủ ${serviceDuration} phút liên tục cho dịch vụ đã chọn`
      : slot.status === SlotStatus.FREE
        ? undefined
        : 'Khung giờ này không còn trống';

  return (
    <td className="border-b border-border p-1 text-center">
      <button
        type="button"
        disabled={!isFree}
        aria-pressed={isSelected}
        title={reason}
        aria-label={
          `${slot.start} ${format(parseISO(day.date), 'dd/MM')}` + (reason ? ` - ${reason}` : '')
        }
        onClick={() => onSelect({ ...slot, dayDate: day.date })}
        className={
          'w-full rounded-lg px-2 py-1.5 text-xs font-medium ' +
          (isSelected
            ? 'bg-primary text-primary-foreground'
            : isFree
              ? 'bg-primary/10 text-primary hover:bg-primary/20'
              : isPast
                ? 'cursor-not-allowed bg-transparent text-muted/40 line-through'
                : 'cursor-not-allowed bg-surface-muted text-muted')
        }
      >
        {slot.start}
      </button>
    </td>
  );
}
