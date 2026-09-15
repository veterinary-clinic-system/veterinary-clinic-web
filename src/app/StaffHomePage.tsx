import { lazy } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CLINICAL_HOME_ROLES } from '@/layouts/staff/nav-model';

const ClinicalDashboardPage = lazy(() =>
  import('@/zones/clinical/pages/ClinicalDashboardPage').then((m) => ({
    default: m.ClinicalDashboardPage,
  })),
);

const OperationsDashboardPage = lazy(() =>
  import('@/zones/admin/pages/StaffDashboardPage').then((m) => ({
    default: m.StaffDashboardPage,
  })),
);

export function StaffHomePage() {
  const { user } = useAuth();

  if (user && CLINICAL_HOME_ROLES.includes(user.role)) {
    return <ClinicalDashboardPage />;
  }

  return <OperationsDashboardPage />;
}
