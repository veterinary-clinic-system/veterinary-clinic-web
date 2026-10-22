import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { RequireAuth } from '@/routes/RequireAuth';
import { Role } from '@/types/enums';
import { OwnerSpace } from './components/OwnerSpace';

const MyPetsPage = lazy(() =>
  import('./pages/MyPetsPage').then((m) => ({ default: m.MyPetsPage })),
);
const PetProfilePage = lazy(() =>
  import('./pages/PetProfilePage').then((m) => ({ default: m.PetProfilePage })),
);
const MyAppointmentsPage = lazy(() =>
  import('./pages/MyAppointmentsPage').then((m) => ({ default: m.MyAppointmentsPage })),
);
const MyMessagesPage = lazy(() =>
  import('./pages/MyMessagesPage').then((m) => ({ default: m.MyMessagesPage })),
);
const MyAppointmentDetailPage = lazy(() =>
  import('./pages/MyAppointmentDetailPage').then((m) => ({ default: m.MyAppointmentDetailPage })),
);
const MyAccountPage = lazy(() =>
  import('./pages/MyAccountPage').then((m) => ({ default: m.MyAccountPage })),
);

export function ownerRoutes() {
  return (
    <Route element={<RequireAuth allow={[Role.PET_OWNER]} />}>
      <Route element={<OwnerSpace />}>
        <Route path="/my/pets" element={<MyPetsPage />} />
        <Route path="/my/pets/:id" element={<PetProfilePage />} />
        <Route path="/my/appointments" element={<MyAppointmentsPage />} />
        <Route path="/my/appointments/:id" element={<MyAppointmentDetailPage />} />
        <Route path="/my/messages" element={<MyMessagesPage />} />
        <Route path="/my/messages/:conversationId" element={<MyMessagesPage />} />
        <Route path="/my/account" element={<MyAccountPage />} />
      </Route>
    </Route>
  );
}
