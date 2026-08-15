import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { catalogApi } from '@/api/catalog.api';
import { doctorsApi } from '@/api/doctors.api';
import { formatCurrency } from '@/utils/format';
import { getInitial, specializationLabel } from '@/utils/display';

/**
 * Trang giới thiệu phòng khám. Cấu trúc nghiệp vụ tham khảo các phòng khám thú y đang
 * hoạt động (thonglorpet, phongkhamthuyk9): giới thiệu -> dịch vụ kèm giá -> quy trình
 * khám -> đội ngũ -> chi nhánh. Giao diện là của dự án, không sao chép.
 */
const HIGHLIGHTS = [
  {
    icon: '🩺',
    title: 'Khám & điều trị toàn diện',
    body: 'Nội khoa, ngoại khoa, da liễu, tiêu hoá - chẩn đoán dựa trên xét nghiệm và chẩn đoán hình ảnh tại chỗ.',
  },
  {
    icon: '💉',
    title: 'Tiêm phòng & phòng bệnh',
    body: 'Lịch tiêm được hệ thống nhắc tự động theo từng thú cưng, không lo quên mũi nhắc lại.',
  },
  {
    icon: '🧪',
    title: 'Xét nghiệm tại phòng khám',
    body: 'Kết quả xét nghiệm máu, ký sinh trùng, nước tiểu được trả và lưu thẳng vào hồ sơ bệnh án.',
  },
  {
    icon: '📱',
    title: 'Hồ sơ điện tử',
    body: 'Chủ nuôi tra cứu lịch hẹn, đơn thuốc và lịch sử khám của từng bé ngay trên tài khoản của mình.',
  },
];

const BOOKING_STEPS = [
  { step: '1', title: 'Chọn chi nhánh & dịch vụ', body: 'Xem bảng giá công khai trước khi đặt.' },
  { step: '2', title: 'Chọn bác sĩ hoặc để phòng khám sắp xếp', body: 'Không bắt buộc phải biết trước bác sĩ nào.' },
  { step: '3', title: 'Chọn khung giờ còn trống', body: 'Lịch hẹn nhận từ ngày mai trở đi.' },
  { step: '4', title: 'Mô tả triệu chứng', body: 'Kèm ảnh nếu có - bác sĩ chuẩn bị trước buổi khám.' },
];

