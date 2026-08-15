import {
  AppointmentStatus,
  DiagnosisSeverity,
  Gender,
  InvoiceSource,
  InvoiceStatus,
  LabResultFlag,
  LabTestStatus,
  MedicalRecordStatus,
  PaymentMethod,
  PaymentStatus,
  Role,
  SlotStatus,
  Specialization,
  VaccinationDueStatus,
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
  [PaymentMethod.BANK_TRANSFER]: 'Chuyển khoản',
  [PaymentMethod.QR]: 'Quét mã QR',
};

export const INVOICE_SOURCE_LABEL_VI: Record<InvoiceSource, string> = {
  [InvoiceSource.CLINIC]: 'Khám bệnh',
  [InvoiceSource.POS]: 'Bán lẻ',
};

export const INVOICE_STATUS_LABEL_VI: Record<InvoiceStatus, string> = {
  [InvoiceStatus.PENDING]: 'Chưa thanh toán',
  [InvoiceStatus.PARTIALLY_PAID]: 'Trả một phần',
  [InvoiceStatus.PAID]: 'Đã thanh toán',
  [InvoiceStatus.CANCELLED]: 'Đã hủy',
  [InvoiceStatus.REFUNDED]: 'Đã hoàn tiền',
};

/** Màu badge của từng trạng thái hoá đơn — dùng chung cho danh sách và trang chi tiết. */
export const INVOICE_STATUS_VARIANT: Record<
  InvoiceStatus,
  'default' | 'success' | 'warning' | 'destructive' | 'outline'
> = {
  [InvoiceStatus.PENDING]: 'warning',
  [InvoiceStatus.PARTIALLY_PAID]: 'warning',
  [InvoiceStatus.PAID]: 'success',
  [InvoiceStatus.CANCELLED]: 'outline',
  [InvoiceStatus.REFUNDED]: 'destructive',
};

export const PAYMENT_STATUS_LABEL_VI: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Chờ xác nhận',
  [PaymentStatus.SUCCESS]: 'Thành công',
  [PaymentStatus.FAILED]: 'Thất bại',
  [PaymentStatus.REFUNDED]: 'Hoàn tiền',
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
  [SlotStatus.PAST]: 'Đã qua',
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

/**
 * Màu ô của một chỉ số xét nghiệm theo cờ bất thường — acceptance P9-T6.
 *
 * `NORMAL` cố ý **không** tô gì: tô cả bảng thì không còn gì nổi bật, mà cái bác sĩ cần
 * là liếc một cái thấy ngay ô nào lệch. Dùng lại đúng bộ token `triage-*` đã có nên
 * bảng chỉ số và thẻ phân loại ưu tiên nói cùng một ngôn ngữ màu.
 */
export function labResultFlagClasses(flag: LabResultFlag): string {
  switch (flag) {
    case LabResultFlag.CRITICAL:
      return 'bg-triage-red/15 text-triage-red font-semibold';
    case LabResultFlag.HIGH:
      return 'bg-triage-orange/10 text-triage-orange font-medium';
    case LabResultFlag.LOW:
      return 'bg-triage-blue/10 text-triage-blue font-medium';
    case LabResultFlag.NORMAL:
      return '';
  }
}

/**
 * Màu dòng sổ tiêm chủng theo lịch nhắc — acceptance P9-T3: "mũi quá hạn nhắc tô đỏ,
 * sắp đến hạn tô vàng".
 */
export function vaccinationDueClasses(status: VaccinationDueStatus): string {
  switch (status) {
    case 'OVERDUE':
      return 'bg-triage-red/10 text-triage-red border border-triage-red/30';
    case 'DUE_SOON':
      return 'bg-triage-yellow/10 text-triage-yellow border border-triage-yellow/30';
    case 'SCHEDULED':
      return 'bg-triage-green/10 text-triage-green border border-triage-green/30';
    case 'NONE':
      return 'bg-surface-muted text-muted border border-border';
  }
}

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

/**
 * Nền ĐẶC của thang màu ưu tiên — dùng cho dải màu mảnh bên trái ô lịch, nơi phải
 * nhìn ra màu từ xa. `triageColorClasses` ở trên là nền nhạt + chữ, dành cho nhãn.
 */
export function triagePriorityBar(color: string | null | undefined): string {
  switch (color) {
    case 'RED':
      return 'bg-triage-red';
    case 'ORANGE':
      return 'bg-triage-orange';
    case 'YELLOW':
      return 'bg-triage-yellow';
    case 'GREEN':
      return 'bg-triage-green';
    case 'BLUE':
      return 'bg-triage-blue';
    default:
      return 'bg-border';
  }
}
