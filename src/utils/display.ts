import { Gender, Specialization } from '@/types/enums';
import { SPECIALIZATION_LABEL_VI } from './labels';

export const GENDER_LABEL_VI: Record<Gender, string> = {
  [Gender.MALE]: 'Đực',
  [Gender.FEMALE]: 'Cái',
  [Gender.HERMAPHRODITE]: 'Lưỡng tính',
  [Gender.ASEXUAL]: 'Vô tính',
};

export const WEEKDAY_LABELS_VI = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

export function formatTimeHHmm(time: string): string {
  return time.length >= 5 ? time.slice(0, 5) : time;
}

export function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export function specializationLabel(value: string): string {
  const known = SPECIALIZATION_LABEL_VI[value as Specialization];
  if (known) return known;
  return value
    .toLowerCase()
    .split('_')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}
