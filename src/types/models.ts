import {
  AppointmentStatus,
  CommonSymptom,
  DiagnosisSeverity,
  Gender,
  ItemType,
  LabTestStatus,
  MedicalRecordStatus,
  PaymentMethod,
  PriorityColor,
  QueueSource,
  QueueStatus,
  Role,
  SlotStatus,
  Specialization,
} from './enums';

// Tang api client (src/api/*.api.ts) lay ca interface lan enum tu '@/types/models',
// vi mot payload luon di kem enum cua chinh no. Enum van chi duoc DINH NGHIA o
// './enums' - day chi la cua xuat lai, de khong co hai noi cung khai bao mot enum.
export * from './enums';

/** Mirrors veterinary-clinic-backend response shapes. Kept in sync by hand. */

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Branch {
  id: string;
  branchName: string;
  phone: string;
  description: string | null;
  address: string;
  active: boolean;
  openingHours?: OperatingHour[];
}

export interface OperatingHour {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
}

export interface DoctorSummary {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  yearOfStart: number | null;
  specialization: Specialization[];
  branch: { id: string; branchName: string };
}

export interface Species {
  id: string;
  speciesName: string;
  breeds?: Breed[];
}

export interface Breed {
  id: string;
  breedName: string;
  speciesId: string;
}

export interface Pet {
  id: string;
  /** Mã nghiệp vụ `TC000456` (FR-04-01) - do backend sinh, không gửi lên khi tạo. */
  petCode: string;
  name: string;
  breedId: string;
  breed?: Breed & { species?: Species };
  gender: Gender;
  weight: number | null;
  birthDate: string | null;
  microchipId: string | null;
  color: string | null;
  avatarUrl: string | null;
  notes: string | null;
  allergies: string[];
  chronicConditions: string[];
  ownerId: string;
  owner?: { id: string; fullName: string; phone: string };
}

export interface Item {
  id: string;
  itemName: string;
  describe: string | null;
  itemType: ItemType;
  unitPrice: number;
  active: boolean;
  /** Mã nghiệp vụ (DV0001 / TH0001 / SP0001…) — backend sinh, không nhận từ client. */
  code: string;
  categoryId: string | null;
  category?: Category | null;
}

/**
 * Danh mục hàng hoá (SRS FR-14/FR-15/FR-16) — một cây dùng chung cho Dịch vụ, Thuốc
 * và Sản phẩm, phân biệt bằng `itemType`.
 *
 * `GET /catalog/categories` trả về **dạng cây**: `children` đã được lồng sẵn, client
 * không phải tự dựng lại từ danh sách phẳng.
 */
export interface Category {
  id: string;
  categoryName: string;
  code: string;
  parentId: string | null;
  itemType: ItemType;
  active: boolean;
  children: Category[];
}

/** Hàng hoá bán lẻ (SRS FR-16). Giá bán ở `item.unitPrice`; `costPrice` là giá vốn. */
export interface Product {
  id: string;
  itemId: string;
  item: Item;
  sku: string;
  brand: string | null;
  unit: string;
  costPrice: number;
  minimumStock: number;
  active: boolean;
}

/** Nhà cung cấp (SRS FR-17). */
export interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  contactPerson: string | null;
  taxCode: string | null;
  active: boolean;
  note: string | null;
  createdAt: string;
}

export interface Service {
  id: string;
  itemId: string;
  item: Item;
  durationMinutes: number;
  requiresSpecialization: string | null;
  active: boolean;
}

export interface Medication {
  id: string;
  itemId: string;
  item: Item;
  unit: string;
  activeIngredient: string | null;
  /** Tên gốc (INN) — khác `activeIngredient`: "Paracetamol" so với "Panadol". */
  genericName: string | null;
  manufacturer: string | null;
  supplierId: string | null;
  supplier?: Supplier | null;
  costPrice: number;
  minimumStock: number;
  active: boolean;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctor?: DoctorSummary;
  branchId: string;
  branch?: Branch;
  petId: string;
  pet?: Pet;
  serviceId: string;
  service?: Service;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  priorityColor: PriorityColor | null;
  photoUrls: string[];
  commonSymptoms: CommonSymptom[];
  otherSymptoms: string | null;
  address: string | null;
  notes: string | null;
  parentAppointmentId: string | null;
  // Lưu vết kết thúc bất thường (FR-05-04) - dùng cho cả CANCELLED lẫn NO_SHOW.
  cancelledByUserId: string | null;
  cancelledBy?: { id: string; fullName: string } | null;
  cancelledAt: string | null;
  cancelReason: string | null;
}

