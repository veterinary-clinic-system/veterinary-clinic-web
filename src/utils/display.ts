import { Gender, Specialization } from '@/types/enums';
import { SPECIALIZATION_LABEL_VI } from './labels';

/** Gender has no *_LABEL_VI map in src/types/enums.ts yet - PriorityColor and
 * CommonSymptom do (reused directly from there); this fills the one gap. */
export const GENDER_LABEL_VI: Record<Gender, string> = {
  [Gender.MALE]: 'Đực',
  [Gender.FEMALE]: 'Cái',
  [Gender.HERMAPHRODITE]: 'Lưỡng tính',
  [Gender.ASEXUAL]: 'Vô tính',
};

/**
 * Small display helpers specific to the public/owner pages (src/pages/public,
 * src/pages/owner). Kept separate from src/utils/format.ts and src/utils/labels.ts
 * (owned jointly with the staff-side pages) to avoid concurrent-edit collisions -
 * this file only ever gets new additions from the public/owner side.
 */

/** Vietnamese weekday labels indexed by the backend's `dayOfWeek` (0 = Sunday ... 6 = Saturday). */
export const WEEKDAY_LABELS_VI = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

/**
 * Branch opening-hours / doctor-shift times arrive as plain "08:00:00" strings (not full
 * ISO datetimes), so date-fns' parseISO-based formatTime() in format.ts doesn't apply here.
 */
export function formatTimeHHmm(time: string): string {
  return time.length >= 5 ? time.slice(0, 5) : time;
}

/** First letter of a display name, for avatar-fallback circles. */
export function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

/**
 * Doctor specialization values come back from the public doctors endpoint typed as plain
 * `string[]`, not the `Specialization` enum, so the lookup falls back to a readable
 * "GENERAL_PRACTICE" -> "General Practice" transform for anything unmapped.
 */
export function specializationLabel(value: string): string {
  const known = SPECIALIZATION_LABEL_VI[value as Specialization];
  if (known) return known;
  return value
    .toLowerCase()
    .split('_')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}
