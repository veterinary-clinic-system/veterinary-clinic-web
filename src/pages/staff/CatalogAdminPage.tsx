import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { catalogApi } from '@/api/catalog.api';
import { branchesApi } from '@/api/branches.api';
import { Medication, Service } from '@/types/models';
import { formatCurrency } from '@/utils/format';

type Tab = 'services' | 'medications' | 'diseases' | 'inventory';

const TABS: { id: Tab; label: string }[] = [
  { id: 'services', label: 'Dịch vụ' },
  { id: 'medications', label: 'Thuốc' },
  { id: 'diseases', label: 'Nhóm bệnh' },
  { id: 'inventory', label: 'Tồn kho' },
];

/** Admin-only tabbed catalog management: services, medications, diseases, inventory. */
export function CatalogAdminPage() {
  const [tab, setTab] = useState<Tab>('services');

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Danh mục</h1>

      <div className="flex gap-2 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t.id ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'services' && <ServicesTab />}
      {tab === 'medications' && <MedicationsTab />}
      {tab === 'diseases' && <DiseasesTab />}
      {tab === 'inventory' && <InventoryTab />}
    </div>
  );
}

interface ServiceFormState {
  itemName: string;
  describe: string;
  unitPrice: string;
  durationMinutes: string;
  requiresSpecialization: string;
}

const EMPTY_SERVICE_FORM: ServiceFormState = {
  itemName: '',
  describe: '',
  unitPrice: '',
  durationMinutes: '',
  requiresSpecialization: '',
};

