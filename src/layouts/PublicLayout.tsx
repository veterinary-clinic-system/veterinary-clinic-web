import { Outlet } from 'react-router-dom';
import { PublicFooter } from './public/PublicFooter';
import { PublicHeader } from './public/PublicHeader';

/**
 * Khung của trang công khai VÀ khu chủ nuôi.
 *
 * Chủ nuôi dùng chung khung này chứ không có một "dashboard khách hàng" riêng: họ đi
 * qua lại giữa trang dịch vụ và hồ sơ thú cưng liên tục, và đổi khung giữa chừng làm
 * họ tưởng đã rời khỏi trang. Xem `docs/01-thong-tin-kien-truc.md` mục 2.2.
 *
 * Mật độ luôn là `comfortable`: đây là trải nghiệm khách hàng, không phải công cụ làm
 * việc - chữ to hơn, khoảng thở nhiều hơn, đọc bằng điện thoại là chính.
 */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      {/*
        Lối tắt cho người đi bằng bàn phím: nhấn Tab lần đầu là nhảy thẳng tới nội dung,
        không phải lách qua toàn bộ thanh điều hướng trên mỗi trang.
      */}
      <a
        href="#noi-dung-chinh"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:font-medium focus:text-primary-foreground"
      >
        Bỏ qua điều hướng, tới nội dung chính
      </a>

      <PublicHeader />

      <main id="noi-dung-chinh" className="flex-1">
        <Outlet />
      </main>

      <PublicFooter />
    </div>
  );
}
