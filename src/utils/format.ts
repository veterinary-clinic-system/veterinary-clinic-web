const VN_TZ = 'Asia/Ho_Chi_Minh';

const VN_DATE_FMT = new Intl.DateTimeFormat('vi-VN', {
  timeZone: VN_TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const VN_TIME_FMT = new Intl.DateTimeFormat('vi-VN', {
  timeZone: VN_TZ,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const VN_WEEKDAY_FMT = new Intl.DateTimeFormat('vi-VN', {
  timeZone: VN_TZ,
  weekday: 'long',
});

const VN_ISO_DATE_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: VN_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? new Date(value) : value;
}

export function formatDate(value: string | Date): string {
  return VN_DATE_FMT.format(toDate(value));
}

export function formatDateTime(value: string | Date): string {
  const date = toDate(value);
  return `${VN_TIME_FMT.format(date)} ${VN_DATE_FMT.format(date)}`;
}

export function formatTime(value: string | Date): string {
  return VN_TIME_FMT.format(toDate(value));
}

export function formatWeekdayDateTimeVN(value: string | Date): string {
  const date = toDate(value);
  return `${VN_TIME_FMT.format(date)}, ${VN_WEEKDAY_FMT.format(date)} ${VN_DATE_FMT.format(date)}`;
}

/**
 * Ngày hôm nay dạng YYYY-MM-DD theo múi giờ Việt Nam (Asia/Ho_Chi_Minh).
 */
export function todayLocalIso(date: Date = new Date()): string {
  return VN_ISO_DATE_FMT.format(date);
}

export function isDeletedPhone(phone?: string | null): boolean {
  return !!phone && phone.startsWith('del-');
}

export function maskDeletedPhone(phone?: string | null): string {
  if (!phone || isDeletedPhone(phone)) return '—';
  return phone;
}
