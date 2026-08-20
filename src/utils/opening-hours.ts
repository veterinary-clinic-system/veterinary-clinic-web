import { OperatingHour } from '@/types/models';
import { WEEKDAY_LABELS_VI, formatTimeHHmm } from './display';

/**
 * Ngày phòng khám mở cửa: Thứ Hai đến Thứ Sáu.
 *
 * `dayOfWeek` theo quy ước của `Date#getDay()` (0 là Chủ Nhật) - giống hệt backend, nên
 * con số đi thẳng vào payload mà không phải quy đổi. Backend chặn 0 và 6 ở
 * `OperatingHourDto`; nếu phòng khám mở cửa cuối tuần thì phải nới ở CẢ HAI phía.
 */
export const CLINIC_WEEKDAYS = [1, 2, 3, 4, 5];

/**
 * Gộp giờ mở cửa thành ít dòng nhất đọc được. Dùng chung cho thẻ chi nhánh ở trang công
 * khai và cột "Giờ mở cửa" của màn hình quản trị - hai chỗ hiển thị cùng một dữ liệu thì
 * phải gộp theo cùng một cách, nếu không quản trị viên sửa xong không nhận ra thứ mình
 * vừa sửa trên trang khách nhìn thấy.
 *
 * Hai lần gộp, theo đúng thứ tự:
 *
 * 1. **Theo ngày.** Một ngày có thể có nhiều ca (nghỉ trưa), backend trả về mỗi ca một
 *    bản ghi - gộp lại thành "07:00 - 11:00, 13:30 - 17:30".
 * 2. **Theo dải ngày liên tiếp cùng giờ.** Năm dòng giống hệt nhau thành
 *    "Thứ Hai - Thứ Sáu".
 *
 * Bỏ bước 1 thì hai bản ghi của cùng một ngày sinh ra hai dòng có cùng nhãn - đúng lỗi
 * trùng khoá React đã gặp với dữ liệu thật.
 */
export function groupOpeningHours(hours: OperatingHour[]): { days: string; time: string }[] {
  const byDay = new Map<number, string[]>();
  [...hours]
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.openTime.localeCompare(b.openTime))
    .forEach((hour) => {
      const range = `${formatTimeHHmm(hour.openTime)} - ${formatTimeHHmm(hour.closeTime)}`;
      byDay.set(hour.dayOfWeek, [...(byDay.get(hour.dayOfWeek) ?? []), range]);
    });

  const groups: { from: number; to: number; time: string }[] = [];
  [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .forEach(([day, ranges]) => {
      const time = ranges.join(', ');
      const last = groups[groups.length - 1];
      if (last && last.time === time && day === last.to + 1) {
        last.to = day;
      } else {
        groups.push({ from: day, to: day, time });
      }
    });

  return groups.map((group) => ({
    days:
      group.from === group.to
        ? WEEKDAY_LABELS_VI[group.from]
        : `${WEEKDAY_LABELS_VI[group.from]} - ${WEEKDAY_LABELS_VI[group.to]}`,
    time: group.time,
  }));
}
