import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { catalogApi } from '@/api/catalog.api';
import { doctorsApi } from '@/api/doctors.api';
import { SkeletonCards } from '@/components/basic';
import { BranchCard } from '../components/BranchCard';
import { DoctorCard } from '../components/DoctorCard';
import { SectionHeader } from '../components/SectionHeader';
import { ServiceCard } from '../components/ServiceCard';
import { AiConsultSection } from '../home/AiConsultSection';
import { HomeHero } from '../home/HomeHero';
import { HowItWorks } from '../home/HowItWorks';

/**
 * Trang chủ.
 *
 * Thứ tự các mục bám theo thứ tự câu hỏi trong đầu người đang tìm phòng khám:
 *
 *     Đây là chỗ nào, có tin được không   -> Hero + điểm tin cậy
 *     Có dịch vụ tôi cần không, giá bao nhiêu -> Dịch vụ nổi bật
 *     Đặt lịch xong thì sao               -> Quy trình 4 bước
 *     Ai sẽ khám cho bé nhà tôi           -> Đội ngũ bác sĩ
 *     Chỗ nào gần tôi                     -> Chi nhánh
 *     Chưa chắc có cần đi khám không      -> Trợ lý AI
 *
 * Không có mục "cảm nhận khách hàng": hệ thống chưa thu thập đánh giá, và một mục
 * chứng thực bịa ra thì tệ hơn là không có.
 *
 * Mỗi mục dữ liệu chỉ hiện khi có dữ liệu. Danh sách rỗng thì bỏ hẳn mục đó thay vì
 * hiện một khối trống với dòng "sẽ sớm cập nhật" - trang chủ không phải chỗ báo cáo
 * tình trạng nhập liệu.
 */
export function HomePage() {
  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: branchesApi.list,
  });

  const { data: doctors, isLoading: doctorsLoading } = useQuery({
    queryKey: ['doctors', 'public', ''],
    queryFn: () => doctorsApi.listPublic(),
  });

  const { data: servicesResult, isLoading: servicesLoading } = useQuery({
    queryKey: ['catalog', 'services', 'public'],
    queryFn: () => catalogApi.services({ limit: 100 }),
  });

  const featuredServices = (servicesResult?.data ?? [])
    .filter((service) => service.active && service.item.active)
    .slice(0, 6);
  const featuredDoctors = (doctors ?? []).slice(0, 4);
  const featuredBranches = (branches ?? []).slice(0, 3);

  return (
    <>
      <HomeHero />

      {(servicesLoading || featuredServices.length > 0) && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <SectionHeader
            title="Dịch vụ nổi bật"
            description="Giá công khai, không phát sinh khi chưa được bạn đồng ý."
            linkTo="/services"
            linkLabel="Xem toàn bộ bảng giá"
          />

          {servicesLoading ? (
            <SkeletonCards count={6} label="Đang tải bảng giá dịch vụ" className="mt-8" />
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </section>
      )}

      <HowItWorks />

      {(doctorsLoading || featuredDoctors.length > 0) && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <SectionHeader
            title="Đội ngũ bác sĩ"
            description="Bạn có thể chọn đúng bác sĩ khi đặt lịch, hoặc để phòng khám sắp xếp."
            linkTo="/doctors"
            linkLabel="Xem tất cả bác sĩ"
          />

          {doctorsLoading ? (
            <SkeletonCards count={4} label="Đang tải danh sách bác sĩ" className="mt-8 lg:grid-cols-2" />
          ) : (
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {featuredDoctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          )}
        </section>
      )}

      {(branchesLoading || featuredBranches.length > 0) && (
        <section className="border-t border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <SectionHeader
              title="Hệ thống chi nhánh"
              description="Hồ sơ thú cưng dùng chung giữa các chi nhánh."
              linkTo="/branches"
              linkLabel="Xem tất cả chi nhánh"
            />

            {branchesLoading ? (
              <SkeletonCards count={3} label="Đang tải danh sách chi nhánh" className="mt-8" />
            ) : (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featuredBranches.map((branch) => (
                  <BranchCard key={branch.id} branch={branch} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <AiConsultSection />

      <section className="border-t border-border bg-primary-soft">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-12">
          <div className="max-w-xl">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Sẵn sàng đặt lịch cho bé nhà bạn?
            </h2>
            <p className="mt-1.5 text-muted">
              Chọn dịch vụ, chi nhánh và khung giờ phù hợp. Đặt lịch không cần tài khoản.
            </p>
          </div>
          <Link
            to="/booking"
            className="inline-flex min-h-touch items-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Đặt lịch khám
          </Link>
        </div>
      </section>
    </>
  );
}
