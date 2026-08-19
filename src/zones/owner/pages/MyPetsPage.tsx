import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/appointments.api';
import { petsApi } from '@/api/pets.api';
import {
  EmptyState,
  Pagination,
  SkeletonCards,
  usePagination,
} from '@/components/basic';
import { QueryErrorState } from '@/components/QueryErrorState';
import { AppointmentStatus } from '@/types/enums';
import { Appointment } from '@/types/models';
import { PetCard } from '../components/PetCard';

const PAGE_SIZE = 12;

/** Trạng thái còn "sắp diễn ra" - đã xong hoặc đã huỷ thì không phải lịch hẹn tới. */
const UPCOMING_STATUSES = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.CHECKED_IN,
];

/**
 * Với mỗi thú cưng, tìm lịch hẹn sắp tới GẦN NHẤT.
 *
 * Tính ở client từ `/appointments/mine` thay vì gọi thêm một API cho từng bé: chủ nuôi
 * có vài con, danh sách lịch hẹn của họ về trọn trong một lần, và N+1 request chỉ để
 * hiện một dòng trên mỗi thẻ là cái giá không đáng.
 */
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

/**
 * "Thú cưng của tôi" - trang chủ thật sự của chủ nuôi.
 *
 * Đây là màn hình họ mở đầu tiên, nên nó phải trả lời ngay: các bé nhà tôi thế nào, có
 * gì cần lưu ý, sắp tới có hẹn nào không. Không có bảng dữ liệu, không có biểu đồ -
 * đây là trải nghiệm khách hàng, không phải bảng điều khiển (xem
 * `docs/01-thong-tin-kien-truc.md` mục 2.2).
 */
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

  // `GET /pets/mine` trả toàn bộ thú cưng của chủ nuôi trong một lần - cắt trang ở
  // client là đủ và không cần thêm một cửa API có phân trang.
  const { page, setPage, pageItems, totalPages } = usePagination(pets ?? [], PAGE_SIZE);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Thú cưng của tôi</h1>
          <p className="mt-1 text-muted">
            Hồ sơ sức khoẻ, lịch sử khám và lịch hẹn của từng bé.
          </p>
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
