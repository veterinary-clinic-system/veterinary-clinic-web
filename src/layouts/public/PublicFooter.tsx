import { Link } from 'react-router-dom';
import { Icon } from '@/components/basic';

const SERVICE_LINKS = [
  { to: '/services', label: 'Bảng giá dịch vụ' },
  { to: '/booking', label: 'Đặt lịch khám' },
  { to: '/chat', label: 'Tư vấn cùng AI' },
];

const CLINIC_LINKS = [
  { to: '/doctors', label: 'Đội ngũ bác sĩ' },
  { to: '/branches', label: 'Hệ thống chi nhánh' },
];

/**
 * Chân trang.
 *
 * Giờ làm việc dùng `<dl>` chứ không phải hai dòng chữ: đây là các cặp nhãn - giá trị,
 * và trình đọc màn hình đọc ra đúng quan hệ đó.
 *
 * Không có mục "Về chúng tôi / Tầm nhìn / Sứ mệnh": chân trang của một phòng khám nên
 * trả lời "đi đâu, lúc nào, gọi ai", không phải nhắc lại trang giới thiệu.
 */
export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              <Icon name="stethoscope" className="h-4 w-4" />
            </span>
            Phòng khám thú y
          </p>
          <p className="mt-3 text-sm text-muted">
            Hệ thống phòng khám thú y nhiều chi nhánh - khám chữa bệnh, tiêm phòng và chăm sóc thú
            cưng.
          </p>
        </div>

        <nav aria-label="Dịch vụ">
          <h2 className="text-sm font-semibold text-foreground">Dịch vụ</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {SERVICE_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-muted hover:text-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Về phòng khám">
          <h2 className="text-sm font-semibold text-foreground">Phòng khám</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {CLINIC_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-muted hover:text-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold text-foreground">Giờ làm việc</h2>
          <dl className="mt-3 space-y-1 text-sm text-muted">
            <div className="flex justify-between gap-4">
              <dt>Thứ Hai - Thứ Sáu</dt>
              <dd>07:00 - 17:30</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Thứ Bảy - Chủ Nhật</dt>
              <dd>Nghỉ</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-muted">
            Trường hợp cấp cứu ngoài giờ, vui lòng gọi trực tiếp chi nhánh gần nhất.
          </p>
        </div>
      </div>

      <div className="border-t border-border px-4 py-5 text-center text-sm text-muted">
        © {new Date().getFullYear()} Veterinary Clinic System - Đồ án tốt nghiệp
      </div>
    </footer>
  );
}
