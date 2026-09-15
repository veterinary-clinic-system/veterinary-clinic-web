import { lazy } from 'react';
import { Route } from 'react-router-dom';

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
