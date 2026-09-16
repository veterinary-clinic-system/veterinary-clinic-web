import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { doctorsApi } from '@/api/doctors.api';
import { getInitial, specializationLabel } from '@/utils/display';

export function HomePage() {
  const { data: branches } = useQuery({ queryKey: ['branches'], queryFn: branchesApi.list });
  const { data: doctors } = useQuery({
    queryKey: ['doctors', 'public', ''],
    queryFn: () => doctorsApi.listPublic(),
  });

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border bg-surface-muted">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:grid-cols-2 sm:items-center">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-foreground">
              Chăm sóc thú cưng của bạn, tận tâm như người thân
            </h1>
            <p className="mt-4 text-lg text-muted">
              Hệ thống phòng khám thú y với đội ngũ bác sĩ giàu kinh nghiệm, trang thiết bị hiện đại và
              trợ lý AI hỗ trợ sàng lọc triệu chứng trước khi khám.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/booking"
                className="rounded bg-primary px-6 py-3 font-medium text-primary-foreground"
              >
                Đặt lịch khám ngay
              </Link>
              <Link
                to="/chat"
                className="rounded border border-border px-6 py-3 font-medium text-foreground"
              >
                Tư vấn cùng AI
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-6">
            <p className="text-sm font-medium text-muted">Vì sao chọn chúng tôi</p>
            <ul className="mt-3 space-y-2 text-foreground">
              <li>• Đặt lịch trực tuyến, chọn bác sĩ và khung giờ phù hợp</li>
              <li>• Sàng lọc triệu chứng bằng AI trước khi đến khám</li>
              <li>• Theo dõi hồ sơ và lịch sử khám của từng thú cưng</li>
              <li>• Mạng lưới chi nhánh rộng khắp</li>
            </ul>
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
            <div key={branch.id} className="rounded border border-border bg-surface p-5">
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

      {/* AI pre-screening */}
      <section className="border-y border-border bg-surface-muted">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:grid-cols-2 sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Sàng lọc triệu chứng cùng AI</h2>
            <p className="mt-3 text-muted">
              Trước khi đặt lịch, hãy mô tả các dấu hiệu bất thường của thú cưng với trợ lý AI của chúng
              tôi. Trợ lý sẽ giúp bạn hiểu rõ hơn tình trạng ban đầu và đề xuất đặt lịch khám khi cần
              thiết. Đây chỉ là công cụ hỗ trợ thông tin, không thay thế chẩn đoán của bác sĩ thú y.
            </p>
            <Link to="/chat" className="mt-4 inline-block rounded bg-primary px-5 py-2.5 text-primary-foreground">
              Trò chuyện với trợ lý AI
            </Link>
          </div>
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
            <p className="font-medium text-foreground">Ví dụ trợ lý có thể giúp bạn</p>
            <ul className="mt-3 space-y-2">
              <li>• "Chó của tôi bị nôn và bỏ ăn 2 ngày nay, có nghiêm trọng không?"</li>
              <li>• "Mèo bị rụng lông nhiều và ngứa da, tôi nên làm gì?"</li>
              <li>• Trợ lý sẽ gợi ý đặt lịch khám nếu triệu chứng cần bác sĩ kiểm tra trực tiếp</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Doctors teaser */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Đội ngũ bác sĩ</h2>
          <Link to="/doctors" className="text-sm font-medium text-primary">
            Xem tất cả bác sĩ →
          </Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {doctors?.slice(0, 4).map((doctor) => (
            <div key={doctor.id} className="rounded border border-border bg-surface p-4 text-center">
              {doctor.avatarUrl ? (
                <img
                  src={doctor.avatarUrl}
                  alt={doctor.fullName}
                  className="mx-auto h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                  {getInitial(doctor.fullName)}
                </div>
              )}
              <p className="mt-2 font-medium text-foreground">{doctor.fullName}</p>
              <p className="text-xs text-muted">
                {doctor.specialization[0] ? specializationLabel(doctor.specialization[0]) : doctor.branch.branchName}
              </p>
            </div>
          ))}
          {doctors && doctors.length === 0 && (
            <p className="text-muted">Thông tin bác sĩ sẽ sớm được cập nhật.</p>
          )}
        </div>
      </section>
    </div>
  );
}
