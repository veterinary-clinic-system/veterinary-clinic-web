import {
  AppointmentStatus,
  CartStatus,
  CommonSymptom,
  DiagnosisSeverity,
  Gender,
  InventoryTransactionType,
  InvoiceSource,
  InvoiceStatus,
  MedicationRoute,
  ItemType,
  LabResultFlag,
  LabTestStatus,
  MedicalRecordStatus,
  PaymentMethod,
  PaymentStatus,
  PrescriptionStatus,
  PriorityColor,
  PurchaseOrderStatus,
  QueueSource,
  QueueStatus,
  Role,
  SlotStatus,
  Specialization,
  StockTakeStatus,
  VaccinationDueStatus,
} from './enums';

export * from './enums';

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
  avatarUrl: string;
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
  
  petCode: string;
  name: string;
  breedId: string;
  breed?: Breed & { species?: Species };
  gender: Gender;
  weight: number | null;
  birthDate: string | null;
  microchipId: string | null;
  color: string | null;
  avatarUrl: string;
  notes: string | null;
  allergies: string[];
  chronicConditions: string[];
  ownerId: string;
  owner?: { id: string; fullName: string; phone: string; avatarUrl: string };
}

export interface Item {
  id: string;
  itemName: string;
  imageUrl: string;
  describe: string | null;
  itemType: ItemType;
  unitPrice: number;
  active: boolean;
  
  code: string;
  categoryId: string | null;
  category?: Category | null;
}

export interface Category {
  id: string;
  categoryName: string;
  code: string;
  parentId: string | null;
  itemType: ItemType;
  active: boolean;
  children: Category[];
}

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
    
    petBreedName: string | null;
    petSpeciesName: string | null;
    ownerName: string;
    ownerPhone: string;
    serviceName: string | null;
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

export interface MonthDaySummary {
  date: string;
  dayOfWeek: number;
  isBranchOpen: boolean;
  
  appointmentCount: number;
  closedCount: number;
  topPriorityColor: PriorityColor | null;
}

export interface MonthOverview {
  
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
  
  vaccinations?: Vaccination[];
}

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
  
  status: PrescriptionStatus;
  dispensedByUserId: string | null;
  dispensedAt: string | null;
  createdAt: string;
  items: PrescriptionItem[];
}

export interface PrescriptionItem {
  id: string;
  medicationId: string;
  medication?: Medication;
  
  quantity: number;
  dosage: string;
  frequency: string | null;
  durationDays: number;
  route: MedicationRoute;
  instructions: string | null;
}

export interface PrescriptionItemStock {
  prescriptionItemId: string;
  medicationId: string;
  medicationName: string;
  requested: number;
  
  availableQuantity: number;
  insufficientStock: boolean;
}

export interface PrescriptionView {
  prescription: Prescription;
  branchId: string;
  stockCheck: PrescriptionItemStock[];
  hasInsufficientStock: boolean;
}

export interface LabTestOrder {
  id: string;
  medicalRecordId: string;
  
  createdAt: string;
  testName: string;
  status: LabTestStatus;
  resultText: string | null;
  resultFileUrls: string[];
  
  technicianUserId?: string | null;
  technician?: { id: string; fullName: string } | null;
  
  resultDate?: string | null;
  results?: LaboratoryResult[];
}

export interface LaboratoryResult {
  id: string;
  labTestOrderId: string;
  
  parameter: string;
  value: number;
  unit: string | null;
  referenceMin: number | null;
  referenceMax: number | null;
  flag: LabResultFlag;
  
  flagOverridden: boolean;
  note: string | null;
}

export interface LabTrendPoint {
  labTestOrderId: string;
  testName: string;
  
  measuredAt: string;
  value: number;
  unit: string | null;
  referenceMin: number | null;
  referenceMax: number | null;
  flag: LabResultFlag;
}

export interface LabTrendSeries {
  parameter: string;
  unit: string | null;
  points: LabTrendPoint[];
}

