import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { RequireAuth } from '@/routes/RequireAuth';
import { CLINIC_ROLES, CUSTOMER_ROLES } from '@/types/permission-groups';

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
    
    <Route key="clinical" element={<RequireAuth allow={CLINIC_ROLES} />}>
      <Route path="/staff/calendar" element={<StaffCalendarPage />} />
      <Route path="/staff/queue" element={<QueuePage />} />
      <Route path="/staff/patients" element={<PatientsSearchPage />} />
      <Route path="/staff/patients/:id" element={<StaffPetProfilePage />} />
      <Route path="/staff/appointments" element={<AppointmentsListPage />} />
      <Route path="/staff/appointments/:id" element={<AppointmentDetailPage />} />
      <Route path="/staff/appointments/:id/exam" element={<ExamEntryPage />} />
      {}
      <Route path="/staff/laboratory" element={<LaboratoryQueuePage />} />
      <Route path="/staff/vaccinations/due" element={<VaccinationDuePage />} />
    </Route>,

    <Route key="customers" element={<RequireAuth allow={CUSTOMER_ROLES} />}>
      <Route path="/staff/customers" element={<CustomersPage />} />
      <Route path="/staff/customers/:id" element={<CustomerDetailPage />} />
    </Route>,
  ];
}