export function HomePage() {
  const navigate = useNavigate();
  const { data: branches } = useQuery({ queryKey: ['branches'], queryFn: branchesApi.list });
  const { data: doctors } = useQuery({
    queryKey: ['doctors', 'public', ''],
    queryFn: () => doctorsApi.listPublic(),
  });
  const { data: servicesResult } = useQuery({
    queryKey: ['catalog', 'services', 'public'],
    queryFn: () => catalogApi.services({ limit: 100 }),
  });
  const featuredServices = (servicesResult?.data ?? [])
    .filter((s) => s.active && s.item.active)
    .slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:grid-cols-2 sm:items-center">
          <div>
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Phòng khám thú y · Hệ thống nhiều chi nhánh
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              Chăm sóc thú cưng của bạn, tận tâm như người thân
            </h1>
            <p className="mt-4 text-lg text-muted">
              Đội ngũ bác sĩ thú y giàu kinh nghiệm, trang thiết bị chẩn đoán hiện đại và trợ lý AI hỗ
              trợ sàng lọc triệu chứng trước khi khám. Đặt lịch trực tuyến chỉ trong hai phút.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/booking"
                className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                Đặt lịch khám ngay
              </Link>
              <Link
                to="/services"
                className="rounded-lg border border-border px-6 py-3 font-semibold text-foreground hover:border-primary/50"
              >
                Xem bảng giá dịch vụ
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {HIGHLIGHTS.map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-surface-muted p-5">
                <div className="text-2xl">{item.icon}</div>
                <p className="mt-2 font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-sm text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services with prices */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Dịch vụ nổi bật</h2>
            <p className="mt-1 text-muted">Giá công khai, không phát sinh khi chưa được bạn đồng ý.</p>
          </div>
          <Link to="/services" className="text-sm font-medium text-primary">
            Xem toàn bộ bảng giá →
          </Link>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredServices.map((service) => (
            <div key={service.id} className="flex flex-col rounded-xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-foreground">{service.item.itemName}</h3>
                <span className="whitespace-nowrap font-semibold text-primary">
                  {formatCurrency(service.item.unitPrice)}
                </span>
              </div>
              {service.item.describe && (
                <p className="mt-2 flex-1 text-sm text-muted">{service.item.describe}</p>
              )}
              <button
                type="button"
                onClick={() => navigate('/booking', { state: { serviceId: service.id } })}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Đặt lịch hẹn ngay
              </button>
            </div>
          ))}
          {featuredServices.length === 0 && (
            <p className="text-muted">Bảng giá dịch vụ sẽ sớm được cập nhật.</p>
          )}
        </div>
      </section>

      {/* Booking process */}
      <section className="border-y border-border bg-surface-muted">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold text-foreground">Đặt lịch khám thế nào?</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {BOOKING_STEPS.map((item) => (
              <div key={item.step} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                  {item.step}
                </div>
                <p className="mt-3 font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-sm text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI pre-screening */}
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:grid-cols-2 sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Sàng lọc triệu chứng cùng AI</h2>
          <p className="mt-3 text-muted">
            Trước khi đặt lịch, hãy mô tả các dấu hiệu bất thường của thú cưng với trợ lý AI của chúng
            tôi. Trợ lý sẽ giúp bạn hiểu rõ hơn tình trạng ban đầu và đề xuất đặt lịch khám khi cần
            thiết. Đây chỉ là công cụ hỗ trợ thông tin, không thay thế chẩn đoán của bác sĩ thú y.
          </p>
          <Link
            to="/chat"
            className="mt-4 inline-block rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground"
          >
            Trò chuyện với trợ lý AI
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
          <p className="font-medium text-foreground">Ví dụ trợ lý có thể giúp bạn</p>
          <ul className="mt-3 space-y-2">
            <li>• "Chó của tôi bị nôn và bỏ ăn 2 ngày nay, có nghiêm trọng không?"</li>
            <li>• "Mèo bị rụng lông nhiều và ngứa da, tôi nên làm gì?"</li>
            <li>• Trợ lý sẽ gợi ý đặt lịch khám nếu triệu chứng cần bác sĩ kiểm tra trực tiếp</li>
          </ul>
        </div>
      </section>

      {/* Doctors teaser */}
      <section className="border-t border-border bg-surface-muted">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-semibold text-foreground">Đội ngũ bác sĩ</h2>
            <Link to="/doctors" className="text-sm font-medium text-primary">
              Xem tất cả bác sĩ →
            </Link>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {doctors?.slice(0, 4).map((doctor) => (
              <div key={doctor.id} className="rounded-xl border border-border bg-surface p-5 text-center">
                {doctor.avatarUrl ? (
                  <img
                    src={doctor.avatarUrl}
                    alt={doctor.fullName}
                    className="mx-auto h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                    {getInitial(doctor.fullName)}
                  </div>
                )}
                <p className="mt-3 font-medium text-foreground">{doctor.fullName}</p>
                <p className="text-xs text-muted">
                  {doctor.specialization[0]
                    ? specializationLabel(doctor.specialization[0])
                    : doctor.branch.branchName}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    navigate('/booking', { state: { doctorId: doctor.id, branchId: doctor.branch.id } })
                  }
                  className="mt-3 w-full rounded-lg border border-primary/40 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/5"
                >
                  Đặt lịch hẹn ngay
                </button>
              </div>
            ))}
            {doctors && doctors.length === 0 && (
              <p className="text-muted">Thông tin bác sĩ sẽ sớm được cập nhật.</p>
            )}
          </div>
        </div>
      </section>

      {/* Branches */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Chi nhánh của chúng tôi</h2>
          <Link to="/branches" className="text-sm font-medium text-primary">
            Xem tất cả chi nhánh →
          </Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {branches?.slice(0, 3).map((branch) => (
            <div key={branch.id} className="rounded-xl border border-border bg-surface p-5">
              <h3 className="font-semibold text-foreground">{branch.branchName}</h3>
              <p className="mt-1 text-sm text-muted">{branch.address}</p>
              <p className="mt-1 text-sm text-muted">{branch.phone}</p>
            </div>
          ))}
          {branches && branches.length === 0 && (
            <p className="text-muted">Hiện chưa có chi nhánh nào được công bố.</p>
          )}
        </div>
      </section>
    </div>
  );
}
