import { Link } from 'react-router-dom';
import { Icon, IconName } from '@/components/basic';
import { SectionHeader } from '../components/SectionHeader';

const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'catalog',
    title: 'Chọn dịch vụ',
    body: 'Xem bảng giá công khai và thời lượng dự kiến trước khi quyết định.',
  },
  {
    icon: 'calendar',
    title: 'Đặt lịch hẹn',
    body: 'Chọn chi nhánh, bác sĩ và khung giờ còn trống. Không cần tài khoản.',
  },
  {
    icon: 'building',
    title: 'Đến phòng khám',
    body: 'Báo tên hoặc số điện thoại tại quầy, lễ tân tiếp nhận theo thứ tự ưu tiên.',
  },
  {
    icon: 'stethoscope',
    title: 'Nhận kết quả',
    body: 'Chẩn đoán, đơn thuốc và hẹn tái khám được lưu vào hồ sơ của bé.',
  },
];

/**
 * Quy trình bốn bước.
 *
 * Mục này trả lời một lo lắng cụ thể của người chưa từng đặt lịch trực tuyến: "đặt xong
 * rồi thì sao, tôi phải làm gì tiếp?". Đó là lý do bước 3 và 4 nói về việc xảy ra TẠI
 * phòng khám chứ không chỉ về thao tác trên web.
 *
 * Số thứ tự là `<ol>` thật - thứ tự ở đây mang nghĩa, và trình đọc màn hình đọc ra
 * "mục 1 trên 4".
 */
export function HowItWorks() {
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <SectionHeader
          title="Đặt lịch khám thế nào?"
          description="Bốn bước, không cần đăng ký tài khoản trước."
        />

        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon name={step.icon} />
                </span>
                <span className="text-sm font-medium tabular-nums text-muted">
                  Bước {index + 1}
                </span>
              </div>
              <p className="mt-3 font-semibold text-foreground">{step.title}</p>
              <p className="mt-1 text-sm text-muted">{step.body}</p>
            </li>
          ))}
        </ol>

        <Link
          to="/booking"
          className="mt-8 inline-flex min-h-touch items-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Bắt đầu đặt lịch
        </Link>
      </div>
    </section>
  );
}
