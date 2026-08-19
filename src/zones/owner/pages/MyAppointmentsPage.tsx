import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/appointments.api';
import { Pagination, TabItem, Tabs, usePagination } from '@/components/basic';
import { QueryErrorState } from '@/components/QueryErrorState';
import { AppointmentGroup, appointmentGroupOf } from '@/utils/appointment-status';
import { AppointmentList } from '../components/AppointmentList';

const PAGE_SIZE = 10;

/**
 * Ba nhóm, không phải năm.
 *
 * Bản trước chia theo `AppointmentStatus` gần như một-một ("Chuẩn bị khám", "Đang tại
 * phòng khám", "Đã khám", "Đã huỷ / không đến"). Chủ nuôi không phân biệt "đã check-in"
 * với "đang khám" - với họ, một lịch hẹn chỉ ở một trong ba trạng thái: **sắp tới**,
 * **đã xong**, **không diễn ra**. Gộp lại còn ba tab giảm số lựa chọn mà không giấu đi
 * thông tin nào: trạng thái chi tiết vẫn hiện trên từng thẻ.
 */
const GROUP_LABELS: Record<AppointmentGroup, string> = {
  upcoming: 'Sắp tới',
  completed: 'Đã khám',
  cancelled: 'Đã huỷ',
};

const EMPTY_TEXT: Record<AppointmentGroup, { title: string; description: string }> = {
  upcoming: {
    title: 'Bạn chưa có lịch hẹn nào sắp tới',
    description: 'Đặt lịch để bác sĩ chuẩn bị trước hồ sơ và dành khung giờ cho bé.',
  },
  completed: {
    title: 'Chưa có buổi khám nào hoàn tất',
    description: 'Sau mỗi buổi khám, chẩn đoán và đơn thuốc sẽ được lưu tại đây.',
  },
  cancelled: {
    title: 'Không có lịch hẹn nào bị huỷ',
    description: 'Các lịch hẹn bạn huỷ hoặc không đến sẽ được ghi lại tại đây.',
  },
};

/**
 * "Lịch hẹn của tôi".
 *
 * Sắp xếp khác nhau theo nhóm, và đó là chủ ý: nhóm **sắp tới** xếp gần nhất lên đầu
 * (việc phải làm sớm nhất), hai nhóm còn lại xếp mới nhất lên đầu (thứ vừa xảy ra).
 * Dùng chung một chiều sắp xếp cho cả ba thì một trong hai luôn sai.
 */
export function MyAppointmentsPage() {
  const [group, setGroup] = useState<AppointmentGroup>('upcoming');

  const {
    data: appointments,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({ queryKey: ['appointments', 'mine'], queryFn: appointmentsApi.mine });

  const grouped = useMemo(() => {
    const buckets: Record<AppointmentGroup, typeof appointments> = {
      upcoming: [],
      completed: [],
      cancelled: [],
    };

    (appointments ?? []).forEach((appointment) => {
      buckets[appointmentGroupOf(appointment.status)]?.push(appointment);
    });

    buckets.upcoming?.sort((a, b) => a.startAt.localeCompare(b.startAt));
    buckets.completed?.sort((a, b) => b.startAt.localeCompare(a.startAt));
    buckets.cancelled?.sort((a, b) => b.startAt.localeCompare(a.startAt));

    return buckets;
  }, [appointments]);

  const current = grouped[group] ?? [];
  const { page, setPage, pageItems, totalPages } = usePagination(current, PAGE_SIZE, [group]);

  const tabs: TabItem<AppointmentGroup>[] = (
    ['upcoming', 'completed', 'cancelled'] as AppointmentGroup[]
  ).map((id) => ({
    id,
    label: GROUP_LABELS[id],
    count: grouped[id]?.length,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Lịch hẹn của tôi</h1>
          <p className="mt-1 text-muted">Theo dõi các buổi khám đã đặt và lịch sử khám của các bé.</p>
        </div>
        <Link
          to="/booking"
          className="inline-flex min-h-touch items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Đặt lịch khám
        </Link>
      </div>

      <Tabs items={tabs} value={group} onChange={setGroup} className="mt-8" />

      <div className="mt-6">
        {isError ? (
          <QueryErrorState
            error={error}
            title="Không tải được danh sách lịch hẹn"
            description="Máy chủ chưa phản hồi. Vui lòng thử lại sau ít phút."
            onRetry={() => void refetch()}
          />
        ) : (
          <>
            <AppointmentList
              appointments={pageItems}
              isLoading={isLoading}
              emptyTitle={EMPTY_TEXT[group].title}
              emptyDescription={EMPTY_TEXT[group].description}
            />
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              total={current.length}
            />
          </>
        )}
      </div>
    </div>
  );
}
