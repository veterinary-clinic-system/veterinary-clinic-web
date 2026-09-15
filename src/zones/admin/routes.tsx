import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { RequireAuth } from '@/routes/RequireAuth';
import {
  COUNTER_ROLES,
  MANAGEMENT_ROLES,
  SYSTEM_ROLES,
  WAREHOUSE_ROLES,
} from '@/types/permission-groups';

const PosPage = lazy(() => import('./pages/PosPage').then((m) => ({ default: m.PosPage })));
const BillingListPage = lazy(() =>
  import('./pages/BillingListPage').then((m) => ({ default: m.BillingListPage })),
);
const InvoiceDetailPage = lazy(() =>
  import('./pages/InvoiceDetailPage').then((m) => ({ default: m.InvoiceDetailPage })),
);
const InventoryPage = lazy(() =>
  import('./pages/InventoryPage').then((m) => ({ default: m.InventoryPage })),
);
const InventoryAlertsPage = lazy(() =>
  import('./pages/InventoryAlertsPage').then((m) => ({ default: m.InventoryAlertsPage })),
);
const CatalogAdminPage = lazy(() =>
  import('./pages/CatalogAdminPage').then((m) => ({ default: m.CatalogAdminPage })),
);
const ReportsPage = lazy(() =>
  import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);
const ProductsPage = lazy(() =>
  import('./pages/ProductsPage').then((m) => ({ default: m.ProductsPage })),
);
const CategoriesPage = lazy(() =>
  import('./pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage })),
);
const SuppliersPage = lazy(() =>
  import('./pages/SuppliersPage').then((m) => ({ default: m.SuppliersPage })),
);
const PurchaseOrdersPage = lazy(() =>
  import('./pages/PurchaseOrdersPage').then((m) => ({ default: m.PurchaseOrdersPage })),
);
const GoodsReceiptPage = lazy(() =>
  import('./pages/GoodsReceiptPage').then((m) => ({ default: m.GoodsReceiptPage })),
);
const StockTakePage = lazy(() =>
  import('./pages/StockTakePage').then((m) => ({ default: m.StockTakePage })),
);
const PharmacyPage = lazy(() =>
  import('./pages/PharmacyPage').then((m) => ({ default: m.PharmacyPage })),
);
const EmployeesPage = lazy(() =>
  import('./pages/EmployeesPage').then((m) => ({ default: m.EmployeesPage })),
);
const BranchesAdminPage = lazy(() =>
  import('./pages/BranchesAdminPage').then((m) => ({ default: m.BranchesAdminPage })),
);
const UsersAdminPage = lazy(() =>
  import('./pages/UsersAdminPage').then((m) => ({ default: m.UsersAdminPage })),
);
const RolePermissionsPage = lazy(() =>
  import('./pages/RolePermissionsPage').then((m) => ({ default: m.RolePermissionsPage })),
);
const AuditLogsPage = lazy(() =>
  import('./pages/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })),
);

export function adminRoutes() {
  return [
    
    <Route key="counter" element={<RequireAuth allow={COUNTER_ROLES} />}>
      <Route path="/staff/pos" element={<PosPage />} />
      {}
      <Route path="/staff/billing" element={<BillingListPage />} />
      <Route path="/staff/billing/:id" element={<InvoiceDetailPage />} />
    </Route>,

    <Route key="inventory" path="/staff/inventory" element={<InventoryPage />} />,
    <Route key="alerts" path="/staff/inventory/alerts" element={<InventoryAlertsPage />} />,

    <Route key="manage" element={<RequireAuth allow={MANAGEMENT_ROLES} />}>
      <Route path="/staff/catalog" element={<CatalogAdminPage />} />
      {}
      <Route path="/staff/reports" element={<ReportsPage />} />
      <Route path="/staff/employees" element={<EmployeesPage />} />
    </Route>,

    <Route key="warehouse" element={<RequireAuth allow={WAREHOUSE_ROLES} />}>
      <Route path="/staff/products" element={<ProductsPage />} />
      <Route path="/staff/categories" element={<CategoriesPage />} />
      <Route path="/staff/suppliers" element={<SuppliersPage />} />
      {}
      <Route path="/staff/purchase-orders" element={<PurchaseOrdersPage />} />
      <Route path="/staff/goods-receipts" element={<GoodsReceiptPage />} />
      <Route path="/staff/stock-takes" element={<StockTakePage />} />
      {}
      <Route path="/staff/pharmacy" element={<PharmacyPage />} />
    </Route>,

    <Route key="admin-only" element={<RequireAuth allow={SYSTEM_ROLES} />}>
      <Route path="/staff/branches" element={<BranchesAdminPage />} />
      <Route path="/staff/users" element={<UsersAdminPage />} />
      {}
      <Route path="/staff/permissions" element={<RolePermissionsPage />} />
      {}
      <Route path="/staff/audit-logs" element={<AuditLogsPage />} />
    </Route>,
  ];
}
