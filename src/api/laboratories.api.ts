import { apiClient } from './client';
import {
  LabQueueRow,
  LabResultFlag,
  LabTestOrder,
  LabTestStatus,
  LabTrendSeries,
} from '@/types/models';

export interface LaboratoryResultPayload {
  parameter: string;
  value: number;
  unit?: string;
  referenceMin?: number | null;
  referenceMax?: number | null;
  /** Bỏ trống = backend tự tính từ khoảng tham chiếu. Truyền giá trị là **ghi đè**. */
  flag?: LabResultFlag;
  note?: string;
}

export interface SaveLaboratoryResultsPayload {
  results: LaboratoryResultPayload[];
  resultDate?: string;
  /** Kết quả định tính / diễn giải — đi song song với bảng chỉ số. */
  resultText?: string;
}

/**
 * Xét nghiệm có cấu trúc — SRS FR-13 (P9).
 *
 * `saveResults` là PUT vì nó **thay thế** toàn bộ bảng chỉ số của một yêu cầu: kỹ thuật
 * viên nhìn một phiếu kết quả và gõ lại cả bảng, chứ không thêm từng dòng. Nó cũng đưa
 * yêu cầu về `COMPLETED` và đóng dấu `resultDate` luôn — bắt bấm thêm một nút "đã xong"
 * nghĩa là sớm muộn sẽ có yêu cầu đủ kết quả mà vẫn nằm mãi trong hàng chờ.
 */
export const laboratoriesApi = {
  /** Hàng chờ xét nghiệm — mặc định **chưa** lấy việc đã xong. Cũ nhất lên trước. */
  queue: (params: { status?: LabTestStatus; branchId?: string } = {}) =>
    apiClient.get<LabQueueRow[]>('/laboratories/queue', { params }).then((r) => r.data),
  getOrder: (id: string) =>
    apiClient.get<LabTestOrder>(`/laboratories/orders/${id}`).then((r) => r.data),
  byMedicalRecord: (medicalRecordId: string) =>
    apiClient
      .get<LabTestOrder[]>(`/laboratories/by-medical-record/${medicalRecordId}`)
      .then((r) => r.data),
  byPet: (petId: string) =>
    apiClient.get<LabTestOrder[]>(`/laboratories/by-pet/${petId}`).then((r) => r.data),
  /** Các tên chỉ số thú cưng này đã từng đo — để dựng ô chọn chỉ số. */
  parameters: (petId: string) =>
    apiClient.get<string[]>(`/laboratories/by-pet/${petId}/parameters`).then((r) => r.data),
  /** Chuỗi thời gian của một chỉ số, sắp **tăng** dần để đọc trái sang phải. */
  trends: (petId: string, parameter: string) =>
    apiClient
      .get<LabTrendSeries>(`/laboratories/by-pet/${petId}/trends`, { params: { parameter } })
      .then((r) => r.data),
  saveResults: (labTestOrderId: string, payload: SaveLaboratoryResultsPayload) =>
    apiClient
      .put<LabTestOrder>(`/laboratories/orders/${labTestOrderId}/results`, payload)
      .then((r) => r.data),
};
