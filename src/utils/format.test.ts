import { describe, expect, it } from 'vitest';
import {
  formatDayDivider,
  formatListTime,
  formatMessageTime,
} from '@/components/messaging/messaging-format';
import { daysUntilExpiry } from '@/utils/inventory';
import { petAgeLabel } from '@/zones/owner/components/pet-display';
import {
  addVnDays,
  addVnMonths,
  addVnWeeks,
  diffVnDays,
  diffVnMonths,
  diffVnYears,
  formatDate,
  formatDateTime,
  formatDayMonth,
  formatDayNumber,
  formatLongWeekdayDate,
  formatMonthYear,
  formatTime,
  formatWeekday,
  formatWeekdayDate,
  formatWeekdayDateTimeVN,
  formatWeekdayDayMonth,
  formatWeekdayDayMonthLong,
  getVnDayOfWeek,
  getVnYear,
  parseVnDateKey,
  startOfVnDay,
  startOfVnMonth,
  startOfVnQuarter,
  startOfVnWeek,
  startOfVnYear,
  todayLocalIso,
  toVnDateKey,
  vnDateTimeLocalToIso,
} from './format';

describe('format utilities (Asia/Ho_Chi_Minh timezone invariant)', () => {
  // 2026-11-27T17:00:00.000Z === 2026-11-28 00:00:00+07:00 (Thứ Bảy)
  const vnMidnight = '2026-11-27T17:00:00.000Z';
  // 2026-11-27T20:30:00.000Z === 2026-11-28 03:30:00+07:00 (Thứ Bảy)
  const vnEarlyMorning = '2026-11-27T20:30:00.000Z';
  // 2026-11-28T02:30:00.000Z === 2026-11-28 09:30:00+07:00 (Thứ Bảy)
  const vnMorning = '2026-11-28T02:30:00.000Z';
  // 2026-12-31T18:00:00.000Z === 2027-01-01 01:00:00+07:00 (Thứ Sáu)
  const vnNewYear = '2026-12-31T18:00:00.000Z';

  it('format ngày/giờ/thứ cố định theo Asia/Ho_Chi_Minh bất kể TZ hệ thống', () => {
    expect(toVnDateKey(vnMidnight)).toBe('2026-11-28');
    expect(todayLocalIso(new Date(vnMidnight))).toBe('2026-11-28');
    expect(formatTime(vnMidnight)).toBe('00:00');
    expect(formatDate(vnMidnight)).toBe('28/11/2026');
    expect(formatDateTime(vnMidnight)).toBe('00:00 28/11/2026');
    expect(formatDayMonth(vnMidnight)).toBe('28/11');
    expect(formatDayNumber(vnMidnight)).toBe('28');
    expect(formatMonthYear(vnMidnight)).toBe('Tháng 11/2026');
    expect(formatWeekday(vnMidnight)).toBe('Thứ Bảy');
    expect(formatWeekdayDate(vnMidnight)).toBe('Thứ Bảy, 28/11/2026');
    expect(formatWeekdayDayMonth(vnMidnight)).toBe('Thứ Bảy 28/11');
    expect(formatWeekdayDayMonthLong(vnMidnight)).toBe('Thứ Bảy, 28 tháng 11');
    expect(formatLongWeekdayDate(vnMidnight)).toBe('Thứ Bảy, 28 tháng 11 2026');
    expect(formatWeekdayDateTimeVN(vnMorning)).toBe('09:30, Thứ Bảy 28/11/2026');
    expect(formatTime(vnEarlyMorning)).toBe('03:30');
    expect(formatDate(vnEarlyMorning)).toBe('28/11/2026');
  });

  it('xử lý mốc giao thừa và chuỗi ngày thuần YYYY-MM-DD không lệch ngày', () => {
    expect(toVnDateKey(vnNewYear)).toBe('2027-01-01');
    expect(getVnYear(new Date(vnNewYear))).toBe(2027);
    expect(formatDate('2026-11-28')).toBe('28/11/2026');
    expect(formatWeekday('2026-11-28')).toBe('Thứ Bảy');
    expect(parseVnDateKey('2026-11-28').toISOString()).toBe('2026-11-27T17:00:00.000Z');
    expect(startOfVnDay(new Date(vnEarlyMorning)).toISOString()).toBe('2026-11-27T17:00:00.000Z');
  });

  it('chuyển datetime-local sang ISO theo +07:00 bất kể TZ trình duyệt', () => {
    expect(vnDateTimeLocalToIso('2026-11-28T09:30')).toBe('2026-11-28T02:30:00.000Z');
    expect(vnDateTimeLocalToIso('2026-11-28T00:15')).toBe('2026-11-27T17:15:00.000Z');
    expect(vnDateTimeLocalToIso('2026-11-28T9:05')).toBe('2026-11-28T02:05:00.000Z');
  });

  it('tính toán cộng/trừ ngày, tuần, tháng và mốc đầu kỳ theo lịch Việt Nam', () => {
    expect(addVnDays('2026-11-28', 1)).toBe('2026-11-29');
    expect(addVnDays('2026-11-28', -30)).toBe('2026-10-29');
    expect(addVnWeeks('2026-11-28', 1)).toBe('2026-12-05');
    expect(addVnMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addVnMonths('2026-11-28', 2)).toBe('2027-01-28');

    // 2026-11-29 là Chủ Nhật (0) -> đầu tuần Thứ Hai là 2026-11-23
    expect(getVnDayOfWeek('2026-11-29')).toBe(0);
    expect(startOfVnWeek('2026-11-29')).toBe('2026-11-23');
    // 2026-11-23 là Thứ Hai (1) -> giữ nguyên 2026-11-23
    expect(getVnDayOfWeek('2026-11-23')).toBe(1);
    expect(startOfVnWeek('2026-11-23')).toBe('2026-11-23');

    expect(startOfVnMonth('2026-11-28')).toBe('2026-11-01');
    expect(startOfVnQuarter('2026-11-28')).toBe('2026-10-01');
    expect(startOfVnYear('2026-11-28')).toBe('2026-01-01');

    expect(diffVnDays('2026-11-28', '2026-12-01')).toBe(3);
    expect(diffVnYears('2025-11-28', new Date(vnEarlyMorning))).toBe(1);
    expect(diffVnMonths('2026-05-28', new Date(vnEarlyMorning))).toBe(6);
  });

  it('messaging-format, inventory expiry và petAgeLabel nhất quán qua ranh giới nửa đêm VN', () => {
    const now = new Date('2026-11-27T18:00:00.000Z'); // 01:00 ngày 28/11/2026 VN
    const sameVnDay = '2026-11-27T17:15:00.000Z'; // 00:15 ngày 28/11/2026 VN
    const yesterdayVn = '2026-11-27T16:45:00.000Z'; // 23:45 ngày 27/11/2026 VN
    const earlierYear = '2025-10-05T02:00:00.000Z'; // 09:00 ngày 05/10/2025 VN

    expect(formatMessageTime(sameVnDay)).toBe('00:15');
    expect(formatListTime(sameVnDay, now)).toBe('00:15');
    expect(formatListTime(yesterdayVn, now)).toBe('Hôm qua');
    expect(formatListTime(earlierYear, now)).toBe('05/10/2025');

    expect(formatDayDivider(sameVnDay, now)).toBe('Hôm nay');
    expect(formatDayDivider(yesterdayVn, now)).toBe('Hôm qua');
    expect(formatDayDivider('2026-11-20T03:00:00.000Z', now)).toBe('Thứ Sáu, 20 tháng 11');
    expect(formatDayDivider(earlierYear, now)).toBe('05/10/2025');

    expect(daysUntilExpiry('2026-11-28', now)).toBe(0);
    expect(daysUntilExpiry('2026-11-27', now)).toBe(-1);
    expect(petAgeLabel('2025-11-28', now)).toBe('1 tuổi');
  });
});
