import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { Pagination, usePagination } from '@/components/basic';
import { Branch } from '@/types/models';

const PAGE_SIZE = 10;

const WEEKDAYS = [
  { dayOfWeek: 1, label: 'Thứ 2' },
  { dayOfWeek: 2, label: 'Thứ 3' },
  { dayOfWeek: 3, label: 'Thứ 4' },
  { dayOfWeek: 4, label: 'Thứ 5' },
  { dayOfWeek: 5, label: 'Thứ 6' },
];

interface BranchFormState {
  branchName: string;
  phone: string;
  description: string;
  address: string;
}

const EMPTY_FORM: BranchFormState = { branchName: '', phone: '', description: '', address: '' };

/** Admin-only branch management: list, create, inline edit, and per-branch opening hours. */
export function BranchesAdminPage() {
  const queryClient = useQueryClient();
  const listQuery = useQuery({ queryKey: ['branches-admin'], queryFn: () => branchesApi.listAll() });

  // `listAll` trả về toàn bộ chi nhánh trong một lần - cắt trang ở client.
  const branches = listQuery.data ?? [];
  const { page, setPage, pageItems, totalPages } = usePagination(branches, PAGE_SIZE);

  const [form, setForm] = useState<BranchFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<BranchFormState & { active: boolean }>({ ...EMPTY_FORM, active: true });
  const [hoursBranchId, setHoursBranchId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      branchesApi.create({
        branchName: form.branchName,
        phone: form.phone,
        description: form.description || undefined,
        address: form.address,
      }),
    onSuccess: () => {
      setForm(EMPTY_FORM);
      void queryClient.invalidateQueries({ queryKey: ['branches-admin'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) =>
      branchesApi.update(id, {
        branchName: editForm.branchName,
        phone: editForm.phone,
        description: editForm.description || null,
        address: editForm.address,
        active: editForm.active,
      }),
    onSuccess: () => {
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ['branches-admin'] });
    },
  });

  function startEdit(b: Branch) {
    setEditingId(b.id);
    setEditForm({ branchName: b.branchName, phone: b.phone, description: b.description ?? '', address: b.address, active: b.active });
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Chi nhánh</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
        className="flex flex-wrap items-end gap-3 rounded border border-border bg-surface p-4"
      >
        <h2 className="w-full font-medium">Thêm chi nhánh</h2>
        <input required placeholder="Tên chi nhánh" value={form.branchName} onChange={(e) => setForm({ ...form, branchName: e.target.value })} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
        <input required placeholder="Số điện thoại" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
        <input required placeholder="Địa chỉ" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="min-w-[220px] rounded border border-border bg-surface px-3 py-2 text-sm" />
        <input placeholder="Mô tả (tùy chọn)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-w-[220px] rounded border border-border bg-surface px-3 py-2 text-sm" />
        <button type="submit" disabled={createMutation.isPending} className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          Thêm
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {pageItems.map((b) => (
          <div key={b.id} className="rounded border border-border bg-surface p-4">
            {editingId === b.id ? (
              <div className="flex flex-wrap items-end gap-3">
                <input value={editForm.branchName} onChange={(e) => setEditForm({ ...editForm, branchName: e.target.value })} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
                <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
                <input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="min-w-[220px] rounded border border-border bg-surface px-3 py-2 text-sm" />
                <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="min-w-[220px] rounded border border-border bg-surface px-3 py-2 text-sm" />
                <label className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={editForm.active} onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })} />
                  Hoạt động
                </label>
                <button type="button" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate(b.id)} className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground">
                  Lưu
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="rounded border border-border px-3 py-1.5 text-sm">
                  Hủy
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {b.branchName}{' '}
                    {!b.active && <span className="text-xs font-normal text-destructive">(ngừng hoạt động)</span>}
                  </p>
                  <p className="text-sm text-muted">
                    {b.phone} · {b.address}
                  </p>
                  {b.description && <p className="text-sm text-muted">{b.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => startEdit(b)} className="rounded border border-border px-3 py-1.5 text-sm hover:bg-surface-muted">
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => setHoursBranchId(hoursBranchId === b.id ? null : b.id)}
                    className="rounded border border-border px-3 py-1.5 text-sm hover:bg-surface-muted"
                  >
                    Giờ mở cửa
                  </button>
                </div>
              </div>
            )}

            {hoursBranchId === b.id && <OpeningHoursEditor branch={b} />}
          </div>
        ))}

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          total={branches.length}
        />
      </div>
    </div>
  );
}

function OpeningHoursEditor({ branch }: { branch: Branch }) {
  const queryClient = useQueryClient();

  const [hours, setHours] = useState(() =>
    WEEKDAYS.map((d) => {
      const existing = branch.openingHours?.find((h) => h.dayOfWeek === d.dayOfWeek);
      return { dayOfWeek: d.dayOfWeek, openTime: existing?.openTime ?? '08:00', closeTime: existing?.closeTime ?? '17:00' };
    }),
  );

  const saveMutation = useMutation({
    mutationFn: () => branchesApi.setOpeningHours(branch.id, hours),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['branches-admin'] });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        saveMutation.mutate();
      }}
      className="mt-4 flex flex-col gap-2 border-t border-border pt-4"
    >
      <p className="text-sm text-muted">Chỉ áp dụng Thứ 2 - Thứ 6 (đóng cửa Thứ 7, Chủ nhật).</p>
      {hours.map((h, idx) => (
        <div key={h.dayOfWeek} className="flex items-center gap-3 text-sm">
          <span className="w-16">{WEEKDAYS[idx].label}</span>
          <input
            type="text"
            placeholder="HH:mm"
            value={h.openTime}
            onChange={(e) => setHours((prev) => prev.map((p, i) => (i === idx ? { ...p, openTime: e.target.value } : p)))}
            className="w-24 rounded border border-border bg-surface px-2 py-1"
          />
          <span>—</span>
          <input
            type="text"
            placeholder="HH:mm"
            value={h.closeTime}
            onChange={(e) => setHours((prev) => prev.map((p, i) => (i === idx ? { ...p, closeTime: e.target.value } : p)))}
            className="w-24 rounded border border-border bg-surface px-2 py-1"
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={saveMutation.isPending}
        className="mt-2 w-fit rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saveMutation.isPending ? 'Đang lưu…' : 'Lưu giờ mở cửa'}
      </button>
      {saveMutation.isSuccess && <span className="text-sm text-triage-green">Đã lưu.</span>}
    </form>
  );
}