export interface LabQueueRow {
  labTestOrderId: string;
  testName: string;
  status: LabTestStatus;
  orderedAt: string;
  medicalRecordId: string;
  petId: string;
  petCode: string;
  petName: string;
  doctorName: string | null;
  branchId: string;
  resultCount: number;
}

export interface Vaccine {
  id: string;
  itemId: string;
  item: Item;
  diseasePrevented: string;
  
  speciesApplicable?: Species[];
  doseCount: number;
  intervalDays: number | null;
  boosterIntervalDays: number | null;
  manufacturer: string | null;
  supplierId: string | null;
  supplier?: Supplier | null;
  costPrice: number;
  minimumStock: number;
  active: boolean;
}

export interface Vaccination {
  id: string;
  petId: string;
  vaccineId: string;
  vaccine?: Vaccine;
  
  medicalRecordId: string | null;
  doctorId: string;
  doctor?: DoctorSummary;
  branchId: string;
  vaccinatedAt: string;
  doseNumber: number;
  batchNo: string | null;
  expiryDate: string | null;
  notes: string | null;
  nextDueDate: string | null;
}

export interface VaccinationRecordView {
  vaccination: Vaccination;
  dueStatus: VaccinationDueStatus;
}

export interface VaccinationDueRow {
  vaccinationId: string;
  petId: string;
  petCode: string;
  petName: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  vaccineId: string;
  vaccineName: string;
  diseasePrevented: string;
  doseNumber: number;
  vaccinatedAt: string;
  nextDueDate: string;
  
  daysUntilDue: number;
  branchId: string;
}

export interface Invoice {
  id: string;
  
  invoiceCode: string;
  source: InvoiceSource;
  
  appointmentId: string | null;
  
  customerId: string | null;
  customer?: { id: string; fullName: string; phone: string } | null;
  branchId: string;
  branch?: Branch;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  
  totalAmount: number;
  
  status: InvoiceStatus;
  
  paymentMethod: PaymentMethod | null;
  paid: boolean;
  paidAt: string | null;
  items: InvoiceItem[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string | null;
  referenceCode: string | null;
  receivedByUserId: string | null;
  note: string | null;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  itemId: string;
  item: Item;
  price: number;
  quantity: number;
}

export interface PosProduct {
  itemId: string;
  itemName: string;
  imageUrl: string;
  code: string;
  itemType: ItemType;
  unitPrice: number;
  sku: string | null;
  unit: string | null;
  availableQuantity: number;
}

export interface CartItem {
  id: string;
  cartId: string;
  itemId: string;
  item: Item;
  quantity: number;
  
  unitPrice: number;
}

export interface Cart {
  id: string;
  branchId: string;
  branch?: Branch;
  customerId: string | null;
  customer?: { id: string; fullName: string; phone: string } | null;
  staffUserId: string | null;
  status: CartStatus;
  discountAmount: number;
  discountByUserId: string | null;
  discountNote: string | null;
  invoiceId: string | null;
  note: string | null;
  items?: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItemStock {
  cartItemId: string;
  itemId: string;
  itemName: string;
  requested: number;
  availableQuantity: number;
  insufficientStock: boolean;
}

export interface CartView {
  cart: Cart;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  stockCheck: CartItemStock[];
  hasInsufficientStock: boolean;
}

export interface Customer {
  id: string;
  
  customerCode: string | null;
  phone: string;
  fullName: string;
  avatarUrl: string;
  email: string | null;
  dateOfBirth: string | null;
  address: string | null;
  note: string | null;
  active: boolean;
  createdAt: string;
  petCount: number;
  lastVisitAt: string | null;
}

export interface CustomerDetail extends Customer {
  appointmentCount: number;
  completedAppointmentCount: number;
  
  invoiceCount: number;
  
  purchaseCount: number;
  
  totalPaid: number;
  totalUnpaid: number;
}

export interface CustomerPurchase {
  invoiceId: string;
  invoiceCode: string;
  purchasedAt: string;
  branchName: string | null;
  status: InvoiceStatus;
  
