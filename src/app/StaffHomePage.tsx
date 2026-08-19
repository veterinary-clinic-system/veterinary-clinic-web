import { lazy } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CLINICAL_HOME_ROLES } from '@/layouts/staff/nav-model';

/**
 * `/staff` là MỘT đường dẫn, hai nội dung.
 *
 * Bác sĩ và lễ tân mở trang này thấy công việc hôm nay: ai đang chờ, ca kế tiếp, mũi
 * tiêm cần gọi nhắc. Quản lý và admin thấy tình hình vận hành: doanh thu, lịch hẹn, tồn
 * kho. Cùng một URL, cùng một khung, cùng một bộ component - khác *câu hỏi mà trang
 * đang trả lời*.
 *
 * Trước đây chỉ có bản điều hành, và vai trò không có `REPORT_VIEW` nhận một trang chỉ
 * gồm bốn ô liên kết - đúng nghĩa một ngõ cụt cho hai vai trò dùng hệ thống nhiều nhất.
 *
 * Bộ chọn nằm ở `src/app/` chứ không ở trong một zone: nó phải biết tới cả hai zone, và
 * đặt trong một zone sẽ tạo cạnh phụ thuộc `admin -> clinical` mà `manualChunks`
 * (vite.config.ts) cấm - đúng thứ sinh ra lỗi "Circular chunk".
 */
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