export interface SlotInfo {
  start: string;
  end: string;
  startAt: string;
  endAt: string;
  status: SlotStatus;
  appointmentId?: string;
  appointmentDetail?: {
    id: string;
    petName: string;
    ownerName: string;
    ownerPhone: string;
    commonSymptoms: CommonSymptom[];
    otherSymptoms: string | null;
    priorityColor: PriorityColor | null;
    status: AppointmentStatus;
  };
}

export interface DayAvailability {
  date: string;
  dayOfWeek: number;
  isBranchOpen: boolean;
  slots: SlotInfo[];
}

/** Một ô ngày trong chế độ tháng (FR-05-03) - chỉ số liệu tổng hợp, không có lưới slot. */
export interface MonthDaySummary {
  date: string;
  dayOfWeek: number;
  isBranchOpen: boolean;
  /** Số lịch hẹn còn hiệu lực (chưa bị hủy / khách không đến). */
  appointmentCount: number;
  closedCount: number;
  topPriorityColor: PriorityColor | null;
}

export interface MonthOverview {
  /** 'yyyy-MM'. */
  month: string;
  days: MonthDaySummary[];
}

export interface PreScreeningResult {
  id: string;
  appointmentId: string;
  symptomText: string;
  aiSuspectedDiseaseGroups: { id: string; diseaseName: string }[];
  aiPriorityColor: PriorityColor;
  extractedSymptomKeywords: string[];
  nlpConfidence: number | null;
  cvConfidence: number | null;
  overallConfidence: number;
}

export interface Examination {
  id: string;
  appointmentId: string;
  doctorId: string;
  diseaseGroups: string[];
  diagnosisText: string | null;
  notes: string | null;
  temperatureCelsius: number | null;
  weightKg: number | null;
  heartRateBpm: number | null;
  respiratoryRateBpm: number | null;
  attachmentUrls: string[];
  examinedAt: string;
}

/**
 * Hồ sơ bệnh án (SRS FR-07…FR-10) — lớp bọc ngoài của một lần khám.
 * `GET /medical-records/:id` trả đủ mọi khối trong một request.
 */
export interface MedicalRecord {
  id: string;
  appointmentId: string;
  petId: string;
  doctorId: string;
  visitReason: string | null;
  generalCondition: string | null;
  notes: string | null;
  status: MedicalRecordStatus;
  completedAt: string | null;
  createdAt: string;
  appointment?: Appointment;
  pet?: Pet;
  doctor?: DoctorSummary;
  examination?: Examination | null;
  diagnoses?: Diagnosis[];
  treatments?: Treatment[];
  prescriptions?: Prescription[];
  labTestOrders?: LabTestOrder[];
}

/** Một chẩn đoán trong hồ sơ — SRS FR-09. */
export interface Diagnosis {
  id: string;
  medicalRecordId: string;
  diseaseId: string | null;
  disease?: { id: string; diseaseName: string } | null;
  diagnosisText: string;
  severity: DiagnosisSeverity;
  notes: string | null;
  isPrimary: boolean;
  createdAt: string;
}

