/**
 * Mirrors veterinary-clinic-backend/src/common/enums/*.ts exactly (string values are
 * the wire format sent/received over the REST API). Keep in sync by hand - there's no
 * shared package between the two projects.
 */

/**
 * 6 vai trò nghiệp vụ của SRS (mục 4) cộng PET_OWNER.
 * `DOCTOR` chính là `Veterinarian` của SRS — không đổi tên, xem ghi chú trong
 * `veterinary-clinic-backend/src/shared/common/enums/role.enum.ts`.
 */
export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  DOCTOR = 'DOCTOR',
  RECEPTIONIST = 'RECEPTIONIST',
  PHARMACIST = 'PHARMACIST',
  STAFF = 'STAFF',
  PET_OWNER = 'PET_OWNER',
}

/** Vai trò làm việc tại cơ sở — bắt buộc phải gán chi nhánh khi tạo tài khoản. */
export const BRANCH_SCOPED_ROLES: Role[] = [
  Role.MANAGER,
  Role.DOCTOR,
  Role.RECEPTIONIST,
  Role.PHARMACIST,
  Role.STAFF,
];

/** Mọi vai trò nhân viên (khác khách hàng). */
export const STAFF_ROLES: Role[] = [Role.ADMIN, ...BRANCH_SCOPED_ROLES];

/** Trạng thái làm việc của nhân viên — SRS FR-22. */
export enum EmployeeStatus {
  PROBATION = 'PROBATION',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  RESIGNED = 'RESIGNED',
}

export const EMPLOYEE_STATUS_LABEL_VI: Record<EmployeeStatus, string> = {
  [EmployeeStatus.PROBATION]: 'Thử việc',
  [EmployeeStatus.ACTIVE]: 'Đang làm việc',
  [EmployeeStatus.SUSPENDED]: 'Tạm đình chỉ',
  [EmployeeStatus.RESIGNED]: 'Đã nghỉ việc',
};

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

export enum QueueStatus {
  WAITING = 'WAITING',
  ASSIGNED = 'ASSIGNED',
  IN_ROOM = 'IN_ROOM',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export const QUEUE_STATUS_LABEL_VI: Record<QueueStatus, string> = {
  [QueueStatus.WAITING]: 'Chờ phân bác sĩ',
  [QueueStatus.ASSIGNED]: 'Đã gán bác sĩ',
  [QueueStatus.IN_ROOM]: 'Đang trong phòng khám',
  [QueueStatus.DONE]: 'Đã khám xong',
  [QueueStatus.CANCELLED]: 'Đã hủy lượt',
};

export enum QueueSource {
  APPOINTMENT = 'APPOINTMENT',
  WALK_IN = 'WALK_IN',
}

export const QUEUE_SOURCE_LABEL_VI: Record<QueueSource, string> = {
  [QueueSource.APPOINTMENT]: 'Có đặt lịch',
  [QueueSource.WALK_IN]: 'Khách vãng lai',
};

export enum SlotStatus {
  FREE = 'FREE',
  BOOKED = 'BOOKED',
  BREAK = 'BREAK',
  OFF_SHIFT = 'OFF_SHIFT',
}
