import { apiClient } from './client';
import {
  PaginatedResult,
  Vaccination,
  VaccinationDueRow,
  VaccinationRecordView,
  Vaccine,
} from '@/types/models';

export interface VaccineListParams {
  page?: number;
  limit?: number;
  active?: boolean;
  /** Lọc theo loài. Vaccine không khai loài nào (dùng cho mọi loài) **vẫn** hiện ra. */
  speciesId?: string;
  /** Tiện hơn ở màn hình khám — backend tự suy loài từ giống của thú cưng. */
  petId?: string;
}

export interface VaccinationPayload {
  petId: string;
  vaccineId: string;
  /** Bỏ trống khi tiêm dịch vụ đơn lẻ; khi đó `branchId` là bắt buộc. */
  medicalRecordId?: string;
  branchId?: string;
  vaccinatedAt?: string;
  doseNumber?: number;
  /**
   * Bỏ trống = hệ thống tự tính từ phác đồ. Truyền giá trị để bác sĩ ghi đè; truyền
   * `null` để nói rõ "không nhắc lại mũi nào nữa".
   */
  nextDueDate?: string | null;
  notes?: string;
}

/**
 * Tiêm chủng — SRS FR-12, BR-11 (P9).
 *
 * `batchNo`/`expiryDate` **không** có trong payload: backend chép lại từ đúng lô kho đã
 * xuất theo FEFO. Cho nhập tay thì sổ tiêm chủng sẽ ghi một mã lô khác với lô đã trừ, và
 * toàn bộ giá trị truy vết biến mất.
 */
export const vaccinationsApi = {
  /** Danh mục vaccine — dùng cho ô chọn khi bác sĩ ghi nhận mũi tiêm. */
  catalog: (params: VaccineListParams = {}) =>
    apiClient.get<PaginatedResult<Vaccine>>('/catalog/vaccines', { params }).then((r) => r.data),
  createVaccine: (payload: Record<string, unknown>) =>
    apiClient.post<Vaccine>('/catalog/vaccines', payload).then((r) => r.data),
  updateVaccine: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch<Vaccine>(`/catalog/vaccines/${id}`, payload).then((r) => r.data),

  /** Ghi nhận một mũi tiêm → trừ kho vaccine trong cùng transaction. */
  create: (payload: VaccinationPayload) =>
    apiClient.post<VaccinationRecordView>('/vaccinations', payload).then((r) => r.data),
  /** Sổ tiêm chủng của một thú cưng, mũi gần nhất lên trước. */
  byPet: (petId: string) =>
    apiClient
      .get<VaccinationRecordView[]>(`/vaccinations/by-pet/${petId}`)
      .then((r) => r.data),
  byMedicalRecord: (medicalRecordId: string) =>
    apiClient
      .get<VaccinationRecordView[]>(`/vaccinations/by-medical-record/${medicalRecordId}`)
      .then((r) => r.data),
  /** Danh sách gọi nhắc của lễ tân — gồm cả mũi **đã quá hạn**. */
  due: (params: { days?: number; branchId?: string } = {}) =>
    apiClient.get<VaccinationDueRow[]>('/vaccinations/due', { params }).then((r) => r.data),
};

export type { Vaccination, VaccinationRecordView };
