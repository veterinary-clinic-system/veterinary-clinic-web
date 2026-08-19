import { format, getDay, parseISO, startOfMonth } from 'date-fns';
import { PRIORITY_COLOR_LABEL_VI } from '@/types/enums';
import { MonthDaySummary } from '@/types/models';
import { triageColorClasses } from '@/utils/labels';

/** Thứ Hai đầu tuần, khớp với `startOfWeek(..., { weekStartsOn: 1 })` của backend. */
const WEEKDAY_HEADERS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/**
 * Lưới tháng: mỗi ô là một ngày với số ca và màu ưu tiên nặng nhất. Cố tình KHÔNG vẽ
 * lưới slot 30 phút cho cả tháng — xem ghi chú trong `AvailabilityService.getMonthOverview`.
 */
export function MonthGrid({
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
