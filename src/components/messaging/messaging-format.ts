import { format, isSameDay, isSameYear, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';

/** Mốc thời gian gọn cho danh sách cuộc trò chuyện: giờ nếu hôm nay, "Hôm qua", hoặc ngày. */
export function formatListTime(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  if (isSameDay(date, now)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Hôm qua';
  return format(date, isSameYear(date, now) ? 'dd/MM' : 'dd/MM/yyyy');
}

/** Tiêu đề ngăn cách ngày trong luồng tin nhắn. */
export function formatDayDivider(value: string): string {
  const date = new Date(value);
  const now = new Date();
  if (isSameDay(date, now)) return 'Hôm nay';
  if (isYesterday(date)) return 'Hôm qua';
  return format(date, isSameYear(date, now) ? "EEEE, dd 'tháng' MM" : 'dd/MM/yyyy', { locale: vi });
}

export function formatMessageTime(value: string): string {
  return format(new Date(value), 'HH:mm');
}
