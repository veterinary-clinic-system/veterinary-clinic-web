import { Link } from 'react-router-dom';
import { Icon, IconName } from '@/components/basic';

/**
 * Bốn điểm tin cậy. Đây là những thứ hệ thống THẬT SỰ có - không phải khẩu hiệu.
 * Không đưa vào con số nào mà dữ liệu không chứng minh được ("10.000 khách hàng").
 */
const TRUST_POINTS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'stethoscope',
    title: 'Bác sĩ chuyên khoa',
    body: 'Nội khoa, ngoại khoa, da liễu, tiêu hoá - mỗi ca được xếp đúng chuyên khoa.',
  },
  {
    icon: 'flask',
    title: 'Xét nghiệm tại chỗ',
    body: 'Máu, ký sinh trùng, nước tiểu - kết quả trả thẳng vào hồ sơ bệnh án.',
  },
  {
    icon: 'building',
    title: 'Nhiều chi nhánh',
    body: 'Hồ sơ thú cưng dùng chung giữa các chi nhánh, khám ở đâu cũng có lịch sử.',
  },
  {
    icon: 'syringe',
    title: 'Nhắc lịch tự động',
    body: 'Mũi tiêm nhắc lại và lịch tái khám được hệ thống theo dõi thay bạn.',
  },
];

/**
 * Phần mở đầu trang chủ.
 *
 * Cố ý KHÔNG chiếm trọn màn hình: người vào trang một phòng khám đang tìm thông tin
 * (dịch vụ nào, giá bao nhiêu, chi nhánh ở đâu), không tìm một trải nghiệm thị giác.
 * Một hero cao 100vh đẩy toàn bộ thông tin đó xuống dưới nếp gấp và bắt họ cuộn để
 * biết trang này có thứ họ cần hay không.
 *
 * Hai CTA, phân cấp rõ: "Đặt lịch khám" là việc chính, "Xem bảng giá" cho người chưa
 * sẵn sàng đặt. Không có CTA thứ ba - thêm lựa chọn ở đây là thêm do dự.
 */
export function HomeHero() {
  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Icon name="paw" className="h-4 w-4" />
            Hệ thống phòng khám thú y nhiều chi nhánh
          </p>

          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
            Chăm sóc thú cưng của bạn, bằng hồ sơ bệnh án đầy đủ
          </h1>

          <p className="mt-4 text-lg text-muted">
            Đặt lịch trực tuyến trong hai phút, chọn đúng bác sĩ và khung giờ còn trống. Mọi lần
            khám, đơn thuốc và mũi tiêm của bé đều được lưu lại để bạn tra cứu bất cứ lúc nào.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/booking"
              className="inline-flex min-h-touch items-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Đặt lịch khám
            </Link>
            <Link
              to="/services"
              className="inline-flex min-h-touch items-center rounded-lg border border-border px-6 font-semibold text-foreground transition-colors hover:bg-surface-muted"
            >
              Xem bảng giá dịch vụ
            </Link>
          </div>
        </div>

        {/*
          Điểm tin cậy nằm NGAY dưới hero, cùng một khối: đây là câu trả lời cho "vì sao
          tôi nên tin chỗ này", và nó chỉ có tác dụng khi đọc được cùng lúc với lời mời
          đặt lịch.
        */}
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_POINTS.map((point) => (
            <li key={point.title}>
              <Icon name={point.icon} className="h-6 w-6 text-primary" />
              <p className="mt-2.5 font-semibold text-foreground">{point.title}</p>
              <p className="mt-1 text-sm text-muted">{point.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
