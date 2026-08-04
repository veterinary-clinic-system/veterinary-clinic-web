import { apiClient } from './client';
import { Diagnosis, MedicalRecord, Treatment } from '@/types/models';

/**
 * Hồ sơ bệnh án (SRS FR-07…FR-10) — API của màn hình khám bệnh UC-03.
 *
 * `open` là **idempotent** ở phía server: gọi lại cho cùng một lịch hẹn trả về đúng
 * hồ sơ đã có. Nhờ vậy màn hình khám gọi thẳng nó mỗi lần mở, không cần thử-GET-rồi-POST.
 *
 * Chẩn đoán và điều trị được TẠO dưới hồ sơ cha nhưng SỬA/XOÁ qua định danh của
 * chính nó (`/diagnoses/:id`, `/treatments/:id`) — khớp với hình dạng route của backend.
 */
export const medicalRecordsApi = {
  open: (payload: {
    appointmentId: string;
    visitReason?: string;
    generalCondition?: string;
    notes?: string;
  }) => apiClient.post<MedicalRecord>('/medical-records', payload).then((r) => r.data),

  getOne: (id: string) =>
    apiClient.get<MedicalRecord>(`/medical-records/${id}`).then((r) => r.data),

  getByAppointment: (appointmentId: string) =>
    apiClient
      .get<MedicalRecord>(`/medical-records/by-appointment/${appointmentId}`)
      .then((r) => r.data),

  /** Bệnh sử của thú cưng — cột trái của màn hình khám. */
  getTimelineForPet: (petId: string) =>
    apiClient.get<MedicalRecord[]>(`/medical-records/by-pet/${petId}`).then((r) => r.data),

  update: (
    id: string,
    payload: { visitReason?: string; generalCondition?: string; notes?: string },
  ) => apiClient.patch<MedicalRecord>(`/medical-records/${id}`, payload).then((r) => r.data),

  /** Chốt hồ sơ: DRAFT → COMPLETED, đồng thời đóng lịch hẹn. Từ đây BR-08 khoá mọi sửa đổi. */
  complete: (id: string) =>
    apiClient.post<MedicalRecord>(`/medical-records/${id}/complete`).then((r) => r.data),

  addDiagnosis: (
    medicalRecordId: string,
    payload: {
      diagnosisText: string;
      diseaseId?: string;
      severity?: string;
      notes?: string;
      isPrimary?: boolean;
    },
  ) =>
    apiClient
      .post<Diagnosis>(`/medical-records/${medicalRecordId}/diagnoses`, payload)
      .then((r) => r.data),

  updateDiagnosis: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch<Diagnosis>(`/diagnoses/${id}`, payload).then((r) => r.data),

  removeDiagnosis: (id: string) => apiClient.delete(`/diagnoses/${id}`).then(() => undefined),

  addTreatment: (
    medicalRecordId: string,
    payload: {
      method: string;
      description?: string;
      startDate: string;
      endDate?: string;
      instruction?: string;
      notes?: string;
    },
  ) =>
    apiClient
      .post<Treatment>(`/medical-records/${medicalRecordId}/treatments`, payload)
      .then((r) => r.data),

  updateTreatment: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch<Treatment>(`/treatments/${id}`, payload).then((r) => r.data),

  removeTreatment: (id: string) => apiClient.delete(`/treatments/${id}`).then(() => undefined),
};
