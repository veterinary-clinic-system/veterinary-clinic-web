import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { isToday, parseISO } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { appointmentsApi } from '@/api/appointments.api';
import { AppointmentStatus } from '@/types/enums';
import { PRIORITY_COLOR_LABEL_VI } from '@/types/enums';
import { formatTime } from '@/utils/format';
import { triageColorClasses } from '@/utils/labels';

const QUICK_LINKS = [
  { to: '/staff/calendar', label: 'Lịch làm việc', desc: 'Xem lịch theo bác sĩ / chi nhánh' },
  { to: '/staff/patients', label: 'Hồ sơ thú cưng', desc: 'Tìm kiếm hồ sơ bệnh nhân' },
  { to: '/staff/appointments', label: 'Lịch hẹn', desc: 'Danh sách & chi tiết lịch hẹn' },
  { to: '/staff/billing', label: 'Hóa đơn', desc: 'Quản lý hóa đơn & thanh toán' },
];

/** Staff landing page: today's appointment count + next upcoming appointments + quick links. */
export function StaffDashboardPage() {
  const { user } = useAuth();
  const branchId = user?.branchId ?? undefined;

  const todayQuery = useQuery({
    queryKey: ['staff-dashboard-today', branchId],
    queryFn: () => appointmentsApi.list({ branchId, limit: 100 }),
  });

  const upcomingQuery = useQuery({
    queryKey: ['staff-dashboard-upcoming', branchId],
    queryFn: () => appointmentsApi.list({ branchId, status: AppointmentStatus.CONFIRMED, limit: 5 }),
  });

  const todayCount =
    todayQuery.data?.data.filter((appt) => isToday(parseISO(appt.startAt))).length ?? undefined;

  const upcoming = [...(upcomingQuery.data?.data ?? [])].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Tổng quan</h1>
        <p className="text-muted">Xin chào, {user?.phone}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded border border-border bg-surface p-5">
          <p className="text-sm text-muted">
            Lịch hẹn hôm nay{user?.branchId ? '' : ' (toàn hệ thống)'}
          </p>
          <p className="mt-2 text-3xl font-semibold">
            {todayQuery.isLoading ? '…' : (todayCount ?? 0)}
          </p>
        </div>
        <div className="rounded border border-border bg-surface p-5">
          <p className="text-sm text-muted">Lịch hẹn đã xác nhận sắp tới</p>
          <p className="mt-2 text-3xl font-semibold">
            {upcomingQuery.isLoading ? '…' : upcoming.length}
          </p>
        </div>
      </div>

      <div className="rounded border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-medium">Lịch hẹn sắp tới</h2>
        </div>
        {upcomingQuery.isLoading ? (
          <p className="p-4 text-muted">Đang tải…</p>
        ) : upcoming.length === 0 ? (
          <p className="p-4 text-muted">Không có lịch hẹn nào sắp tới.</p>
        ) : (
          <ul className="divide-y divide-border">
            {upcoming.map((appt) => (
              <li key={appt.id}>
                <Link
                  to={`/staff/appointments/${appt.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface-muted"
                >
                  <div>
                    <p className="font-medium">
                      {appt.pet?.name ?? 'Thú cưng'} — {appt.service?.item.itemName ?? 'Dịch vụ'}
                    </p>
                    <p className="text-sm text-muted">
                      {formatTime(appt.startAt)} · BS. {appt.doctor?.fullName ?? '—'} ·{' '}
                      {appt.branch?.branchName ?? '—'}
                    </p>
                  </div>
                  {appt.priorityColor && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${triageColorClasses(appt.priorityColor)}`}
                    >
                      {PRIORITY_COLOR_LABEL_VI[appt.priorityColor]}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-medium">Truy cập nhanh</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded border border-border bg-surface p-4 hover:bg-surface-muted"
            >
              <p className="font-medium">{link.label}</p>
              <p className="text-sm text-muted">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
