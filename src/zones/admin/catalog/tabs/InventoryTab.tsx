import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { catalogApi } from '@/api/catalog.api';
import { PAGE_SIZE, TabPagination } from '../shared';

interface InventoryRecordLite {
  id?: string;
  itemId: string;
  branchId: string;
  inventoryQuantity: number;
  item?: { itemName: string };
}

export function InventoryTab() {
  const queryClient = useQueryClient();
  const [branchId, setBranchId] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });
  const servicesQuery = useQuery({ queryKey: ['catalog-services', 'for-inventory'], queryFn: () => catalogApi.services({ limit: 100 }) });
  const medicationsQuery = useQuery({ queryKey: ['catalog-medications', 'for-inventory'], queryFn: () => catalogApi.medications({ limit: 100 }) });

  const [page, setPage] = useState(1);
  const inventoryQuery = useQuery({
    queryKey: ['catalog-inventory', branchId, page],
    queryFn: () =>
      catalogApi.inventory({ branchId: branchId || undefined, page, limit: PAGE_SIZE }),
    enabled: !!branchId,
    placeholderData: (prev) => prev,
  });
  const raw = inventoryQuery.data as
    | { data?: InventoryRecordLite[]; total?: number }
    | InventoryRecordLite[]
    | undefined;
  const records: InventoryRecordLite[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
  const total = Array.isArray(raw) ? raw.length : (raw?.total ?? records.length);

  const itemOptions = [
    ...(servicesQuery.data?.data ?? []).map((s) => ({ id: s.itemId, name: `[Dịch vụ] ${s.item.itemName}` })),
    ...(medicationsQuery.data?.data ?? []).map((m) => ({ id: m.itemId, name: `[Thuốc] ${m.item.itemName}` })),
  ];

  const upsertMutation = useMutation({
    mutationFn: () =>
      catalogApi.upsertInventory({ itemId, branchId, inventoryQuantity: Number(quantity) || 0 }),
    onSuccess: () => {
      setItemId('');
      setQuantity('');
      void queryClient.invalidateQueries({ queryKey: ['catalog-inventory', branchId] });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <label className="flex max-w-xs flex-col gap-1 text-sm">
        <span className="text-muted">Chi nhánh</span>
        <select
          value={branchId}
          onChange={(e) => {
            setBranchId(e.target.value);
            setPage(1);
          }}
          className="rounded border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">— Chọn chi nhánh —</option>
          {(branchesQuery.data ?? []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.branchName}
            </option>
          ))}
        </select>
      </label>

      {branchId && (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (itemId) upsertMutation.mutate();
            }}
            className="flex flex-wrap items-end gap-3 rounded border border-border bg-surface p-4"
          >
            <h2 className="w-full font-medium">Cập nhật tồn kho</h2>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Mặt hàng</span>
              <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="min-w-[240px] rounded border border-border bg-surface px-3 py-2 text-sm">
                <option value="">— Chọn mặt hàng —</option>
                {itemOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Số lượng</span>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-32 rounded border border-border bg-surface px-3 py-2 text-sm" />
            </label>
            <button type="submit" disabled={upsertMutation.isPending || !itemId} className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              Lưu
            </button>
          </form>

          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full min-w-[500px] border-collapse text-sm">
              <thead>
                <tr className="bg-surface-muted text-left">
                  <th className="px-3 py-2">Mặt hàng</th>
                  <th className="px-3 py-2 text-right">Số lượng tồn</th>
                </tr>
              </thead>
              <tbody>
                {inventoryQuery.isLoading && (
                  <tr>
                    <td colSpan={2} className="px-3 py-6 text-center text-muted">
                      Đang tải…
                    </td>
                  </tr>
                )}
                {!inventoryQuery.isLoading && records.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-3 py-6 text-center text-muted">
                      Chưa có dữ liệu tồn kho cho chi nhánh này.
                    </td>
                  </tr>
                )}
                {records.map((r) => (
                  <tr key={r.id ?? `${r.itemId}-${r.branchId}`} className="border-t border-border">
                    <td className="px-3 py-2">{r.item?.itemName ?? r.itemId}</td>
                    <td className="px-3 py-2 text-right">{r.inventoryQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TabPagination page={page} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
