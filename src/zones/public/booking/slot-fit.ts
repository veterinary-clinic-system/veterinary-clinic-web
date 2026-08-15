import { SlotStatus } from '@/types/enums';
import { SlotInfo } from '@/types/models';

/**
 * Một dịch vụ có đặt vừa vào khung giờ này không?
 *
 * Lưới lịch là 30 phút, nhưng dịch vụ có thể dài hơn: "Phẫu thuật nhỏ" 60 phút chiếm
 * HAI ô liên tiếp. Vì vậy không phải ô FREE nào cũng đặt được - ô cuối buổi và ô ngay
 * trước giờ nghỉ trưa thì không đủ chỗ.
 *
 * Ba điều kiện, giống hệt `slotsCovering()` phía backend
 * (`scheduling/application/availability.service.ts`):
 *   1. Bắt đầu ĐÚNG mép một ô.
 *   2. Các ô phủ LIÊN TỤC - không được nhảy qua khe hở nghỉ trưa rồi đếm tiếp ở bên kia.
 *   3. Ô cuối phải chạm tới thời điểm kết thúc.
 * Và mọi ô bị chiếm đều phải đang FREE.
 *
 * Hàm này chỉ để LÀM MỜ những ô không chọn được, cho khách khỏi chọn xong mới nhận lỗi
 * ở bước cuối. Hàng rào thật vẫn nằm ở backend - đây là bản sao có chủ ý, nên hai bên
 * phải sửa cùng nhau.
 */
export function slotFitsService(
  daySlots: SlotInfo[],
  slot: SlotInfo,
  durationMinutes: number,
): boolean {
  const start = new Date(slot.startAt).getTime();
  const end = start + durationMinutes * 60_000;

  const covered = daySlots
    .filter((other) => {
      const otherStart = new Date(other.startAt).getTime();
      const otherEnd = new Date(other.endAt).getTime();
      return otherStart < end && start < otherEnd;
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  if (covered.length === 0) return false;
  if (new Date(covered[0].startAt).getTime() !== start) return false;
  if (new Date(covered[covered.length - 1].endAt).getTime() < end) return false;

  for (let i = 1; i < covered.length; i++) {
    if (new Date(covered[i].startAt).getTime() !== new Date(covered[i - 1].endAt).getTime()) {
      return false;
    }
  }

  return covered.every((other) => other.status === SlotStatus.FREE);
}
