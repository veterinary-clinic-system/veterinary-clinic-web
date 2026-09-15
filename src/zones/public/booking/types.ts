import { Gender } from '@/types/enums';
import { SlotInfo } from '@/types/models';

export type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const STEP_LABELS = [
  'Chi nhánh',
  'Dịch vụ',
  'Bác sĩ',
  'Thời gian',
  'Thông tin',
  'Triệu chứng',
  'Xác nhận',
] as const;

export const ANY_DOCTOR = '';

export interface NewPetFormState {
  name: string;
  speciesId: string;
  breedId: string;
  gender: Gender;
  weight: string;
  birthDate: string;
}

export const EMPTY_NEW_PET: NewPetFormState = {
  name: '',
  speciesId: '',
  breedId: '',
  gender: Gender.MALE,
  weight: '',
  birthDate: '',
};

export interface PhotoItem {
  id: string;
  name: string;
  status: 'uploading' | 'done' | 'error';
  url?: string;
}

export type LookupState = 'idle' | 'loading' | 'found' | 'new';

export type SelectedSlot = SlotInfo & { dayDate: string };

export type PetMode = 'existing' | 'new';

export interface BookingHandoffState {
  doctorId?: string;
  branchId?: string;
  serviceId?: string;
  petId?: string;
}
