import {
  AppointmentStatus,
  DiagnosisSeverity,
  Gender,
  LabTestStatus,
  MedicalRecordStatus,
  PaymentMethod,
  Role,
  SlotStatus,
  Specialization,
} from '@/types/enums';

/**
 * Vietnamese-language labels for enums that don't already have a *_LABEL_VI map in
 * src/types/enums.ts (PriorityColor and CommonSymptom already do - reuse those directly).
 */
export const APPOINTMENT_STATUS_LABEL_VI: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'Chờ xác nhận',
  [AppointmentStatus.CONFIRMED]: 'Đã xác nhận',
  [AppointmentStatus.CHECKED_IN]: 'Đã check-in',
  [AppointmentStatus.IN_PROGRESS]: 'Đang khám',
  [AppointmentStatus.COMPLETED]: 'Hoàn tất',
  [AppointmentStatus.CANCELLED]: 'Đã hủy',
  [AppointmentStatus.NO_SHOW]: 'Không đến',
};

export const PAYMENT_METHOD_LABEL_VI: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Tiền mặt',
  [PaymentMethod.E_WALLET]: 'Ví điện tử',
  [PaymentMethod.CREDIT_CARD]: 'Thẻ tín dụng',
};

export const LAB_TEST_STATUS_LABEL_VI: Record<LabTestStatus, string> = {
  [LabTestStatus.ORDERED]: 'Đã chỉ định',
  [LabTestStatus.IN_PROGRESS]: 'Đang thực hiện',
  [LabTestStatus.COMPLETED]: 'Hoàn tất',
};

export const MEDICAL_RECORD_STATUS_LABEL_VI: Record<MedicalRecordStatus, string> = {
  [MedicalRecordStatus.DRAFT]: 'Đang khám',
  [MedicalRecordStatus.COMPLETED]: 'Đã hoàn tất',
};

export const DIAGNOSIS_SEVERITY_LABEL_VI: Record<DiagnosisSeverity, string> = {
  [DiagnosisSeverity.MILD]: 'Nhẹ',
  [DiagnosisSeverity.MODERATE]: 'Trung bình',
  [DiagnosisSeverity.SEVERE]: 'Nặng',
  [DiagnosisSeverity.CRITICAL]: 'Nguy kịch',
};

export const SLOT_STATUS_LABEL_VI: Record<SlotStatus, string> = {
  [SlotStatus.FREE]: 'Còn trống',
  [SlotStatus.BOOKED]: 'Đã đặt',
  [SlotStatus.BREAK]: 'Bác sĩ nghỉ',
  [SlotStatus.OFF_SHIFT]: 'Ngoài giờ làm',
};

export const GENDER_LABEL_VI: Record<Gender, string> = {
  [Gender.MALE]: 'Đực',
  [Gender.FEMALE]: 'Cái',
  [Gender.HERMAPHRODITE]: 'Lưỡng tính',
  [Gender.ASEXUAL]: 'Vô tính',
};

export const ROLE_LABEL_VI: Record<Role, string> = {
  [Role.ADMIN]: 'Quản trị viên',
  [Role.MANAGER]: 'Quản lý',
  [Role.DOCTOR]: 'Bác sĩ thú y',
  [Role.RECEPTIONIST]: 'Lễ tân',
  [Role.PHARMACIST]: 'Dược sĩ / thủ kho',
  [Role.STAFF]: 'Nhân viên bán hàng',
  [Role.PET_OWNER]: 'Chủ thú cưng',
};

export const SPECIALIZATION_LABEL_VI: Record<Specialization, string> = {
  [Specialization.GENERAL_PRACTICE]: 'Đa khoa',
  [Specialization.INTERNAL_MEDICINE]: 'Nội khoa',
  [Specialization.SURGERY]: 'Ngoại khoa',
  [Specialization.THERIOGENOLOGY]: 'Sản khoa',
  [Specialization.DERMATOLOGY]: 'Da liễu',
  [Specialization.DENTISTRY]: 'Nha khoa',
  [Specialization.DIAGNOSTIC_IMAGING]: 'Chẩn đoán hình ảnh',
  [Specialization.NUTRITION]: 'Dinh dưỡng',
  [Specialization.ANESTHESIOLOGY]: 'Gây mê',
};

/** Tailwind classes per triage PriorityColor, using only the fixed `bg-triage-*` tokens. */
export function triageColorClasses(color: string | null | undefined): string {
  switch (color) {
    case 'RED':
      return 'bg-triage-red/10 text-triage-red border border-triage-red/30';
    case 'ORANGE':
      return 'bg-triage-orange/10 text-triage-orange border border-triage-orange/30';
    case 'YELLOW':
      return 'bg-triage-yellow/10 text-triage-yellow border border-triage-yellow/30';
    case 'GREEN':
      return 'bg-triage-green/10 text-triage-green border border-triage-green/30';
    case 'BLUE':
      return 'bg-triage-blue/10 text-triage-blue border border-triage-blue/30';
    default:
      return 'bg-surface-muted text-muted border border-border';
  }
}
