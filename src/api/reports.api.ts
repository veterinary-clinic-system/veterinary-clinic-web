import { apiClient } from './client';

export interface RevenuePoint {
  period: string;
  totalRevenue: number;
  invoiceCount: number;
}

export interface AiAccuracyReport {
  totalEvaluated: number;
  accepted: number;
  overridden: number;
  acceptanceRate: number;
  breakdownByColor: { aiPriorityColor: string; acceptedCount: number; overriddenCount: number }[];
}

/** Một thẻ KPI của `GET /reports/dashboard` — khớp `DashboardKpi` phía backend. */
export interface DashboardKpi {
  key: string;
  label: string;
  value: number;
  format: 'currency' | 'count';
  /** `null` khi kỳ trước bằng 0 — không so sánh được, không phải "tăng vô hạn". */
  deltaRatio: number | null;
  link?: string;
}

export interface DashboardSeries {
  key: string;
  title: string;
  format: 'currency' | 'count';
  points: { label: string; value: number }[];
}

export interface DashboardResponse {
  generatedAt: string;
  branchId: string | null;
  kpis: DashboardKpi[];
  charts: DashboardSeries[];
}

/** Bộ lọc của SRS mục 19: khoảng ngày + phương thức thanh toán + nhân viên thu tiền. */
export interface ReportFilterParams {
  from: string;
  to: string;
  branchId?: string;
  paymentMethod?: string;
  employeeUserId?: string;
}

/** `GET /reports/revenue/summary` — sáu con số của SRS mục 19, đọc từ `payments`. */
export interface RevenueSummaryReport {
  totalRevenue: number;
  totalPaid: number;
  totalRefunded: number;
  totalUnpaid: number;
  invoiceCount: number;
  unpaidInvoiceCount: number;
}

/** `GET /reports/inventory` — ảnh chụp kho tại thời điểm đọc, không theo khoảng ngày. */
export interface InventoryReport {
  totalProducts: number;
  totalMedicines: number;
  totalVaccines: number;
  lowStock: number;
  outOfStock: number;
  expiringSoon: number;
  expired: number;
  expiringSoonDays: number;
}

export interface SalesReportRow {
  itemCode: string;
  itemName: string;
  itemType: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface TopVeterinarian {
  doctorId: string;
  doctorName: string;
  examCount: number;
  noShowCount: number;
}

export interface ExamSummaryReport {
  totalAppointments: number;
  completed: number;
  noShow: number;
  cancelled: number;
  /** Trong khoảng [0, 1]. */
  noShowRate: number;
  topVeterinarians: TopVeterinarian[];
}

export const reportsApi = {
  /** FR-24 — một request duy nhất cho cả 8 KPI và 8 biểu đồ. */
  dashboard: (branchId?: string) =>
    apiClient
      .get<DashboardResponse>('/reports/dashboard', { params: { branchId } })
      .then((r) => r.data),
  revenue: (params: { from: string; to: string; groupBy?: 'day' | 'month'; branchId?: string }) =>
    apiClient.get<RevenuePoint[]>('/reports/revenue', { params }).then((r) => r.data),
  revenueByService: (params: { from: string; to: string; branchId?: string }) =>
    apiClient
      .get<{ serviceName: string; totalRevenue: number; count: number }[]>('/reports/revenue/by-service', {
        params,
      })
      .then((r) => r.data),
  revenueByDoctor: (params: { from: string; to: string; branchId?: string }) =>
    apiClient
      .get<{ doctorId: string; doctorName: string; totalRevenue: number; appointmentCount: number }[]>(
        '/reports/revenue/by-doctor',
        { params },
      )
      .then((r) => r.data),
  examVolumeByDiseaseGroup: (params: { from?: string; to?: string; branchId?: string }) =>
    apiClient
      .get<{ diseaseGroup: string; count: number }[]>('/reports/exam-volume-by-disease-group', { params })
      .then((r) => r.data),
  aiAccuracy: (params: { from?: string; to?: string; branchId?: string }) =>
    apiClient.get<AiAccuracyReport>('/reports/ai-accuracy', { params }).then((r) => r.data),

  // ------------------------------------------------- Báo cáo vận hành (P10-T4)

  revenueSummary: (params: ReportFilterParams) =>
    apiClient.get<RevenueSummaryReport>('/reports/revenue/summary', { params }).then((r) => r.data),
  inventory: (branchId?: string) =>
    apiClient.get<InventoryReport>('/reports/inventory', { params: { branchId } }).then((r) => r.data),
  sales: (params: ReportFilterParams) =>
    apiClient.get<SalesReportRow[]>('/reports/sales', { params }).then((r) => r.data),
  exams: (params: { from?: string; to?: string; branchId?: string }) =>
    apiClient.get<ExamSummaryReport>('/reports/exams', { params }).then((r) => r.data),

  /**
   * Tải file CSV báo cáo bán hàng.
   *
   * `responseType: 'blob'` là bắt buộc: mặc định axios diễn giải phần thân là văn bản
   * theo UTF-8 và sẽ NUỐT MẤT dấu BOM ở đầu file — mà chính dấu đó nói cho Excel trên
   * Windows biết file là UTF-8. Mất nó thì "Cà phê" mở ra thành "CÃ  phÃª".
   */
  exportSales: (params: ReportFilterParams) =>
    apiClient
      .get<Blob>('/reports/sales/export', { params, responseType: 'blob' })
      .then((r) => r.data),
};
