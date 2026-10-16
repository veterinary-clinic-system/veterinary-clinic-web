import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : value;
}

export function formatDate(value: string | Date): string {
  return format(toDate(value), 'dd/MM/yyyy', { locale: vi });
}

export function formatDateTime(value: string | Date): string {
  return format(toDate(value), 'HH:mm dd/MM/yyyy', { locale: vi });
}

export function formatTime(value: string | Date): string {
  return format(toDate(value), 'HH:mm', { locale: vi });
}

/**
 * Ngày hôm nay dạng YYYY-MM-DD theo giờ máy người dùng. Không dùng toISOString() vì nó
 * theo UTC — ở Việt Nam (UTC+7) từ 0h đến 7h sáng sẽ ra ngày hôm trước.
 */
export function todayLocalIso(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}
