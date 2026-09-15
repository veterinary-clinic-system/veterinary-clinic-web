import type { BadgeVariant } from '@/components/basic';

export const EXPIRING_SOON_DAYS = 30;

export type ExpiryLevel = 'none' | 'ok' | 'soon' | 'expired';

export function daysUntilExpiry(expiryDate: string | null | undefined): number | null {
  if (!expiryDate) return null;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const expiry = new Date(`${expiryDate}T00:00:00`);
  return Math.round((expiry.getTime() - startOfToday.getTime()) / 86_400_000);
}

export function expiryLevel(expiryDate: string | null | undefined): ExpiryLevel {
  const days = daysUntilExpiry(expiryDate);
  if (days === null) return 'none';
  if (days < 0) return 'expired';
  return days <= EXPIRING_SOON_DAYS ? 'soon' : 'ok';
}

export const EXPIRY_BADGE_VARIANT: Record<ExpiryLevel, BadgeVariant> = {
  none: 'outline',
  ok: 'default',
  soon: 'warning',
  expired: 'destructive',
};

export function expiryLabel(expiryDate: string | null | undefined): string {
  const days = daysUntilExpiry(expiryDate);
  if (days === null) return 'Không hạn dùng';
  if (days < 0) return `Quá hạn ${-days} ngày`;
  if (days === 0) return 'Hết hạn hôm nay';
  return `Còn ${days} ngày`;
}

export type StockLevel = 'out' | 'in';

export function stockLevelOf(quantity: number): StockLevel {
  return quantity <= 0 ? 'out' : 'in';
}

export const STOCK_LEVEL_LABEL_VI: Record<StockLevel, string> = {
  out: 'Hết hàng',
  in: 'Còn hàng',
};

export const STOCK_LEVEL_BADGE_VARIANT: Record<StockLevel, BadgeVariant> = {
  out: 'destructive',
  in: 'success',
};
