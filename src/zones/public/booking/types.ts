import { Gender } from '@/types/enums';
import { SlotInfo } from '@/types/models';

/** Bảy bước của biểu mẫu đặt lịch. */
export type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Dịch vụ đứng TRƯỚC bác sĩ: khách nghĩ theo "tôi cần khám gì" chứ không phải "tôi
 * muốn gặp ai", và thời lượng của dịch vụ mới là thứ quyết định khung giờ nào đủ dài.
 */
export const STEP_LABELS = [
  'Chi nhánh',
  'Dịch vụ',
  'Bác sĩ',
  'Thời gian',
  'Thông tin',
  'Triệu chứng',
  'Xác nhận',
] as const;

/** Giá trị `doctorId` mang nghĩa "để phòng khám tự sắp xếp" (backend nhận `undefined`). */
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

/** Trạng thái tra cứu chủ nuôi theo số điện thoại ở bước "Thông tin". */
export type LookupState = 'idle' | 'loading' | 'found' | 'new';

/** Ô lịch đã chọn, kèm ngày của cột chứa nó. */
export type SelectedSlot = SlotInfo & { dayDate: string };

export type PetMode = 'existing' | 'new';

/**
 * Dữ liệu chọn sẵn khi khách nhảy vào biểu mẫu từ một trang khác (`location.state`):
 * nút "Đặt lịch hẹn ngay" ở trang Bác sĩ / trang Dịch vụ / hồ sơ thú cưng.
 */
export interface BookingHandoffState {
  doctorId?: string;
  branchId?: string;
  serviceId?: string;
  petId?: string;
}
