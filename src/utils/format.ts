import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

/** Shared VND currency formatter - used across billing/reports staff pages. */
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
