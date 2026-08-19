import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { appointmentsApi } from '@/api/appointments.api';
import { queueApi } from '@/api/queue.api';
import { vaccinationsApi } from '@/api/vaccinations.api';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Icon,
  PageHeader,
  StatTile,
  Skeleton,
} from '@/components/basic';
import { useAuth } from '@/context/AuthContext';
import { AppointmentStatus, QueueStatus, Role } from '@/types/enums';
import { formatTime } from '@/utils/format';
import { TodaySchedule } from '../dashboard/TodaySchedule';
import { WaitingList } from '../dashboard/WaitingList';

/** Nhịp làm mới hàng chờ. 30s: hàng chờ đổi từng phút, và trang này luôn mở. */
const QUEUE_POLL_MS = 30_000;

/** Cửa sổ nhắc tiêm hiển thị trên trang tổng quan. */
const VACCINATION_DUE_DAYS = 7;

/**
 * Tổng quan LÂM SÀNG - trang chủ của bác sĩ và lễ tân.
 *
 * Trả lời đúng một câu hỏi: **hôm nay phải làm gì**. Không có doanh thu, không có biểu
 * đồ 30 ngày, không có tồn kho - bác sĩ không ra quyết định nào dựa trên những con số
 * đó, và mỗi thứ thừa trên trang này là một thứ phải nhìn qua mỗi sáng.
 *
 * Bốn khối, xếp theo mức độ khẩn:
 *
 *     Đang chờ  ->  ai đang ngồi ngoài kia, ai được ưu tiên
 *     Lịch hôm nay -> phần còn lại của ngày
 *     Nhắc tiêm ->  việc gọi điện của lễ tân
 *     Lối tắt  ->   các thao tác mở đầu (tiếp nhận khách vãng lai, tìm hồ sơ)
 *
 * Xem `docs/01-thong-tin-kien-truc.md` mục 2.4 để biết vì sao `/staff` là một URL nhưng
 * hai nội dung.
 */
export function ClinicalDashboardPage() {
  const { user } = useAuth();
  const branchId = user?.branchId ?? undefined;
  const isDoctor = user?.role === Role.DOCTOR;
  const today = format(new Date(), 'yyyy-MM-dd');

  const queueQuery = useQuery({
    queryKey: ['queue', 'today', branchId],
    queryFn: () => queueApi.list({ branchId, date: today }),
    refetchInterval: QUEUE_POLL_MS,
  });

  const appointmentsQuery = useQuery({
    queryKey: ['appointments', 'today', branchId, isDoctor ? user?.sub : null],
    queryFn: () =>
      appointmentsApi.list({
        branchId,
        // Bác sĩ chỉ quan tâm ca của chính mình; lễ tân cần thấy cả chi nhánh.
        doctorId: isDoctor ? user?.sub : undefined,
        date: today,
        limit: 50,
        sortBy: 'startAt',
        sortOrder: 'ASC',
      }),
  });

  const vaccinationQuery = useQuery({
    queryKey: ['vaccinations', 'due', branchId, VACCINATION_DUE_DAYS],
    queryFn: () => vaccinationsApi.due({ days: VACCINATION_DUE_DAYS, branchId }),
  });

  const queue = queueQuery.data ?? [];
  const waiting = queue.filter(
    (entry) => entry.status === QueueStatus.WAITING || entry.status === QueueStatus.ASSIGNED,
  );
  const inRoom = queue.filter((entry) => entry.status === QueueStatus.IN_ROOM);
  const appointments = appointmentsQuery.data?.data ?? [];
  const remaining = appointments.filter(
    (appointment) =>
      appointment.status === AppointmentStatus.PENDING ||
      appointment.status === AppointmentStatus.CONFIRMED,
  );
  const completed = appointments.filter(
    (appointment) => appointment.status === AppointmentStatus.COMPLETED,
  );

  return (
    <div className="flex flex-col gap-stack">
      <PageHeader
        title="Hôm nay"
        description={format(new Date(), "EEEE, dd 'tháng' M yyyy", { locale: vi })}
        actions={
          <Link
            to="/staff/queue"
            className="inline-flex min-h-touch items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Icon name="plus" className="h-4 w-4" />
            Tiếp nhận khách
          </Link>
        }
      />

      <section aria-label="Chỉ số hôm nay" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {queueQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[6.5rem] rounded-xl" />
          ))
        ) : (
          <>
            <StatTile
              label="Đang chờ"
              value={waiting.length}
              hint={waiting.length > 0 ? `Sớm nhất lúc ${formatTime(waiting[0].checkedInAt)}` : 'Không có ai chờ'}
              icon="queue"
              tone={waiting.length > 4 ? 'warning' : 'default'}
              to="/staff/queue"
            />
            <StatTile
              label="Đang khám"
              value={inRoom.length}
              hint={inRoom.length > 0 ? inRoom.map((entry) => entry.pet?.name).join(', ') : 'Chưa có ca nào'}
              icon="stethoscope"
              to="/staff/queue"
            />
            <StatTile
              label="Lịch hẹn còn lại"
              value={remaining.length}
              hint={`${completed.length} ca đã hoàn tất hôm nay`}
              icon="calendar"
              to="/staff/appointments"
            />
            <StatTile
              label={`Nhắc tiêm ${VACCINATION_DUE_DAYS} ngày tới`}
              value={vaccinationQuery.data?.length ?? 0}
              hint="Cần gọi nhắc chủ nuôi"
              icon="syringe"
              tone={(vaccinationQuery.data?.length ?? 0) > 0 ? 'warning' : 'default'}
              to="/staff/vaccinations/due"
            />
          </>
        )}
      </section>

      <div className="grid gap-stack xl:grid-cols-[1fr_22rem]">
        <TodaySchedule
          appointments={appointments}
          isLoading={appointmentsQuery.isLoading}
          isError={appointmentsQuery.isError}
          onRetry={() => void appointmentsQuery.refetch()}
        />

        <div className="flex flex-col gap-stack">
          <WaitingList
            entries={waiting}
            isLoading={queueQuery.isLoading}
            isError={queueQuery.isError}
            onRetry={() => void queueQuery.refetch()}
          />

          <Card as="section">
            <CardHeader>
              <CardTitle as="h2">Cần nhắc lịch tiêm</CardTitle>
              <Link
                to="/staff/vaccinations/due"
                className="text-sm font-medium text-primary hover:underline"
              >
                Xem tất cả
              </Link>
            </CardHeader>
            <CardBody className="pt-3">
              {vaccinationQuery.isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (vaccinationQuery.data ?? []).length === 0 ? (
                <EmptyState
                  className="border-0 bg-transparent px-0 py-6"
                  title="Không có mũi nào đến hạn"
                  description={`Trong ${VACCINATION_DUE_DAYS} ngày tới.`}
                />
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {(vaccinationQuery.data ?? []).slice(0, 5).map((row) => (
                    <li key={`${row.petId}-${row.vaccineId}`} className="py-2 first:pt-0 last:pb-0">
                      <Link
                        to={`/staff/patients/${row.petId}`}
                        className="block text-data font-medium text-foreground hover:text-primary"
                      >
                        {row.petName}
                      </Link>
                      <p className="text-xs text-muted">
                        {row.vaccineName} · hạn {row.nextDueDate}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
