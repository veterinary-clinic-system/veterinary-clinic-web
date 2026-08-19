import { differenceInMonths, differenceInYears, parseISO } from 'date-fns';
import { Pet } from '@/types/models';

/**
 * Tuổi của thú cưng, viết theo cách người nuôi nói.
 *
 * Dưới một tuổi thì tính bằng tháng - với chó mèo con, khoảng cách giữa 2 tháng và 8
 * tháng là khác biệt lớn về lịch tiêm và chế độ ăn, còn "0 tuổi" thì không nói gì.
 */
export function petAgeLabel(birthDate: string | null): string | null {
  if (!birthDate) return null;

  const born = parseISO(birthDate);
  const years = differenceInYears(new Date(), born);
  if (years >= 1) return `${years} tuổi`;

  const months = differenceInMonths(new Date(), born);
  if (months >= 1) return `${months} tháng tuổi`;
  return 'Dưới 1 tháng tuổi';
}

/** "Golden Retriever · Chó" - giống trước, loài sau, vì giống mới là thứ phân biệt. */
export function petBreedLabel(pet: Pet): string {
  const breed = pet.breed?.breedName;
  const species = pet.breed?.species?.speciesName;
  if (breed && species) return `${breed} · ${species}`;
  return breed ?? species ?? 'Chưa rõ giống';
}

/**
 * Các cảnh báo y tế cần đọc TRƯỚC mọi thông tin khác của một bé.
 *
 * Dùng chung giữa hồ sơ phía chủ nuôi và phía lâm sàng: dị ứng thuốc là thứ không được
 * phép chỉ hiện ở một trong hai nơi.
 */
export function petAlerts(pet: Pet): { tone: 'danger' | 'warning'; label: string }[] {
  const alerts: { tone: 'danger' | 'warning'; label: string }[] = [];
  if (pet.allergies.length > 0) {
    alerts.push({ tone: 'danger', label: `Dị ứng: ${pet.allergies.join(', ')}` });
  }
  if (pet.chronicConditions.length > 0) {
    alerts.push({ tone: 'warning', label: `Bệnh mãn tính: ${pet.chronicConditions.join(', ')}` });
  }
  return alerts;
}
