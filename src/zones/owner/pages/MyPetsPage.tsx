import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/appointments.api';
import { petsApi } from '@/api/pets.api';
import { EmptyState, Pagination, SkeletonCards, usePagination } from '@/components/basic';
import { QueryErrorState } from '@/components/QueryErrorState';
import { AppointmentStatus } from '@/types/enums';
import { Appointment } from '@/types/models';
import { PetCard } from '../components/PetCard';

const PAGE_SIZE = 12;

const UPCOMING_STATUSES = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.CHECKED_IN,
];

function nextAppointmentByPet(appointments: Appointment[]): Map<string, Appointment> {
  const now = Date.now();
  const map = new Map<string, Appointment>();

  appointments
    .filter(
      (appointment) =>
        UPCOMING_STATUSES.includes(appointment.status) &&
        new Date(appointment.startAt).getTime() >= now,
    )
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .forEach((appointment) => {
      if (!map.has(appointment.petId)) map.set(appointment.petId, appointment);
    });

  return map;
}

export function MyPetsPage() {
  const {
    data: pets,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({ queryKey: ['pets', 'mine'], queryFn: petsApi.mine });

  const { data: appointments } = useQuery({
    queryKey: ['appointments', 'mine'],
    queryFn: appointmentsApi.mine,
  });

  const nextByPet = nextAppointmentByPet(appointments ?? []);

  const { page, setPage, pageItems, totalPages } = usePagination(pets ?? [], PAGE_SIZE);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <section className="owner-welcome">
        <div>
          <span className="care-eyebrow">MỘT GÓC NHỎ, TRỌN YÊU THƯƠNG</span>
          <h2>
            Hôm nay bé nhà bạn
            <br />
            thế nào?
          </h2>
          <p>
            Lưu giữ từng cột mốc, theo dõi từng lần khám.
            <br />
            Chăm sóc bé bắt đầu từ những điều nhỏ nhất.
          </p>
          <Link to="/my/appointments" className="care-text-link">
            Xem lịch hẹn của các bé →
          </Link>
        </div>
        <img
          src="/images/pets-photoreal-v1.png"
          alt="Chó và mèo đồng hành cùng chủ nuôi"
          width="1254"
          height="1254"
        />
      </section>
      <div className="owner-overview">
        <div>
          <small>THÀNH VIÊN NHỎ</small>
          <strong>{isLoading || isError ? '—' : (pets?.length ?? 0)}</strong>
          <span>Hồ sơ thú cưng của bạn</span>
        </div>
        <div>
          <small>LỊCH HẸN GẦN NHẤT</small>
          <strong>{appointments ? nextByPet.size : '—'}</strong>
          <span>Số bé có lịch hẹn sắp tới</span>
        </div>
        <Link to="/booking">
          <small>DÀNH THỜI GIAN CHO BÉ</small>
          <strong>Đặt lịch ↗</strong>
          <span>Chọn bác sĩ và giờ khám phù hợp</span>
        </Link>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Thú cưng của tôi
          </h1>
          <p className="mt-1 text-muted">Hồ sơ sức khoẻ, lịch sử khám và lịch hẹn của từng bé.</p>
        </div>
        <Link
          to="/booking"
          className="inline-flex min-h-touch items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Đặt lịch khám
        </Link>
      </div>

      <div className="mt-8">
        {isError ? (
          <QueryErrorState
            error={error}
            title="Không tải được danh sách thú cưng"
            description="Máy chủ chưa phản hồi. Vui lòng thử lại sau ít phút."
            onRetry={() => void refetch()}
          />
        ) : isLoading ? (
          <SkeletonCards count={3} label="Đang tải danh sách thú cưng" />
        ) : (pets ?? []).length === 0 ? (
          <EmptyState
            icon="🐾"
            title="Bạn chưa có thú cưng nào trong hồ sơ"
            description="Hồ sơ của bé được tạo khi bạn đặt lịch khám lần đầu, hoặc khi lễ tân tiếp nhận tại quầy."
            action={
              <Link
                to="/booking"
                className="inline-flex min-h-touch items-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Đặt lịch khám đầu tiên
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((pet) => (
                <PetCard key={pet.id} pet={pet} nextAppointment={nextByPet.get(pet.id)} />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              total={pets?.length ?? 0}
            />
          </>
        )}
      </div>
    </div>
  );
}
