import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { RequireAuth } from '@/routes/RequireAuth';
import { CLINIC_ROLES, CUSTOMER_ROLES } from '@/types/permission-groups';

/**
 * ZONE LÂM SÀNG - việc hằng ngày của BÁC SĨ và LỄ TÂN: lịch làm việc, hàng chờ, lịch
 * hẹn, phiếu khám, hồ sơ khách hàng và thú cưng, xét nghiệm, nhắc lịch tiêm.
 *
 * Tách khỏi zone `admin` theo NGƯỜI DÙNG chứ không theo quyền: một bác sĩ mở máy lên
 * là ở trong bốn năm màn hình này cả ngày và gần như không bao giờ chạm tới kho hay
 * bảng phân quyền, nên gói JavaScript của họ không có lý do gì phải chứa những thứ đó.
 *
 * URL vẫn nằm dưới `/staff` và vẫn dùng `StaffLayout` - đây là ranh giới code, không
 * phải ranh giới đường dẫn.
 */
const StaffCalendarPage = lazy(() =>
  import('./pages/StaffCalendarPage').then((m) => ({ default: m.StaffCalendarPage })),
);
const QueuePage = lazy(() => import('./pages/QueuePage').then((m) => ({ default: m.QueuePage })));
const CustomersPage = lazy(() =>
  import('./pages/CustomersPage').then((m) => ({ default: m.CustomersPage })),
);
const CustomerDetailPage = lazy(() =>
  import('./pages/CustomerDetailPage').then((m) => ({ default: m.CustomerDetailPage })),
);
const PatientsSearchPage = lazy(() =>
  import('./pages/PatientsSearchPage').then((m) => ({ default: m.PatientsSearchPage })),
);
const StaffPetProfilePage = lazy(() =>
  import('./pages/StaffPetProfilePage').then((m) => ({ default: m.StaffPetProfilePage })),
);
const AppointmentsListPage = lazy(() =>
  import('./pages/AppointmentsListPage').then((m) => ({ default: m.AppointmentsListPage })),
);
const AppointmentDetailPage = lazy(() =>
  import('./pages/AppointmentDetailPage').then((m) => ({ default: m.AppointmentDetailPage })),
);
const ExamEntryPage = lazy(() =>
  import('./pages/ExamEntryPage').then((m) => ({ default: m.ExamEntryPage })),
);
const LaboratoryQueuePage = lazy(() =>
  import('./pages/LaboratoryQueuePage').then((m) => ({ default: m.LaboratoryQueuePage })),
);
const VaccinationDuePage = lazy(() =>
  import('./pages/VaccinationDuePage').then((m) => ({ default: m.VaccinationDuePage })),
);

export function clinicalRoutes() {
  return [
    /*
      Toàn bộ zone nằm sau một chốt vai trò, không chỉ hai màn hình P9.
      Trước đây lịch làm việc, hàng chờ, lịch hẹn, phiếu khám và hồ sơ bệnh nhân không
      có chốt nào: sidebar giấu chúng khỏi dược sĩ và nhân viên quầy, nhưng gõ thẳng
      `/staff/queue` thì vẫn mở ra một trang chỉ để nhận 403 từ mọi lời gọi API bên
      trong. Giấu khỏi điều hướng mà vẫn vào được bằng URL là nửa vời theo đúng nghĩa
      xấu: người dùng thấy một màn hình hỏng thay vì một câu giải thích.

      Danh sách vai trò lấy từ `@/types/permission-groups` - CÙNG danh sách mà sidebar
      dùng, nên không thể lệch nhau nữa.
    */
    <Route key="clinical" element={<RequireAuth allow={CLINIC_ROLES} />}>
      <Route path="/staff/calendar" element={<StaffCalendarPage />} />
      <Route path="/staff/queue" element={<QueuePage />} />
      <Route path="/staff/patients" element={<PatientsSearchPage />} />
      <Route path="/staff/patients/:id" element={<StaffPetProfilePage />} />
      <Route path="/staff/appointments" element={<AppointmentsListPage />} />
      <Route path="/staff/appointments/:id" element={<AppointmentDetailPage />} />
      <Route path="/staff/appointments/:id/exam" element={<ExamEntryPage />} />
      {/*
        Xét nghiệm và nhắc lịch tiêm (P9): ma trận `role_permissions` cho đúng bốn vai
        trò phòng khám cả `LABORATORY_VIEW` lẫn `VACCINATION_VIEW`.
      */}
      <Route path="/staff/laboratory" element={<LaboratoryQueuePage />} />
      <Route path="/staff/vaccinations/due" element={<VaccinationDuePage />} />
    </Route>,

    /*
      Khách hàng mở rộng hơn một bậc: nhân viên quầy cần tra cứu khách để gắn hoá đơn,
      nên `CUSTOMER_ROLES` có thêm STAFF.
    */
    <Route key="customers" element={<RequireAuth allow={CUSTOMER_ROLES} />}>
      <Route path="/staff/customers" element={<CustomersPage />} />
      <Route path="/staff/customers/:id" element={<CustomerDetailPage />} />
    </Route>,
  ];
}
