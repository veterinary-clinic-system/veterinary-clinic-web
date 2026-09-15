import { OperatingHour } from '@/types/models';
import { WEEKDAY_LABELS_VI, formatTimeHHmm } from './display';

export const CLINIC_WEEKDAYS = [1, 2, 3, 4, 5];

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
