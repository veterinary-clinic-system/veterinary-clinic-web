export const VN_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATETIME_LOCAL_RE = /^(\d{4}-\d{2}-\d{2})T(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

const VN_TIME_PARTS_FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: VN_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const VN_WEEKDAY_FMT = new Intl.DateTimeFormat('vi-VN', {
  timeZone: VN_TIME_ZONE,
  weekday: 'long',
});

const VN_DATE_PARTS_FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: VN_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

/**
 * Chuyển chuỗi ISO hoặc ngày YYYY-MM-DD sang Date an toàn theo múi giờ Việt Nam.
 * Chuỗi ngày thuần (YYYY-MM-DD) luôn được hiểu là 00:00:00+07:00 để tránh lệch ngày khi trình duyệt ở múi giờ khác.
 */
function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  if (DATE_ONLY_RE.test(value)) {
    return new Date(`${value}T00:00:00+07:00`);
  }
  return new Date(value);
}

function formatYmd(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function splitDateKey(value: string | Date): [number, number, number] {
  const key = toVnDateKey(value);
  const [y, m, d] = key.split('-').map(Number);
  return [y, m, d];
}

/**
 * Trả về khóa ngày YYYY-MM-DD theo múi giờ Việt Nam (Asia/Ho_Chi_Minh).
 */
export function toVnDateKey(value: string | Date = new Date()): string {
  if (typeof value === 'string' && DATE_ONLY_RE.test(value)) {
    return value;
  }
  const parts = VN_DATE_PARTS_FMT.formatToParts(toDate(value));
  const year = parts.find((p) => p.type === 'year')?.value ?? '0000';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Phân tích khóa ngày YYYY-MM-DD (hoặc Date/ISO) thành mốc 00:00:00+07:00 của ngày đó tại Việt Nam.
 */
export function parseVnDateKey(value: string | Date): Date {
  return new Date(`${toVnDateKey(value)}T00:00:00+07:00`);
}

/**
 * Mốc bắt đầu ngày hôm nay (00:00:00+07:00) theo múi giờ Việt Nam.
 */
export function startOfVnDay(date: Date = new Date()): Date {
  return parseVnDateKey(todayLocalIso(date));
}

/**
 * Ngày hôm nay dạng YYYY-MM-DD theo múi giờ Việt Nam (Asia/Ho_Chi_Minh).
 */
export function todayLocalIso(date: Date = new Date()): string {
  return toVnDateKey(date);
}

/**
 * Năm hiện tại theo múi giờ Việt Nam (Asia/Ho_Chi_Minh).
 */
export function getVnYear(date: Date = new Date()): number {
  return Number(todayLocalIso(date).slice(0, 4));
}

/**
 * Chuyển giá trị từ input datetime-local (YYYY-MM-DDTHH:mm) theo giờ phòng khám Việt Nam (+07:00) sang ISO UTC.
 */
export function vnDateTimeLocalToIso(value: string): string {
  const match = value.trim().match(DATETIME_LOCAL_RE);
  if (match) {
    const [, datePart, hour, minute, second = '00'] = match;
    return new Date(`${datePart}T${hour.padStart(2, '0')}:${minute}:${second}+07:00`).toISOString();
  }
  return new Date(value).toISOString();
}

export function addVnDays(value: string | Date, days: number): string {
  const [y, m, d] = splitDateKey(value);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return formatYmd(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
}

export function addVnWeeks(value: string | Date, weeks: number): string {
  return addVnDays(value, weeks * 7);
}

export function addVnMonths(value: string | Date, months: number): string {
  const [y, m, d] = splitDateKey(value);
  const totalMonths = y * 12 + (m - 1) + months;
  const nextYear = Math.floor(totalMonths / 12);
  const nextMonthIndex = ((totalMonths % 12) + 12) % 12;
  const daysInNextMonth = new Date(Date.UTC(nextYear, nextMonthIndex + 1, 0)).getUTCDate();
  return formatYmd(nextYear, nextMonthIndex + 1, Math.min(d, daysInNextMonth));
}

/**
 * Thứ trong tuần theo lịch Việt Nam (0 = Chủ nhật .. 6 = Thứ bảy).
 */
export function getVnDayOfWeek(value: string | Date): number {
  const [y, m, d] = splitDateKey(value);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Thứ hai đầu tuần (weekStartsOn = 1) của ngày truyền vào theo lịch Việt Nam. */
export function startOfVnWeek(value: string | Date): string {
  const diffFromMonday = (getVnDayOfWeek(value) + 6) % 7;
  return addVnDays(value, -diffFromMonday);
}

export function startOfVnMonth(value: string | Date): string {
  const [y, m] = splitDateKey(value);
  return formatYmd(y, m, 1);
}

export function startOfVnQuarter(value: string | Date): string {
  const [y, m] = splitDateKey(value);
  const quarterStartMonth = Math.floor((m - 1) / 3) * 3 + 1;
  return formatYmd(y, quarterStartMonth, 1);
}

export function startOfVnYear(value: string | Date): string {
  const [y] = splitDateKey(value);
  return formatYmd(y, 1, 1);
}

/** Hiệu số ngày theo lịch Việt Nam (to - from). */
export function diffVnDays(from: string | Date, to: string | Date): number {
  const [y1, m1, d1] = splitDateKey(from);
  const [y2, m2, d2] = splitDateKey(to);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

/** Số năm trọn vẹn giữa hai mốc theo lịch Việt Nam (to - from). */
export function diffVnYears(from: string | Date, to: string | Date = new Date()): number {
  const [y1, m1, d1] = splitDateKey(from);
  const [y2, m2, d2] = splitDateKey(to);
  let years = y2 - y1;
  if (m2 < m1 || (m2 === m1 && d2 < d1)) years -= 1;
  return years;
}

/** Số tháng trọn vẹn giữa hai mốc theo lịch Việt Nam (to - from). */
export function diffVnMonths(from: string | Date, to: string | Date = new Date()): number {
  const [y1, m1, d1] = splitDateKey(from);
  const [y2, m2, d2] = splitDateKey(to);
  let months = (y2 - y1) * 12 + (m2 - m1);
  if (d2 < d1) months -= 1;
  return months;
}

export function formatDate(value: string | Date): string {
  const [y, m, d] = splitDateKey(value);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${String(y).padStart(4, '0')}`;
}

export function formatDayMonth(value: string | Date): string {
  const [, m, d] = splitDateKey(value);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

export function formatDayNumber(value: string | Date): string {
  const [, , d] = splitDateKey(value);
  return String(d);
}

export function formatMonthYear(value: string | Date): string {
  const [y, m] = splitDateKey(value);
  return `Tháng ${m}/${y}`;
}

export function formatTime(value: string | Date): string {
  const parts = VN_TIME_PARTS_FMT.formatToParts(toDate(value));
  const rawHour = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const hour = rawHour === '24' ? '00' : rawHour.padStart(2, '0');
  const minute = (parts.find((p) => p.type === 'minute')?.value ?? '00').padStart(2, '0');
  return `${hour}:${minute}`;
}

export function formatDateTime(value: string | Date): string {
  const date = toDate(value);
  return `${formatTime(date)} ${formatDate(date)}`;
}

export function formatWeekday(value: string | Date): string {
  return VN_WEEKDAY_FMT.format(toDate(value));
}

export function formatWeekdayDate(value: string | Date): string {
  const date = toDate(value);
  return `${formatWeekday(date)}, ${formatDate(date)}`;
}

export function formatWeekdayDayMonth(value: string | Date): string {
  const date = toDate(value);
  return `${formatWeekday(date)} ${formatDayMonth(date)}`;
}

export function formatWeekdayDayMonthLong(value: string | Date): string {
  const date = toDate(value);
  const [, m, d] = splitDateKey(date);
  return `${formatWeekday(date)}, ${String(d).padStart(2, '0')} tháng ${String(m).padStart(2, '0')}`;
}

export function formatLongWeekdayDate(value: string | Date): string {
  const date = toDate(value);
  const [y, m, d] = splitDateKey(date);
  return `${formatWeekday(date)}, ${String(d).padStart(2, '0')} tháng ${m} ${y}`;
}

export function formatWeekdayDateTimeVN(value: string | Date): string {
  const date = toDate(value);
  return `${formatTime(date)}, ${formatWeekday(date)} ${formatDate(date)}`;
}

export function isDeletedPhone(phone?: string | null): boolean {
  return !!phone && phone.startsWith('del-');
}

export function maskDeletedPhone(phone?: string | null): string {
  if (!phone || isDeletedPhone(phone)) return '—';
  return phone;
}