  itemSummary: string;
  itemCount: number;
  totalAmount: number;
  paidAt: string | null;
  paymentMethod: PaymentMethod | null;
}

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

export interface MedicalHistoryDiagnosis {
  id: string;
  diagnosisText: string;
  severity: DiagnosisSeverity;
  isPrimary: boolean;
  diseaseName: string | null;
}

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

export interface PetLabTest {
  labTestId: string;
  medicalRecordId: string;
  orderedAt: string;
  testName: string;
  status: LabTestStatus;
  resultText: string | null;
  resultFileUrls: string[];
}

export interface PetInvoice {
  invoiceId: string;
  appointmentId: string;
  visitedAt: string;
  paid: boolean;
  paidAt: string | null;
  paymentMethod: PaymentMethod | null;
  totalAmount: number;
}

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
  
  photoUrls: string[];
  checkedInAt: string;
  calledAt: string | null;
  finishedAt: string | null;
}

export interface StaffUser {
  id: string;
  phone: string;
  email: string | null;
  fullName: string;
  avatarUrl: string;
  role: Role;
  active: boolean;
  branchId: string | null;
}

export interface InventoryItem {
  id: string;
  itemId: string;
  item?: Item;
  branchId: string;
  branch?: Branch;
  inventoryQuantity: number;
  active: boolean;
}

export interface InventoryBatch {
  id: string;
  inventoryItemId: string;
  batchNo: string;
  expiryDate: string | null;
  quantity: number;
  costPrice: number;
  receivedAt: string;
  supplierId: string | null;
  goodsReceiptId: string | null;
}

export interface InventoryTransaction {
  id: string;
  inventoryItemId: string;
  inventoryItem?: InventoryItem;
  batchId: string | null;
  batch?: InventoryBatch | null;
  branchId: string;
  type: InventoryTransactionType;
  quantityChange: number;
  quantityAfter: number;
  referenceType: string;
  referenceId: string | null;
  performedByUserId: string | null;
  note: string | null;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  itemId: string;
  item: Item;
  quantity: number;
  unitCost: number;
  receivedQuantity: number;
}

export interface PurchaseOrder {
  id: string;
  poCode: string;
  supplierId: string;
  supplier?: Supplier;
  branchId: string;
  branch?: Branch;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDate: string | null;
  totalAmount: number;
  createdByUserId: string | null;
  note: string | null;
  items?: PurchaseOrderItem[];
}

export interface GoodsReceiptItem {
  id: string;
  goodsReceiptId: string;
  purchaseOrderItemId: string | null;
  itemId: string;
  item: Item;
  quantity: number;
  unitCost: number;
  batchNo: string;
  expiryDate: string | null;
  batchId: string | null;
}

export interface GoodsReceipt {
  id: string;
  receiptCode: string;
  purchaseOrderId: string | null;
  purchaseOrder?: PurchaseOrder | null;
  supplierId: string;
  supplier?: Supplier;
  branchId: string;
  branch?: Branch;
  receivedDate: string;
  totalAmount: number;
  receivedByUserId: string | null;
  note: string | null;
  items?: GoodsReceiptItem[];
}

export interface StockTakeItem {
  id: string;
  stockTakeId: string;
  inventoryItemId: string;
  itemId: string;
  item: Item;
  
  systemQuantity: number;
  
  countedQuantity: number | null;
  note: string | null;
}

export interface StockTake {
  id: string;
  stockTakeCode: string;
  branchId: string;
  branch?: Branch;
  status: StockTakeStatus;
  takenDate: string;
  createdByUserId: string | null;
  confirmedByUserId: string | null;
  confirmedAt: string | null;
  note: string | null;
  items?: StockTakeItem[];
}

export interface InventoryAlertRow {
  inventoryItemId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  branchId: string;
  branchName: string;
  quantity: number;
  minimumStock: number;
  batchId?: string;
  batchNo?: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
}

export interface InventoryAlerts {
  lowStock: InventoryAlertRow[];
  outOfStock: InventoryAlertRow[];
  expiringSoon: InventoryAlertRow[];
  expired: InventoryAlertRow[];
}
