import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { RequireAuth } from '@/routes/RequireAuth';
import {
  COUNTER_ROLES,
  MANAGEMENT_ROLES,
  SYSTEM_ROLES,
  WAREHOUSE_ROLES,
} from '@/types/permission-groups';

/**
 * ZONE QUẢN TRỊ - phần vận hành phòng khám: tổng quan, bán hàng tại quầy, hoá đơn,
 * danh mục hàng hoá, kho, quầy thuốc, nhân sự, phân quyền, báo cáo, nhật ký kiểm toán.
 *
 * Đây là zone NẶNG NHẤT và cũng là zone ít người dùng nhất - chỉ quản lý, admin, dược
 * sĩ và nhân viên quầy mở tới. Tách ra khỏi zone lâm sàng nghĩa là bác sĩ không phải
 * tải bảng phân quyền và toàn bộ màn hình kho chỉ để mở lịch làm việc.
 *
 * Các chốt `RequireAuth` giữ nguyên như trước khi tách, kèm nguyên văn lý do: chúng
 * bám theo ma trận `role_permissions` phía backend, và backend vẫn là hàng rào thật -
 * chặn ở đây chỉ để không đưa người dùng tới một trang họ chắc chắn nhận 403.
 */
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
    /*
      Bán hàng tại quầy (P8). Quyền POS_SELL trong ma trận thuộc về STAFF,
      RECEPTIONIST, MANAGER, ADMIN - đúng bốn vai trò của COUNTER_ROLES ở nav.
    */
    <Route key="counter" element={<RequireAuth allow={COUNTER_ROLES} />}>
      <Route path="/staff/pos" element={<PosPage />} />
      {/*
        Hoá đơn nằm CÙNG chốt với bán hàng. Trước đây hai đường dẫn này để trần, nên một
        bác sĩ hoặc dược sĩ gõ `/staff/billing` mở ra được một bảng rỗng kèm lỗi tải dữ
        liệu - trong khi sidebar của họ không hề có mục đó.
      */}
      <Route path="/staff/billing" element={<BillingListPage />} />
      <Route path="/staff/billing/:id" element={<InvoiceDetailPage />} />
    </Route>,

    /*
      Tồn kho và cảnh báo mở cho MỌI vai trò nhân viên: ma trận `role_permissions` cho
      tất cả họ `INVENTORY_VIEW` (kể cả STAFF bán hàng và bác sĩ). Các nút ghi trên
      trang tự ẩn theo vai trò, và backend vẫn là hàng rào thật.
    */
    <Route key="inventory" path="/staff/inventory" element={<InventoryPage />} />,
    <Route key="alerts" path="/staff/inventory/alerts" element={<InventoryAlertsPage />} />,

    <Route key="manage" element={<RequireAuth allow={MANAGEMENT_ROLES} />}>
      <Route path="/staff/catalog" element={<CatalogAdminPage />} />
      {/* BR-15: chỉ Manager/Admin được xem báo cáo doanh thu. */}
      <Route path="/staff/reports" element={<ReportsPage />} />
      <Route path="/staff/employees" element={<EmployeesPage />} />
    </Route>,

    /*
      Danh mục hàng hoá (P5) mở thêm cho PHARMACIST: ma trận `role_permissions` phía
      backend cho họ CATALOG_MANAGE, nên chặn ở router sẽ tạo ra một danh sách vai trò
      thứ hai lệch với nguồn sự thật kia.
    */
    <Route key="warehouse" element={<RequireAuth allow={WAREHOUSE_ROLES} />}>
      <Route path="/staff/products" element={<ProductsPage />} />
      <Route path="/staff/categories" element={<CategoriesPage />} />
      <Route path="/staff/suppliers" element={<SuppliersPage />} />
      {/*
        Đặt hàng / nhận hàng / kiểm kê cần INVENTORY_IMPORT hoặc INVENTORY_EXPORT, mà
        ma trận quyền chỉ cho ba vai trò này — cùng nhóm với danh mục hàng hoá.
      */}
      <Route path="/staff/purchase-orders" element={<PurchaseOrdersPage />} />
      <Route path="/staff/goods-receipts" element={<GoodsReceiptPage />} />
      <Route path="/staff/stock-takes" element={<StockTakePage />} />
      {/*
        Quầy thuốc (P7). Cấp phát cần `PRESCRIPTION_DISPENSE`, mà ma trận quyền chỉ cho
        PHARMACIST và ADMIN. MANAGER vào được để xem — họ có `PRESCRIPTION_VIEW`, và
        backend vẫn chặn nút cấp phát của họ.
      */}
      <Route path="/staff/pharmacy" element={<PharmacyPage />} />
    </Route>,

    <Route key="admin-only" element={<RequireAuth allow={SYSTEM_ROLES} />}>
      <Route path="/staff/branches" element={<BranchesAdminPage />} />
      <Route path="/staff/users" element={<UsersAdminPage />} />
      {/* BR-16: chỉ Admin được quản lý role và permission. */}
      <Route path="/staff/permissions" element={<RolePermissionsPage />} />
      {/* FR-26/BR-17: `AUDIT_VIEW` trong ma trận mặc định chỉ thuộc về Admin. */}
      <Route path="/staff/audit-logs" element={<AuditLogsPage />} />
    </Route>,
  ];
}