function ServicesTab() {
  const queryClient = useQueryClient();
  const listQuery = useQuery({ queryKey: ['catalog-services'], queryFn: () => catalogApi.services({ limit: 100 }) });
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
        <button type="submit" disabled={createMutation.isPending} className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          Thêm
        </button>
      </form>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-muted text-left">
              <th className="px-3 py-2">Tên</th>
              <th className="px-3 py-2">Mô tả</th>
              <th className="px-3 py-2 text-right">Giá</th>
              <th className="px-3 py-2 text-right">Thời lượng</th>
              <th className="px-3 py-2">Chuyên khoa</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {(listQuery.data?.data ?? []).map((s) =>
              editingId === s.id ? (
                <tr key={s.id} className="border-t border-border bg-surface-muted">
                  <td className="px-3 py-2">
                    <input value={editForm.itemName} onChange={(e) => setEditForm({ ...editForm, itemName: e.target.value })} className="w-full rounded border border-border bg-surface px-2 py-1" />
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
                  <td className="px-3 py-2">{s.item.itemName}</td>
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
    </div>
  );
}

interface MedicationFormState {
  itemName: string;
  describe: string;
  unitPrice: string;
  unit: string;
  activeIngredient: string;
}

const EMPTY_MEDICATION_FORM: MedicationFormState = {
  itemName: '',
  describe: '',
  unitPrice: '',
  unit: '',
  activeIngredient: '',
};

function MedicationsTab() {
  const queryClient = useQueryClient();
  const listQuery = useQuery({ queryKey: ['catalog-medications'], queryFn: () => catalogApi.medications({ limit: 100 }) });
  const [form, setForm] = useState<MedicationFormState>(EMPTY_MEDICATION_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MedicationFormState>(EMPTY_MEDICATION_FORM);

  const createMutation = useMutation({
    mutationFn: () =>
      catalogApi.createMedication({
        itemName: form.itemName,
        describe: form.describe || undefined,
        unitPrice: Number(form.unitPrice) || 0,
        unit: form.unit,
        activeIngredient: form.activeIngredient || undefined,
      }),
    onSuccess: () => {
      setForm(EMPTY_MEDICATION_FORM);
      void queryClient.invalidateQueries({ queryKey: ['catalog-medications'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) =>
      catalogApi.updateMedication(id, {
        itemName: editForm.itemName,
        describe: editForm.describe || undefined,
        unitPrice: Number(editForm.unitPrice) || 0,
        unit: editForm.unit,
        activeIngredient: editForm.activeIngredient || undefined,
      }),
    onSuccess: () => {
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ['catalog-medications'] });
    },
  });

  function startEdit(m: Medication) {
    setEditingId(m.id);
    setEditForm({
      itemName: m.item.itemName,
      describe: m.item.describe ?? '',
      unitPrice: String(m.item.unitPrice),
      unit: m.unit,
      activeIngredient: m.activeIngredient ?? '',
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
        <h2 className="w-full font-medium">Thêm thuốc</h2>
        <input required placeholder="Tên thuốc" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
        <input placeholder="Mô tả" value={form.describe} onChange={(e) => setForm({ ...form, describe: e.target.value })} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
        <input required type="number" placeholder="Giá (VND)" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} className="w-32 rounded border border-border bg-surface px-3 py-2 text-sm" />
        <input required placeholder="Đơn vị (viên, chai…)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-40 rounded border border-border bg-surface px-3 py-2 text-sm" />
        <input placeholder="Hoạt chất (tùy chọn)" value={form.activeIngredient} onChange={(e) => setForm({ ...form, activeIngredient: e.target.value })} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
        <button type="submit" disabled={createMutation.isPending} className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          Thêm
        </button>
      </form>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-muted text-left">
              <th className="px-3 py-2">Tên</th>
              <th className="px-3 py-2">Hoạt chất</th>
              <th className="px-3 py-2 text-right">Giá</th>
              <th className="px-3 py-2">Đơn vị</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {(listQuery.data?.data ?? []).map((m) =>
              editingId === m.id ? (
                <tr key={m.id} className="border-t border-border bg-surface-muted">
                  <td className="px-3 py-2">
                    <input value={editForm.itemName} onChange={(e) => setEditForm({ ...editForm, itemName: e.target.value })} className="w-full rounded border border-border bg-surface px-2 py-1" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={editForm.activeIngredient} onChange={(e) => setEditForm({ ...editForm, activeIngredient: e.target.value })} className="w-full rounded border border-border bg-surface px-2 py-1" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={editForm.unitPrice} onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })} className="w-24 rounded border border-border bg-surface px-2 py-1 text-right" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} className="w-24 rounded border border-border bg-surface px-2 py-1" />
                  </td>
                  <td className="flex gap-2 px-3 py-2">
                    <button type="button" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate(m.id)} className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                      Lưu
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded border border-border px-2 py-1 text-xs">
                      Hủy
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={m.id} className="border-t border-border hover:bg-surface-muted">
                  <td className="px-3 py-2">{m.item.itemName}</td>
                  <td className="px-3 py-2 text-muted">{m.activeIngredient ?? '—'}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(m.item.unitPrice)}</td>
                  <td className="px-3 py-2">{m.unit}</td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => startEdit(m)} className="rounded border border-border px-2 py-1 text-xs hover:bg-surface-muted">
                      Sửa
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface DiseaseGroupLite {
  id: string;
  diseaseName: string;
  describe?: string | null;
}

function DiseasesTab() {
  const listQuery = useQuery({ queryKey: ['catalog-diseases'], queryFn: () => catalogApi.diseases({ limit: 100 }) });
  const raw = listQuery.data as { data?: DiseaseGroupLite[] } | DiseaseGroupLite[] | undefined;
  const diseases: DiseaseGroupLite[] = Array.isArray(raw) ? raw : (raw?.data ?? []);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Danh sách nhóm bệnh dùng cho chẩn đoán và phân tích AI (chỉ xem — quản lý đầy đủ nằm ngoài phạm vi đợt này).
      </p>
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full min-w-[500px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-muted text-left">
              <th className="px-3 py-2">Tên nhóm bệnh</th>
              <th className="px-3 py-2">Mô tả</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isLoading && (
              <tr>
                <td colSpan={2} className="px-3 py-6 text-center text-muted">
                  Đang tải…
                </td>
              </tr>
            )}
            {!listQuery.isLoading && diseases.length === 0 && (
              <tr>
                <td colSpan={2} className="px-3 py-6 text-center text-muted">
                  Không có dữ liệu.
                </td>
              </tr>
            )}
            {diseases.map((d) => (
              <tr key={d.id} className="border-t border-border">
                <td className="px-3 py-2">{d.diseaseName}</td>
                <td className="px-3 py-2 text-muted">{d.describe ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface InventoryRecordLite {
  id?: string;
  itemId: string;
  branchId: string;
  inventoryQuantity: number;
  item?: { itemName: string };
}

function InventoryTab() {
  const queryClient = useQueryClient();
  const [branchId, setBranchId] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });
  const servicesQuery = useQuery({ queryKey: ['catalog-services', 'for-inventory'], queryFn: () => catalogApi.services({ limit: 100 }) });
  const medicationsQuery = useQuery({ queryKey: ['catalog-medications', 'for-inventory'], queryFn: () => catalogApi.medications({ limit: 100 }) });

  const inventoryQuery = useQuery({
    queryKey: ['catalog-inventory', branchId],
    queryFn: () => catalogApi.inventory({ branchId: branchId || undefined, limit: 100 }),
    enabled: !!branchId,
  });
  const raw = inventoryQuery.data as { data?: InventoryRecordLite[] } | InventoryRecordLite[] | undefined;
  const records: InventoryRecordLite[] = Array.isArray(raw) ? raw : (raw?.data ?? []);

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
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="rounded border border-border bg-surface px-3 py-2 text-sm">
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
        </>
      )}
    </div>
  );
}
