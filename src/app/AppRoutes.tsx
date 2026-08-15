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

/**
 * Bản đồ ZONE của ứng dụng - file này chỉ trả lời "khung nào bọc zone nào", còn từng
 * đường dẫn cụ thể thì thuộc về `routes.tsx` của chính zone đó.
 *
 * Bốn zone chia theo ĐỐI TƯỢNG SỬ DỤNG, mỗi zone là một gói JavaScript riêng
 * (`manualChunks` trong vite.config.ts):
 *
 *   public   - khách vãng lai  : giới thiệu, bảng giá, đội ngũ, đặt lịch, đăng nhập
 *   owner    - chủ nuôi        : /my/*  (nằm trong PublicLayout)
 *   clinical - bác sĩ + lễ tân : lịch làm việc, hàng chờ, phiếu khám, hồ sơ
 *   admin    - quản trị + kho  : POS, hoá đơn, danh mục, kho, nhân sự, báo cáo
 *
 * Zone là ranh giới CODE, KHÔNG phải ranh giới URL: `clinical` và `admin` cùng nằm
 * dưới `/staff` và cùng dùng `StaffLayout`. Nhờ vậy mục nghiệm thu #11 (nhân viên gõ
 * "/" bị đẩy về /staff) không bị đụng tới.
 */
export function AppRoutes() {
  return (
    /*
      MỘT `Suspense` bọc toàn bộ cây route thay vì một cái cho mỗi trang: mỗi lần điều
      hướng chỉ có đúng một zone đang tải, nên nhiều ranh giới `Suspense` lồng nhau chỉ
      thêm chỗ để quên chứ không đổi thứ người dùng nhìn thấy.
    */
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/*
          Nhân viên không dùng site công khai: `StaffConsoleOnly` đẩy họ về /staff, kể cả
          khi họ gõ thẳng "/". Chủ nuôi và khách vãng lai không bị ảnh hưởng.
        */}
        <Route element={<StaffConsoleOnly />}>
          <Route element={<PublicLayout />}>
            {publicRoutes()}
            {ownerRoutes()}
          </Route>
        </Route>

        <Route element={<RequireAuth allow={STAFF_ROLES} />}>
          <Route element={<StaffLayout />}>
            {clinicalRoutes()}
            {adminRoutes()}
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
