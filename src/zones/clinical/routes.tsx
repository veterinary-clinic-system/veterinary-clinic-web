import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { RequireAuth } from '@/routes/RequireAuth';
import { Role } from '@/types/enums';

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
    <Route key="calendar" path="/staff/calendar" element={<StaffCalendarPage />} />,
    <Route key="queue" path="/staff/queue" element={<QueuePage />} />,
    <Route key="customers" path="/staff/customers" element={<CustomersPage />} />,
    <Route key="customer" path="/staff/customers/:id" element={<CustomerDetailPage />} />,
    <Route key="patients" path="/staff/patients" element={<PatientsSearchPage />} />,
    <Route key="patient" path="/staff/patients/:id" element={<StaffPetProfilePage />} />,
    <Route key="appointments" path="/staff/appointments" element={<AppointmentsListPage />} />,
    <Route key="appointment" path="/staff/appointments/:id" element={<AppointmentDetailPage />} />,
    <Route key="exam" path="/staff/appointments/:id/exam" element={<ExamEntryPage />} />,

    /*
      Xét nghiệm và nhắc lịch tiêm (P9) mở cho các vai trò phòng khám: ma trận
      `role_permissions` cho ADMIN/MANAGER/DOCTOR/RECEPTIONIST cả LABORATORY_VIEW lẫn
      VACCINATION_VIEW. Backend vẫn là hàng rào thật; chặn ở đây chỉ để không đưa người
      dùng tới một trang họ chắc chắn nhận 403.
    */
    <Route
      key="p9"
      element={<RequireAuth allow={[Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.RECEPTIONIST]} />}
    >
      <Route path="/staff/laboratory" element={<LaboratoryQueuePage />} />
      <Route path="/staff/vaccinations/due" element={<VaccinationDuePage />} />
    </Route>,
  ];
}
