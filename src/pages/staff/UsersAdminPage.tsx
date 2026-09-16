import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { doctorsApi, usersApi } from '@/api/doctors.api';
import { Role, Specialization } from '@/types/enums';
import { StaffUser } from '@/types/models';
import { ROLE_LABEL_VI, SPECIALIZATION_LABEL_VI } from '@/utils/labels';

type Tab = 'staff' | 'shifts';

const STAFF_ROLES = [Role.DOCTOR, Role.RECEPTIONIST, Role.ADMIN];
const WEEKDAYS = [
  { dayOfWeek: 1, label: 'Thứ 2' },
  { dayOfWeek: 2, label: 'Thứ 3' },
  { dayOfWeek: 3, label: 'Thứ 4' },
  { dayOfWeek: 4, label: 'Thứ 5' },
  { dayOfWeek: 5, label: 'Thứ 6' },
];

/** Admin-only: staff accounts CRUD + doctor shift/break scheduling. */
export function UsersAdminPage() {
  const [tab, setTab] = useState<Tab>('staff');

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nhân sự</h1>

      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setTab('staff')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'staff' ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-foreground'}`}
        >
          Tài khoản nhân viên
        </button>
        <button
          type="button"
          onClick={() => setTab('shifts')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'shifts' ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-foreground'}`}
        >
          Ca làm việc bác sĩ
        </button>
      </div>

      {tab === 'staff' && <StaffAccountsTab />}
      {tab === 'shifts' && <DoctorShiftsTab />}
    </div>
  );
}

interface StaffFormState {
  phone: string;
  fullName: string;
  email: string;
  password: string;
  role: Role;
  branchId: string;
  yearOfStart: string;
  specialization: Specialization[];
}

const EMPTY_STAFF_FORM: StaffFormState = {
  phone: '',
  fullName: '',
  email: '',
  password: '',
  role: Role.RECEPTIONIST,
  branchId: '',
  yearOfStart: '',
  specialization: [],
};

