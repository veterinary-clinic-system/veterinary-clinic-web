import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { catalogApi } from '@/api/catalog.api';
import { ItemType, Service } from '@/types/models';
import { formatCurrency } from '@/utils/format';
import { CategorySelect, PAGE_SIZE, TabPagination, TabTableStates } from '../shared';

interface ServiceFormState {
  itemName: string;
  describe: string;
  unitPrice: string;
  durationMinutes: string;
  requiresSpecialization: string;
  categoryId: string;
}

const EMPTY_SERVICE_FORM: ServiceFormState = {
  itemName: '',
  describe: '',
  unitPrice: '',
  durationMinutes: '',
  requiresSpecialization: '',
  categoryId: '',
};

export function ServicesTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const listQuery = useQuery({
    queryKey: ['catalog-services', page],
    queryFn: () => catalogApi.services({ page, limit: PAGE_SIZE }),
    // Giữ trang cũ trong lúc tải trang mới - bảng không nhấp nháy về rỗng.
    placeholderData: (prev) => prev,
  });
  const [form, setForm] = useState<ServiceFormState>(EMPTY_SERVICE_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ServiceFormState>(EMPTY_SERVICE_FORM);

  const createMutation = useMutation({
    mutationFn: () =>
      catalogApi.createService({
        itemName: form.itemName,
        describe: form.describe || undefined,
        unitPrice: Number(form.unitPrice) || 0,
        durationMinutes: Number(form.durationMinutes) || 0,
        requiresSpecialization: form.requiresSpecialization || undefined,
        categoryId: form.categoryId || undefined,
      }),
    onSuccess: () => {
      setForm(EMPTY_SERVICE_FORM);
      void queryClient.invalidateQueries({ queryKey: ['catalog-services'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) =>
      catalogApi.updateService(id, {
        itemName: editForm.itemName,
        describe: editForm.describe || undefined,
        unitPrice: Number(editForm.unitPrice) || 0,
        durationMinutes: Number(editForm.durationMinutes) || 0,
        requiresSpecialization: editForm.requiresSpecialization || undefined,
        categoryId: editForm.categoryId || null,
      }),
    onSuccess: () => {
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ['catalog-services'] });
    },
  });

  function startEdit(s: Service) {
    setEditingId(s.id);
    setEditForm({
      itemName: s.item.itemName,
      describe: s.item.describe ?? '',
      unitPrice: String(s.item.unitPrice),
      durationMinutes: String(s.durationMinutes),
      requiresSpecialization: s.requiresSpecialization ?? '',
      categoryId: s.item.categoryId ?? '',
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
        className="flex flex-wrap items-end gap-3 rounded border border-border bg-surface p-4"
      >
        <h2 className="w-full font-medium">Thêm dịch vụ</h2>
        <input required placeholder="Tên dịch vụ" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
        <input placeholder="Mô tả" value={form.describe} onChange={(e) => setForm({ ...form, describe: e.target.value })} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
        <input required type="number" placeholder="Giá (VND)" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} className="w-32 rounded border border-border bg-surface px-3 py-2 text-sm" />
        <input required type="number" placeholder="Thời lượng (phút)" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} className="w-36 rounded border border-border bg-surface px-3 py-2 text-sm" />
        <input placeholder="Chuyên khoa yêu cầu (tùy chọn)" value={form.requiresSpecialization} onChange={(e) => setForm({ ...form, requiresSpecialization: e.target.value })} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
        <CategorySelect
          itemType={ItemType.SERVICE}
          value={form.categoryId}
          onChange={(value) => setForm({ ...form, categoryId: value })}
        />
        <button type="submit" disabled={createMutation.isPending} className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          Thêm
        </button>
      </form>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-muted text-left">
              <th className="px-3 py-2">Mã</th>
              <th className="px-3 py-2">Tên</th>
              <th className="px-3 py-2">Danh mục</th>
              <th className="px-3 py-2">Mô tả</th>
              <th className="px-3 py-2 text-right">Giá</th>
              <th className="px-3 py-2 text-right">Thời lượng</th>
              <th className="px-3 py-2">Chuyên khoa</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            <TabTableStates
              loading={listQuery.isLoading}
              error={listQuery.isError}
              onRetry={() => void listQuery.refetch()}
              isEmpty={(listQuery.data?.data ?? []).length === 0}
              colSpan={8}
              emptyMessage="Chưa có dịch vụ nào trong danh mục."
            />
            {(listQuery.data?.data ?? []).map((s) =>
              editingId === s.id ? (
                <tr key={s.id} className="border-t border-border bg-surface-muted">
                  <td className="px-3 py-2 font-mono text-xs text-muted">{s.item.code}</td>
                  <td className="px-3 py-2">
                    <input value={editForm.itemName} onChange={(e) => setEditForm({ ...editForm, itemName: e.target.value })} className="w-full rounded border border-border bg-surface px-2 py-1" />
                  </td>
                  <td className="px-3 py-2">
                    <CategorySelect
                      itemType={ItemType.SERVICE}
                      label=""
                      value={editForm.categoryId}
                      onChange={(value) => setEditForm({ ...editForm, categoryId: value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input value={editForm.describe} onChange={(e) => setEditForm({ ...editForm, describe: e.target.value })} className="w-full rounded border border-border bg-surface px-2 py-1" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={editForm.unitPrice} onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })} className="w-24 rounded border border-border bg-surface px-2 py-1 text-right" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={editForm.durationMinutes} onChange={(e) => setEditForm({ ...editForm, durationMinutes: e.target.value })} className="w-20 rounded border border-border bg-surface px-2 py-1 text-right" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={editForm.requiresSpecialization} onChange={(e) => setEditForm({ ...editForm, requiresSpecialization: e.target.value })} className="w-full rounded border border-border bg-surface px-2 py-1" />
                  </td>
                  <td className="flex gap-2 px-3 py-2">
                    <button type="button" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate(s.id)} className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                      Lưu
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded border border-border px-2 py-1 text-xs">
                      Hủy
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={s.id} className="border-t border-border hover:bg-surface-muted">
                  <td className="px-3 py-2 font-mono text-xs text-muted">{s.item.code}</td>
                  <td className="px-3 py-2">{s.item.itemName}</td>
                  <td className="px-3 py-2 text-muted">{s.item.category?.categoryName ?? '—'}</td>
                  <td className="px-3 py-2 text-muted">{s.item.describe ?? '—'}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(s.item.unitPrice)}</td>
                  <td className="px-3 py-2 text-right">{s.durationMinutes} phút</td>
                  <td className="px-3 py-2">{s.requiresSpecialization ?? '—'}</td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => startEdit(s)} className="rounded border border-border px-2 py-1 text-xs hover:bg-surface-muted">
                      Sửa
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      <TabPagination page={page} total={listQuery.data?.total ?? 0} onPageChange={setPage} />
    </div>
  );
}
