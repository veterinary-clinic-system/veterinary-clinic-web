import type { BadgeVariant } from '@/components/basic';

/** Ngưỡng "sắp hết hạn" phía giao diện — khớp mặc định của backend (FR-18-04). */
export const EXPIRING_SOON_DAYS = 30;

export type ExpiryLevel = 'none' | 'ok' | 'soon' | 'expired';

/**
 * Số ngày còn lại tới hạn dùng. Âm = đã hết hạn, `null` = hàng không có hạn.
 *
 * So sánh theo **ngày** chứ không theo thời điểm, khớp với `isExpired` phía backend:
 * lô hạn hôm nay vẫn còn dùng được hết ngày hôm nay.
 */
export function daysUntilExpiry(expiryDate: string | null | undefined): number | null {
  if (!expiryDate) return null;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const expiry = new Date(`${expiryDate}T00:00:00`);
  return Math.round((expiry.getTime() - startOfToday.getTime()) / 86_400_000);
}

/** Mức độ gần hạn của một lô — dùng để tô màu cột HSD trên màn hình kho. */
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

/** Nhãn tiếng Việt kèm số ngày — "Còn 12 ngày", "Quá hạn 3 ngày". */
export function expiryLabel(expiryDate: string | null | undefined): string {
  const days = daysUntilExpiry(expiryDate);
  if (days === null) return 'Không hạn dùng';
  if (days < 0) return `Quá hạn ${-days} ngày`;
  if (days === 0) return 'Hết hạn hôm nay';
  return `Còn ${days} ngày`;
}

export type StockLevel = 'out' | 'in';

/**
 * Trạng thái tồn kho của một mặt hàng.
 *
 * `InventoryItem` không mang theo ngưỡng tồn tối thiểu (backend giữ ngưỡng đó và chỉ
 * phơi nó ra qua bộ lọc `lowStock`), nên ở đây chỉ phân biệt hai mức mà dữ liệu thật sự
 * chứng minh được. Bịa thêm mức "sắp hết" từ một con số nghĩ đoán còn tệ hơn là không
 * có nó - người dùng sẽ tin vào một nhãn sai. Danh sách sắp hết nằm ở trang Cảnh báo kho.
 *
 * Trạng thái luôn đi kèm CHỮ, không chỉ màu: mục 30 của đặc tả giao diện - màu đỏ trong
 * hệ thống này dành cho "cần hành động ngay", và không được là kênh thông tin duy nhất.
 */
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
