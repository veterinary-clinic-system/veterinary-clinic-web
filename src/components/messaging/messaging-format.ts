import {
  addVnDays,
  formatDate,
  formatDayMonth,
  formatTime,
  formatWeekdayDayMonthLong,
  todayLocalIso,
  toVnDateKey,
} from '@/utils/format';

/** Mốc thời gian gọn cho danh sách cuộc trò chuyện: giờ nếu hôm nay, "Hôm qua", hoặc ngày (Asia/Ho_Chi_Minh). */
export function formatListTime(value: string | null, now: Date = new Date()): string {
  if (!value) return '';
  const dateKey = toVnDateKey(value);
  const todayKey = todayLocalIso(now);
  if (dateKey === todayKey) return formatTime(value);
  if (dateKey === addVnDays(todayKey, -1)) return 'Hôm qua';
  return dateKey.slice(0, 4) === todayKey.slice(0, 4) ? formatDayMonth(value) : formatDate(value);
}

/** Tiêu đề ngăn cách ngày trong luồng tin nhắn (Asia/Ho_Chi_Minh). */
export function formatDayDivider(value: string, now: Date = new Date()): string {
  const dateKey = toVnDateKey(value);
  const todayKey = todayLocalIso(now);
  if (dateKey === todayKey) return 'Hôm nay';
  if (dateKey === addVnDays(todayKey, -1)) return 'Hôm qua';
  return dateKey.slice(0, 4) === todayKey.slice(0, 4)
    ? formatWeekdayDayMonthLong(value)
    : formatDate(value);
}

export function formatMessageTime(value: string): string {
  return formatTime(value);
}
