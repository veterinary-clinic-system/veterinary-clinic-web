import { lazy } from 'react';
import { Route } from 'react-router-dom';

/**
 * ZONE CÔNG KHAI - khách chưa đăng nhập: giới thiệu phòng khám, bảng giá, đội ngũ,
 * biểu mẫu đặt lịch, đăng nhập/đăng ký.
 *
 * Mỗi trang là một `lazy()` riêng nên chỉ tải khi có người mở tới. Cấu hình
 * `manualChunks` trong vite.config.ts gom chúng lại thành MỘT gói theo zone: 8 gói tí
 * hon cho 8 trang của cùng một luồng chỉ đổi một lần tải lớn thành tám lần tải nhỏ,
 * trong khi khách đi qua zone này gần như luôn xem vài trang liền nhau.
 *
 * Đây là ranh giới CODE, không phải ranh giới URL - đường dẫn giữ nguyên như cũ.
 */
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const ServicesPage = lazy(() =>
  import('./pages/ServicesPage').then((m) => ({ default: m.ServicesPage })),
);
const DoctorsPage = lazy(() =>
  import('./pages/DoctorsPage').then((m) => ({ default: m.DoctorsPage })),
);
const BranchesPage = lazy(() =>
  import('./pages/BranchesPage').then((m) => ({ default: m.BranchesPage })),
);
const BookingPage = lazy(() =>
  import('./pages/BookingPage').then((m) => ({ default: m.BookingPage })),
);
const ChatPage = lazy(() => import('./pages/ChatPage').then((m) => ({ default: m.ChatPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);

/**
 * Trả về mảng `<Route>` chứ không phải một component: `<Routes>` của react-router chỉ
 * đọc được cây `<Route>` con trực tiếp, nên một zone bọc trong component sẽ cần
 * `<Routes>` lồng và một đường dẫn splat - thừa, vì zone ở đây không sở hữu một tiền
 * tố URL riêng nào.
 */
export function publicRoutes() {
  return [
    <Route key="home" path="/" element={<HomePage />} />,
    <Route key="services" path="/services" element={<ServicesPage />} />,
    <Route key="branches" path="/branches" element={<BranchesPage />} />,
    <Route key="doctors" path="/doctors" element={<DoctorsPage />} />,
    <Route key="booking" path="/booking" element={<BookingPage />} />,
    <Route key="chat" path="/chat" element={<ChatPage />} />,
    <Route key="login" path="/login" element={<LoginPage />} />,
    <Route key="register" path="/register" element={<RegisterPage />} />,
  ];
}
