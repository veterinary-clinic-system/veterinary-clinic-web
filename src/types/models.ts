import {
  AppointmentStatus,
  CommonSymptom,
  Gender,
  ItemType,
  LabTestStatus,
  PaymentMethod,
  PriorityColor,
  Role,
  SlotStatus,
  Specialization,
} from './enums';

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
  name: string;
  breedId: string;
  breed?: Breed & { species?: Species };
  gender: Gender;
  weight: number | null;
  birthDate: string | null;
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

export interface Prescription {
  id: string;
  examinationId: string;
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
  examinationId: string;
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

export interface StaffUser {
  id: string;
  phone: string;
  email: string | null;
  fullName: string;
  role: Role;
  active: boolean;
  branchId: string | null;
}
