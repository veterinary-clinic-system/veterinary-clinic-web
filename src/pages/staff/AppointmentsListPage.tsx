import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { branchesApi } from '@/api/branches.api';
import { doctorsApi } from '@/api/doctors.api';
import { appointmentsApi } from '@/api/appointments.api';
import { AppointmentStatus, PRIORITY_COLOR_LABEL_VI } from '@/types/enums';
import { formatDateTime } from '@/utils/format';
import { APPOINTMENT_STATUS_LABEL_VI, triageColorClasses } from '@/utils/labels';

const LIMIT = 20;

/** Paginated, filterable appointment list for Receptionist/Doctor/Admin. */
export function AppointmentsListPage() {
  const { user } = useAuth();
  const [branchId, setBranchId] = useState(user?.branchId ?? '');
  const [doctorId, setDoctorId] = useState('');
  const [status, setStatus] = useState<AppointmentStatus | ''>('');
  const [page, setPage] = useState(1);

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });
  const doctorsQuery = useQuery({
    queryKey: ['doctors-public', branchId],
    queryFn: () => doctorsApi.listPublic(branchId || undefined),
  });

  const listQuery = useQuery({
    queryKey: ['appointments-list', branchId, doctorId, status, page],
    queryFn: () =>
      appointmentsApi.list({
        page,
        limit: LIMIT,
        branchId: branchId || undefined,
        doctorId: doctorId || undefined,
        status: status || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const data = listQuery.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Lịch hẹn</h1>

      <div className="flex flex-wrap items-end gap-4 rounded border border-border bg-surface p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Chi nhánh</span>
          <select
            value={branchId}
            onChange={(e) => {
              setBranchId(e.target.value);
              setDoctorId('');
              setPage(1);
            }}
            className="rounded border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">Tất cả chi nhánh</option>
            {(branchesQuery.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.branchName}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Bác sĩ</span>
          <select
            value={doctorId}
            onChange={(e) => {
              setDoctorId(e.target.value);
              setPage(1);
            }}
            className="rounded border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">Tất cả bác sĩ</option>
            {(doctorsQuery.data ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Trạng thái</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as AppointmentStatus | '');
              setPage(1);
            }}
            className="rounded border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.values(AppointmentStatus).map((s) => (
              <option key={s} value={s}>
                {APPOINTMENT_STATUS_LABEL_VI[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full min-w-[1000px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-muted text-left">
              <th className="px-3 py-2">Thú cưng</th>
              <th className="px-3 py-2">SĐT chủ nuôi</th>
              <th className="px-3 py-2">Bác sĩ</th>
              <th className="px-3 py-2">Chi nhánh</th>
              <th className="px-3 py-2">Dịch vụ</th>
              <th className="px-3 py-2">Bắt đầu</th>
              <th className="px-3 py-2">Trạng thái</th>
              <th className="px-3 py-2">Mức độ</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isLoading && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted">
                  Đang tải…
                </td>
              </tr>
            )}
            {!listQuery.isLoading && (data?.data.length ?? 0) === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted">
                  Không có lịch hẹn nào.
                </td>
              </tr>
            )}
            {data?.data.map((appt) => (
              <tr key={appt.id} className="border-t border-border hover:bg-surface-muted">
                <td className="px-3 py-2">
                  <Link to={`/staff/appointments/${appt.id}`} className="font-medium text-primary hover:underline">
                    {appt.pet?.name ?? '—'}
                  </Link>
                </td>
                <td className="px-3 py-2">{appt.pet?.owner?.phone ?? '—'}</td>
                <td className="px-3 py-2">{appt.doctor?.fullName ?? '—'}</td>
                <td className="px-3 py-2">{appt.branch?.branchName ?? '—'}</td>
                <td className="px-3 py-2">{appt.service?.item.itemName ?? '—'}</td>
                <td className="px-3 py-2">{formatDateTime(appt.startAt)}</td>
                <td className="px-3 py-2">{APPOINTMENT_STATUS_LABEL_VI[appt.status]}</td>
                <td className="px-3 py-2">
                  {appt.priorityColor && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${triageColorClasses(appt.priorityColor)}`}
                    >
                      {PRIORITY_COLOR_LABEL_VI[appt.priorityColor]}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            Trang {data.page} / {totalPages} — tổng {data.total} lịch hẹn
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-border px-3 py-1 hover:bg-surface-muted disabled:opacity-50"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded border border-border px-3 py-1 hover:bg-surface-muted disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
