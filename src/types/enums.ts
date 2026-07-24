/**
 * Mirrors veterinary-clinic-backend/src/common/enums/*.ts exactly (string values are
 * the wire format sent/received over the REST API). Keep in sync by hand - there's no
 * shared package between the two projects.
 */

export enum Role {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  RECEPTIONIST = 'RECEPTIONIST',
  PET_OWNER = 'PET_OWNER',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  HERMAPHRODITE = 'HERMAPHRODITE',
  ASEXUAL = 'ASEXUAL',
}

export enum PriorityColor {
  RED = 'RED',
  ORANGE = 'ORANGE',
  YELLOW = 'YELLOW',
  GREEN = 'GREEN',
  BLUE = 'BLUE',
}

export const PRIORITY_COLOR_LABEL_VI: Record<PriorityColor, string> = {
  [PriorityColor.RED]: 'Đỏ - Cấp cứu',
  [PriorityColor.ORANGE]: 'Cam - Khẩn cấp',
  [PriorityColor.YELLOW]: 'Vàng - Cần theo dõi',
  [PriorityColor.GREEN]: 'Xanh lá - Nhẹ',
  [PriorityColor.BLUE]: 'Xanh dương - Định kỳ',
};

export enum CommonSymptom {
  SKIN_ALLERGY = 'SKIN_ALLERGY',
  EAR_INFECTION = 'EAR_INFECTION',
  VOMITING = 'VOMITING',
  DIARRHEA = 'DIARRHEA',
  HEMATURIA = 'HEMATURIA',
  LOSS_OF_APPETITE = 'LOSS_OF_APPETITE',
  WEIGHT_LOSS = 'WEIGHT_LOSS',
  HYPERACTIVITY = 'HYPERACTIVITY',
}

export const COMMON_SYMPTOM_LABEL_VI: Record<CommonSymptom, string> = {
  [CommonSymptom.SKIN_ALLERGY]: 'Dị ứng da',
  [CommonSymptom.EAR_INFECTION]: 'Viêm tai',
  [CommonSymptom.VOMITING]: 'Nôn mửa',
  [CommonSymptom.DIARRHEA]: 'Tiêu chảy',
  [CommonSymptom.HEMATURIA]: 'Tiểu ra máu',
  [CommonSymptom.LOSS_OF_APPETITE]: 'Chán ăn',
  [CommonSymptom.WEIGHT_LOSS]: 'Sụt cân',
  [CommonSymptom.HYPERACTIVITY]: 'Tăng động',
};

export enum PaymentMethod {
  CASH = 'CASH',
  E_WALLET = 'E_WALLET',
  CREDIT_CARD = 'CREDIT_CARD',
}

export enum Specialization {
  GENERAL_PRACTICE = 'GENERAL_PRACTICE',
  INTERNAL_MEDICINE = 'INTERNAL_MEDICINE',
  SURGERY = 'SURGERY',
  THERIOGENOLOGY = 'THERIOGENOLOGY',
  DERMATOLOGY = 'DERMATOLOGY',
  DENTISTRY = 'DENTISTRY',
  DIAGNOSTIC_IMAGING = 'DIAGNOSTIC_IMAGING',
  NUTRITION = 'NUTRITION',
  ANESTHESIOLOGY = 'ANESTHESIOLOGY',
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum ItemType {
  SERVICE = 'SERVICE',
  MEDICATION = 'MEDICATION',
  LAB_TEST = 'LAB_TEST',
  OTHER = 'OTHER',
}

export enum LabTestStatus {
  ORDERED = 'ORDERED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum SlotStatus {
  FREE = 'FREE',
  BOOKED = 'BOOKED',
  BREAK = 'BREAK',
  OFF_SHIFT = 'OFF_SHIFT',
}
