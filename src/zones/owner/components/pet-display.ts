import { differenceInMonths, differenceInYears, parseISO } from 'date-fns';
import { Pet } from '@/types/models';

export function petAgeLabel(birthDate: string | null): string | null {
  if (!birthDate) return null;

  const born = parseISO(birthDate);
  const years = differenceInYears(new Date(), born);
  if (years >= 1) return `${years} tuổi`;

  const months = differenceInMonths(new Date(), born);
  if (months >= 1) return `${months} tháng tuổi`;
  return 'Dưới 1 tháng tuổi';
}

export function petBreedLabel(pet: Pet): string {
  const breed = pet.breed?.breedName;
  const species = pet.breed?.species?.speciesName;
  if (breed && species) return `${breed} · ${species}`;
  return breed ?? species ?? 'Chưa rõ giống';
}

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
