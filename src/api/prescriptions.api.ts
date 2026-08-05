import { apiClient } from './client';
import {
  MedicationRoute,
  PaginatedResult,
  Prescription,
  PrescriptionStatus,
  PrescriptionView,
} from '@/types/models';

export interface PrescriptionListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  status?: PrescriptionStatus;
  petId?: string;
  medicalRecordId?: string;
  branchId?: string;
}

export interface PrescriptionItemPayload {
  medicationId: string;
  /** Số lượng thực cấp — con số trừ kho và tính tiền. */
  quantity: number;
  dosage: string;
  frequency?: string;
  durationDays: number;
  route?: MedicationRoute;
  instructions?: string;
}

export interface PrescriptionPayload {
  medicalRecordId: string;
  notes?: string;
  items: PrescriptionItemPayload[];
}

/**
 * Đơn thuốc và cấp phát — SRS FR-11.
 *
 * Mọi endpoint đọc một đơn đều trả về `PrescriptionView`: đơn **kèm** tình trạng kho
 * từng dòng, tính tại thời điểm đọc. Số tồn cố ý không được lưu vào đơn — nó sai ngay
 * sau lần bán hàng tiếp theo, mà quầy thuốc cần số thật lúc dược sĩ đang nhìn.
 */
export const prescriptionsApi = {
  /** `?status=PRESCRIBED` chính là hàng chờ quầy thuốc (backend sắp cũ nhất trước). */
  list: (params: PrescriptionListParams = {}) =>
    apiClient.get<PaginatedResult<Prescription>>('/prescriptions', { params }).then((r) => r.data),
  getOne: (id: string) =>
    apiClient.get<PrescriptionView>(`/prescriptions/${id}`).then((r) => r.data),
  create: (payload: PrescriptionPayload) =>
    apiClient.post<PrescriptionView>('/prescriptions', payload).then((r) => r.data),
  /** Chỉ làm được khi đơn còn `PRESCRIBED`; `items` thay thế toàn bộ các dòng. */
  update: (id: string, payload: Partial<Omit<PrescriptionPayload, 'medicalRecordId'>>) =>
    apiClient.patch<PrescriptionView>(`/prescriptions/${id}`, payload).then((r) => r.data),
  /** Dược sĩ nhận đơn về quầy. Chưa động tới kho. */
  startDispensing: (id: string) =>
    apiClient.post<PrescriptionView>(`/prescriptions/${id}/start-dispense`, {}).then((r) => r.data),
  /** Xác nhận đã soạn đủ → trừ kho cả đơn trong một transaction (BR-10). */
  dispense: (id: string) =>
    apiClient.post<PrescriptionView>(`/prescriptions/${id}/dispense`, {}).then((r) => r.data),
  cancel: (id: string) =>
    apiClient.post<PrescriptionView>(`/prescriptions/${id}/cancel`, {}).then((r) => r.data),
};
