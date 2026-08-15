import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { RequireAuth } from '@/routes/RequireAuth';
import { Role } from '@/types/enums';

/**
 * ZONE CHỦ NUÔI - khu tài khoản cá nhân của người nuôi thú cưng: lịch hẹn của tôi,
 * chi tiết lịch hẹn, thú cưng của tôi, hồ sơ từng bé (phản hồi nghiệm thu #9).
 *
 * Nằm TRONG `PublicLayout` chứ không có khung riêng: chủ nuôi đi thẳng từ trang giới
 * thiệu sang khu của mình và ngược lại, đổi khung giữa chừng sẽ làm họ tưởng đã rời
 * khỏi trang.
 *
 * `RequireAuth` gắn ngay tại đây thay vì để router gốc bọc từ ngoài: điều kiện vào
 * zone là chuyện của zone, và ai đọc file này thấy ngay khu vực này chỉ dành cho
 * `PET_OWNER`. Hàng rào thật vẫn nằm ở backend.
 */
const MyPetsPage = lazy(() => import('./pages/MyPetsPage').then((m) => ({ default: m.MyPetsPage })));
const PetProfilePage = lazy(() =>
  import('./pages/PetProfilePage').then((m) => ({ default: m.PetProfilePage })),
);
const MyAppointmentsPage = lazy(() =>
  import('./pages/MyAppointmentsPage').then((m) => ({ default: m.MyAppointmentsPage })),
);
const MyAppointmentDetailPage = lazy(() =>
  import('./pages/MyAppointmentDetailPage').then((m) => ({ default: m.MyAppointmentDetailPage })),
);

export function ownerRoutes() {
  return (
    <Route element={<RequireAuth allow={[Role.PET_OWNER]} />}>
      <Route path="/my/pets" element={<MyPetsPage />} />
      <Route path="/my/pets/:id" element={<PetProfilePage />} />
      <Route path="/my/appointments" element={<MyAppointmentsPage />} />
      <Route path="/my/appointments/:id" element={<MyAppointmentDetailPage />} />
    </Route>
  );
}
