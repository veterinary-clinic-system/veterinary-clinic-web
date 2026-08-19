/**
 * Thứ trong tuần dùng chung cho lịch làm việc bác sĩ.
 *
 * Chỉ có thứ 2 đến thứ 6: `dayOfWeek` khớp với quy ước của backend (0 là chủ nhật). Nếu
 * phòng khám mở cửa cuối tuần thì thêm ở ĐÂY - một chỗ, không phải ba.
 */
export const WEEKDAYS = [
  { dayOfWeek: 1, label: 'Thứ 2' },
  { dayOfWeek: 2, label: 'Thứ 3' },
  { dayOfWeek: 3, label: 'Thứ 4' },
  { dayOfWeek: 4, label: 'Thứ 5' },
  { dayOfWeek: 5, label: 'Thứ 6' },
];

export function weekdayLabel(dayOfWeek: number): string {
  return WEEKDAYS.find((day) => day.dayOfWeek === dayOfWeek)?.label ?? `Thứ ${dayOfWeek}`;
}
