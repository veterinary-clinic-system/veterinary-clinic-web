import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { RequireAuth } from '@/routes/RequireAuth';
import { RouteFallback } from '@/routes/RouteFallback';
import { StaffConsoleOnly } from '@/routes/StaffConsoleOnly';
import { STAFF_ROLES } from '@/types/enums';
import { PublicLayout } from '@/layouts/PublicLayout';
import { StaffLayout } from '@/layouts/StaffLayout';
import { publicRoutes } from '@/zones/public/routes';
import { ownerRoutes } from '@/zones/owner/routes';
import { clinicalRoutes } from '@/zones/clinical/routes';
import { adminRoutes } from '@/zones/admin/routes';

const NotFoundPage = lazy(() =>
  import('./NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

const StaffHomePage = lazy(() =>
  import('./StaffHomePage').then((m) => ({ default: m.StaffHomePage })),
);

export function AppRoutes() {
  return (
    
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {}
        <Route element={<StaffConsoleOnly />}>
          <Route element={<PublicLayout />}>
            {publicRoutes()}
            {ownerRoutes()}
          </Route>
        </Route>

        <Route element={<RequireAuth allow={STAFF_ROLES} />}>
          <Route element={<StaffLayout />}>
            <Route path="/staff" element={<StaffHomePage />} />
            {clinicalRoutes()}
            {adminRoutes()}
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