/** Một phương pháp điều trị — SRS FR-10. `endDate === null` là điều trị đang tiếp diễn. */
export interface Treatment {
  id: string;
  medicalRecordId: string;
  method: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  instruction: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Prescription {
  id: string;
  medicalRecordId: string;
  notes: string | null;
  items: PrescriptionItem[];
}

export interface PrescriptionItem {
  id: string;
  medicationId: string;
  medication?: Medication;
  dosage: string;
  durationDays: number;
  instructions: string | null;
}

export interface LabTestOrder {
  id: string;
  medicalRecordId: string;
  testName: string;
  status: LabTestStatus;
  resultText: string | null;
  resultFileUrls: string[];
}

export interface Invoice {
  id: string;
  appointmentId: string;
  paymentMethod: PaymentMethod | null;
  paid: boolean;
  paidAt: string | null;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  itemId: string;
  item: Item;
  price: number;
  quantity: number;
}

/**
 * Khách hàng (User role PET_OWNER) nhìn từ quầy lễ tân - `GET /customers`.
 * `petCount`/`lastVisitAt` do backend tính sẵn, không phải đếm ở client.
 */
export interface Customer {
  id: string;
  /** Mã nghiệp vụ `KH000123` (FR-03-01) - do backend sinh. */
  customerCode: string | null;
  phone: string;
  fullName: string;
  email: string | null;
  dateOfBirth: string | null;
  address: string | null;
  note: string | null;
  active: boolean;
  createdAt: string;
  petCount: number;
  lastVisitAt: string | null;
}

/** `GET /customers/:id` - thêm các số liệu tổng hợp của màn hình chi tiết. */
export interface CustomerDetail extends Customer {
  appointmentCount: number;
  completedAppointmentCount: number;
  invoiceCount: number;
  totalPaid: number;
  totalUnpaid: number;
}

/** Một dòng tab "Lịch hẹn" của hồ sơ khách - `GET /customers/:id/appointments`. */
export interface CustomerAppointment {
  appointmentId: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  priorityColor: PriorityColor | null;
  petId: string;
  petName: string;
  doctorName: string | null;
  branchName: string | null;
  serviceName: string | null;
}

/** Chẩn đoán rút gọn nhúng trong một dòng bệnh sử. */
export interface MedicalHistoryDiagnosis {
  id: string;
  diagnosisText: string;
  severity: DiagnosisSeverity;
  isPrimary: boolean;
  diseaseName: string | null;
}

/** Một dòng tab "Lịch sử khám" của hồ sơ khách - `GET /customers/:id/medical-history`. */
export interface CustomerMedicalHistory {
  medicalRecordId: string;
  appointmentId: string;
  status: MedicalRecordStatus;
  examinedAt: string;
  petId: string;
  petName: string;
  doctorName: string | null;
  branchName: string | null;
  visitReason: string | null;
  diagnoses: MedicalHistoryDiagnosis[];
}

/** Một dòng lịch sử giao dịch - `GET /customers/:id/transactions`. */
export interface CustomerTransaction {
  invoiceId: string;
  appointmentId: string;
  visitedAt: string;
  petId: string;
  petName: string;
  doctorName: string | null;
  branchName: string | null;
  serviceName: string | null;
  appointmentStatus: AppointmentStatus;
  paid: boolean;
  paidAt: string | null;
  paymentMethod: PaymentMethod | null;
  totalAmount: number;
}

// ---------------------------------------------------------------------------------
// Các khối của trang hồ sơ thú cưng (FR-04-03 / mục 12.4 SRS)
// ---------------------------------------------------------------------------------

/** `GET /pets/:id/appointments` */
export interface PetAppointment {
  appointmentId: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  priorityColor: PriorityColor | null;
  doctorName: string | null;
  branchName: string | null;
  serviceName: string | null;
}

/** `GET /pets/:id/medical-history` */
export interface PetMedicalHistory {
  medicalRecordId: string;
  appointmentId: string;
  status: MedicalRecordStatus;
  examinedAt: string;
  doctorName: string | null;
  branchName: string | null;
  visitReason: string | null;
  diagnoses: MedicalHistoryDiagnosis[];
  notes: string | null;
  temperatureCelsius: number | null;
  weightKg: number | null;
}

/** `GET /pets/:id/prescriptions` */
export interface PetPrescription {
  prescriptionId: string;
  medicalRecordId: string;
  examinedAt: string;
  doctorName: string | null;
  notes: string | null;
  items: {
    id: string;
    medicationName: string;
    unit: string;
    dosage: string;
    durationDays: number;
    instructions: string | null;
  }[];
}

/** `GET /pets/:id/lab-tests` */
export interface PetLabTest {
  labTestId: string;
  medicalRecordId: string;
  orderedAt: string;
  testName: string;
  status: LabTestStatus;
  resultText: string | null;
  resultFileUrls: string[];
}

/** `GET /pets/:id/invoices` */
export interface PetInvoice {
  invoiceId: string;
  appointmentId: string;
  visitedAt: string;
  paid: boolean;
  paidAt: string | null;
  paymentMethod: PaymentMethod | null;
  totalAmount: number;
}

/** Một lượt chờ tại quầy lễ tân - `GET /queue`. */
export interface QueueEntry {
  id: string;
  branchId: string;
  branch?: Branch;
  petId: string;
  pet?: Pet;
  appointmentId: string | null;
  appointment?: Appointment | null;
  doctorId: string | null;
  doctor?: { id: string; fullName: string } | null;
  serviceId: string;
  service?: Service;
  queueDate: string;
  ticketNumber: number;
  status: QueueStatus;
  source: QueueSource;
  priorityColor: PriorityColor | null;
  commonSymptoms: CommonSymptom[];
  reason: string | null;
  note: string | null;
  checkedInAt: string;
  calledAt: string | null;
  finishedAt: string | null;
}

export interface StaffUser {
  id: string;
  phone: string;
  email: string | null;
  fullName: string;
  role: Role;
  active: boolean;
  branchId: string | null;
}
