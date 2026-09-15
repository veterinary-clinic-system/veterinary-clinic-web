
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
