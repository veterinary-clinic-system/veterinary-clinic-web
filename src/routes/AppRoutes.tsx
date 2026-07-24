import { Route, Routes } from 'react-router-dom';
import { RequireAuth } from './RequireAuth';
import { Role } from '@/types/enums';
import { PublicLayout } from '@/layouts/PublicLayout';
import { StaffLayout } from '@/layouts/StaffLayout';
import { HomePage } from '@/pages/public/HomePage';
import { BranchesPage } from '@/pages/public/BranchesPage';
import { DoctorsPage } from '@/pages/public/DoctorsPage';
import { BookingPage } from '@/pages/public/BookingPage';
import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { ChatPage } from '@/pages/public/ChatPage';
import { MyPetsPage } from '@/pages/owner/MyPetsPage';
import { PetProfilePage } from '@/pages/owner/PetProfilePage';
import { MyAppointmentsPage } from '@/pages/owner/MyAppointmentsPage';
import { StaffDashboardPage } from '@/pages/staff/StaffDashboardPage';
import { StaffCalendarPage } from '@/pages/staff/StaffCalendarPage';
import { PatientsSearchPage } from '@/pages/staff/PatientsSearchPage';
import { StaffPetProfilePage } from '@/pages/staff/StaffPetProfilePage';
import { AppointmentsListPage } from '@/pages/staff/AppointmentsListPage';
import { AppointmentDetailPage } from '@/pages/staff/AppointmentDetailPage';
import { ExamEntryPage } from '@/pages/staff/ExamEntryPage';
import { BillingListPage } from '@/pages/staff/BillingListPage';
import { InvoiceDetailPage } from '@/pages/staff/InvoiceDetailPage';
import { CatalogAdminPage } from '@/pages/staff/CatalogAdminPage';
import { BranchesAdminPage } from '@/pages/staff/BranchesAdminPage';
import { UsersAdminPage } from '@/pages/staff/UsersAdminPage';
import { ReportsPage } from '@/pages/staff/ReportsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/branches" element={<BranchesPage />} />
        <Route path="/doctors" element={<DoctorsPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<RequireAuth allow={[Role.PET_OWNER]} />}>
          <Route path="/my/pets" element={<MyPetsPage />} />
          <Route path="/my/pets/:id" element={<PetProfilePage />} />
          <Route path="/my/appointments" element={<MyAppointmentsPage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth allow={[Role.DOCTOR, Role.RECEPTIONIST, Role.ADMIN]} />}>
        <Route element={<StaffLayout />}>
          <Route path="/staff" element={<StaffDashboardPage />} />
          <Route path="/staff/calendar" element={<StaffCalendarPage />} />
          <Route path="/staff/patients" element={<PatientsSearchPage />} />
          <Route path="/staff/patients/:id" element={<StaffPetProfilePage />} />
          <Route path="/staff/appointments" element={<AppointmentsListPage />} />
          <Route path="/staff/appointments/:id" element={<AppointmentDetailPage />} />
          <Route path="/staff/appointments/:id/exam" element={<ExamEntryPage />} />
          <Route path="/staff/billing" element={<BillingListPage />} />
          <Route path="/staff/billing/:id" element={<InvoiceDetailPage />} />

          <Route element={<RequireAuth allow={[Role.ADMIN]} />}>
            <Route path="/staff/catalog" element={<CatalogAdminPage />} />
            <Route path="/staff/branches" element={<BranchesAdminPage />} />
            <Route path="/staff/users" element={<UsersAdminPage />} />
          </Route>
          <Route element={<RequireAuth allow={[Role.ADMIN, Role.RECEPTIONIST]} />}>
            <Route path="/staff/reports" element={<ReportsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