function StaffAccountsTab() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [branchFilter, setBranchFilter] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<StaffFormState>(EMPTY_STAFF_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editActive, setEditActive] = useState(true);
  const [editBranchId, setEditBranchId] = useState('');

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });

  const listQuery = useQuery({
    queryKey: ['staff-users', roleFilter, branchFilter, page],
    queryFn: () => usersApi.list({ page, limit: 20, role: roleFilter || undefined, branchId: branchFilter || undefined }),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      usersApi.create({
        phone: form.phone,
        fullName: form.fullName,
        email: form.email || undefined,
        password: form.password,
        role: form.role,
        branchId: form.role === Role.ADMIN ? undefined : form.branchId,
        yearOfStart: form.role === Role.DOCTOR ? Number(form.yearOfStart) || undefined : undefined,
        specialization: form.role === Role.DOCTOR ? form.specialization : undefined,
      }),
    onSuccess: () => {
      setForm(EMPTY_STAFF_FORM);
      void queryClient.invalidateQueries({ queryKey: ['staff-users'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) => usersApi.update(id, { active: editActive, branchId: editBranchId || null }),
    onSuccess: () => {
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ['staff-users'] });
    },
  });

  function startEdit(u: StaffUser) {
    setEditingId(u.id);
    setEditActive(u.active);
    setEditBranchId(u.branchId ?? '');
  }

  function toggleSpecialization(spec: Specialization) {
    setForm((prev) => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter((s) => s !== spec)
        : [...prev.specialization, spec],
    }));
  }

  const data = listQuery.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
        className="flex flex-col gap-3 rounded border border-border bg-surface p-4"
      >
        <h2 className="font-medium">Thêm nhân viên</h2>
        <div className="flex flex-wrap items-end gap-3">
          <input required placeholder="Số điện thoại" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
          <input required placeholder="Họ tên" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
          <input type="email" placeholder="Email (tùy chọn)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
          <input required type="password" placeholder="Mật khẩu" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            className="rounded border border-border bg-surface px-3 py-2 text-sm"
          >
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL_VI[r]}
              </option>
            ))}
          </select>
          {form.role !== Role.ADMIN && (
            <select required value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className="rounded border border-border bg-surface px-3 py-2 text-sm">
              <option value="">— Chi nhánh —</option>
              {(branchesQuery.data ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branchName}
                </option>
              ))}
            </select>
          )}
          {form.role === Role.DOCTOR && (
            <input type="number" placeholder="Năm bắt đầu hành nghề" value={form.yearOfStart} onChange={(e) => setForm({ ...form, yearOfStart: e.target.value })} className="w-44 rounded border border-border bg-surface px-3 py-2 text-sm" />
          )}
        </div>
        {form.role === Role.DOCTOR && (
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="text-muted">Chuyên khoa:</span>
            {Object.values(Specialization).map((spec) => (
              <label key={spec} className="flex items-center gap-1.5">
                <input type="checkbox" checked={form.specialization.includes(spec)} onChange={() => toggleSpecialization(spec)} />
                {SPECIALIZATION_LABEL_VI[spec]}
              </label>
            ))}
          </div>
        )}
        <button type="submit" disabled={createMutation.isPending} className="w-fit rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          Thêm nhân viên
        </button>
        {createMutation.isError && <p className="text-sm text-destructive">Có lỗi xảy ra, vui lòng kiểm tra lại thông tin.</p>}
      </form>

      <div className="flex flex-wrap items-end gap-4 rounded border border-border bg-surface p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Vai trò</span>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value as Role | ''); setPage(1); }} className="rounded border border-border bg-surface px-3 py-2 text-sm">
            <option value="">Tất cả</option>
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL_VI[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Chi nhánh</span>
          <select value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }} className="rounded border border-border bg-surface px-3 py-2 text-sm">
            <option value="">Tất cả</option>
            {(branchesQuery.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.branchName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-muted text-left">
              <th className="px-3 py-2">Họ tên</th>
              <th className="px-3 py-2">SĐT</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Vai trò</th>
              <th className="px-3 py-2">Chi nhánh</th>
              <th className="px-3 py-2">Trạng thái</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {data?.data.map((u) =>
              editingId === u.id ? (
                <tr key={u.id} className="border-t border-border bg-surface-muted">
                  <td className="px-3 py-2">{u.fullName}</td>
                  <td className="px-3 py-2">{u.phone}</td>
                  <td className="px-3 py-2">{u.email ?? '—'}</td>
                  <td className="px-3 py-2">{ROLE_LABEL_VI[u.role]}</td>
                  <td className="px-3 py-2">
                    {u.role !== Role.ADMIN && (
                      <select value={editBranchId} onChange={(e) => setEditBranchId(e.target.value)} className="rounded border border-border bg-surface px-2 py-1 text-sm">
                        <option value="">—</option>
                        {(branchesQuery.data ?? []).map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.branchName}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                      Hoạt động
                    </label>
                  </td>
                  <td className="flex gap-2 px-3 py-2">
                    <button type="button" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate(u.id)} className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                      Lưu
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded border border-border px-2 py-1 text-xs">
                      Hủy
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={u.id} className="border-t border-border hover:bg-surface-muted">
                  <td className="px-3 py-2">{u.fullName}</td>
                  <td className="px-3 py-2">{u.phone}</td>
                  <td className="px-3 py-2">{u.email ?? '—'}</td>
                  <td className="px-3 py-2">{ROLE_LABEL_VI[u.role]}</td>
                  <td className="px-3 py-2">{(branchesQuery.data ?? []).find((b) => b.id === u.branchId)?.branchName ?? '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.active ? 'bg-triage-green/10 text-triage-green' : 'bg-destructive/10 text-destructive'}`}>
                      {u.active ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => startEdit(u)} className="rounded border border-border px-2 py-1 text-xs hover:bg-surface-muted">
                      Sửa
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            Trang {data.page} / {totalPages} — tổng {data.total} nhân viên
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-border px-3 py-1 hover:bg-surface-muted disabled:opacity-50">
              Trước
            </button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded border border-border px-3 py-1 hover:bg-surface-muted disabled:opacity-50">
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DoctorShiftsTab() {
  const [doctorId, setDoctorId] = useState('');
  const doctorsQuery = useQuery({ queryKey: ['doctors-public', 'all'], queryFn: () => doctorsApi.listPublic() });

  return (
    <div className="flex flex-col gap-6">
      <label className="flex max-w-sm flex-col gap-1 text-sm">
        <span className="text-muted">Bác sĩ</span>
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="rounded border border-border bg-surface px-3 py-2 text-sm">
          <option value="">— Chọn bác sĩ —</option>
          {(doctorsQuery.data ?? []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.fullName} — {d.branch.branchName}
            </option>
          ))}
        </select>
      </label>

      {doctorId && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ShiftsPanel doctorId={doctorId} />
          <BreaksPanel doctorId={doctorId} />
        </div>
      )}
    </div>
  );
}

function ShiftsPanel({ doctorId }: { doctorId: string }) {
  const queryClient = useQueryClient();
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');

  const shiftsQuery = useQuery({ queryKey: ['doctor-shifts', doctorId], queryFn: () => doctorsApi.getShifts(doctorId) });

  const createMutation = useMutation({
    mutationFn: () => doctorsApi.createShift(doctorId, { dayOfWeek, startTime, endTime }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['doctor-shifts', doctorId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (shiftId: string) => doctorsApi.deleteShift(shiftId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['doctor-shifts', doctorId] }),
  });

  return (
    <section className="rounded border border-border bg-surface p-4">
      <h2 className="mb-3 font-medium">Ca làm việc theo tuần</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
        className="mb-4 flex flex-wrap items-end gap-2"
      >
        <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} className="rounded border border-border bg-surface px-2 py-1.5 text-sm">
          {WEEKDAYS.map((d) => (
            <option key={d.dayOfWeek} value={d.dayOfWeek}>
              {d.label}
            </option>
          ))}
        </select>
        <input value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="HH:mm" className="w-24 rounded border border-border bg-surface px-2 py-1.5 text-sm" />
        <span>—</span>
        <input value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="HH:mm" className="w-24 rounded border border-border bg-surface px-2 py-1.5 text-sm" />
        <button type="submit" disabled={createMutation.isPending} className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50">
          Thêm ca
        </button>
      </form>

      <ul className="flex flex-col gap-2 text-sm">
        {(shiftsQuery.data ?? []).map((s) => (
          <li key={s.id} className="flex items-center justify-between rounded border border-border px-3 py-2">
            <span>
              {WEEKDAYS.find((d) => d.dayOfWeek === s.dayOfWeek)?.label ?? `Thứ ${s.dayOfWeek}`}: {s.startTime} — {s.endTime}
            </span>
            <button type="button" onClick={() => deleteMutation.mutate(s.id)} className="text-xs text-destructive hover:underline">
              Xóa
            </button>
          </li>
        ))}
        {(shiftsQuery.data ?? []).length === 0 && <li className="text-muted">Chưa có ca làm việc.</li>}
      </ul>
    </section>
  );
}

function BreaksPanel({ doctorId }: { doctorId: string }) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('13:00');
  const [reason, setReason] = useState('');

  const breaksQuery = useQuery({ queryKey: ['doctor-breaks', doctorId], queryFn: () => doctorsApi.getBreaks(doctorId) });

  const createMutation = useMutation({
    mutationFn: () => doctorsApi.createBreak(doctorId, { date, startTime, endTime, reason: reason || undefined }),
    onSuccess: () => {
      setReason('');
      void queryClient.invalidateQueries({ queryKey: ['doctor-breaks', doctorId] });
    },
  });

  return (
    <section className="rounded border border-border bg-surface p-4">
      <h2 className="mb-3 font-medium">Nghỉ ngoài lịch</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (date) createMutation.mutate();
        }}
        className="mb-4 flex flex-wrap items-end gap-2"
      >
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded border border-border bg-surface px-2 py-1.5 text-sm" />
        <input value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="HH:mm" className="w-24 rounded border border-border bg-surface px-2 py-1.5 text-sm" />
        <span>—</span>
        <input value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="HH:mm" className="w-24 rounded border border-border bg-surface px-2 py-1.5 text-sm" />
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Lý do (tùy chọn)" className="rounded border border-border bg-surface px-2 py-1.5 text-sm" />
        <button type="submit" disabled={createMutation.isPending || !date} className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50">
          Thêm
        </button>
      </form>

      <ul className="flex flex-col gap-2 text-sm">
        {(breaksQuery.data ?? []).map((b) => (
          <li key={b.id} className="rounded border border-border px-3 py-2">
            {b.date}: {b.startTime} — {b.endTime} {b.reason && <span className="text-muted">({b.reason})</span>}
          </li>
        ))}
        {(breaksQuery.data ?? []).length === 0 && <li className="text-muted">Chưa có lịch nghỉ.</li>}
      </ul>
    </section>
  );
}
