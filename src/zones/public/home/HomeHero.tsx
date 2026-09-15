import { Link } from 'react-router-dom';
import { Icon, IconName } from '@/components/basic';
import { PetIllustration } from './PetIllustration';

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

export function HomeHero() {
  return (
    <section className="pet-hero">
      <div className="mx-auto max-w-6xl px-4 pt-12 sm:pt-16">
        <div className="pet-hero-grid">
          <div className="pet-hero-copy">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Icon name="paw" className="h-4 w-4" />
              VETAI HUB · Chăm sóc bằng cả trái tim
            </p>

            <h1 className="pet-hero-title">
              Vì bé là <span>gia đình.</span>
              <br />
              Vì yêu thương
              <br />
              cần được chăm sóc.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
              Từ cái vẫy đuôi đầu tiên đến những năm tháng bên nhau. Chúng tôi đồng hành cùng bạn
              chăm sóc bé, với bác sĩ tận tâm và hồ sơ sức khỏe luôn trong tầm tay.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/booking"
                className="pet-primary-button inline-flex min-h-touch items-center gap-3 px-6 font-semibold"
              >
                Đặt lịch cho bé <span aria-hidden="true">↗</span>
              </Link>
              <Link
                to="/services"
                className="pet-secondary-button inline-flex min-h-touch items-center px-6 font-semibold"
              >
                Xem bảng giá dịch vụ
              </Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-muted">
              <Icon name="paw" className="h-4 w-4 text-primary" /> Đặt lịch dễ dàng · Giá dịch vụ
              minh bạch
            </p>
          </div>
          <PetIllustration />
        </div>

        {}
        <ul className="pet-trust-strip mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
