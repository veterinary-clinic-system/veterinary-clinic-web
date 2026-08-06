import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { catalogApi } from '@/api/catalog.api';
import { branchesApi } from '@/api/branches.api';
import { categoriesApi } from '@/api/products.api';
import { speciesApi } from '@/api/pets.api';
import { suppliersApi } from '@/api/suppliers.api';
import { vaccinationsApi } from '@/api/vaccinations.api';
import { Button, CheckboxGroup, Input, Modal, Select, Textarea, useToast } from '@/components/basic';
import { ItemType, Medication, Service, Vaccine } from '@/types/models';
import { flattenCategories } from '@/utils/categories';
import { getErrorMessage } from '@/utils/errors';
import { formatCurrency } from '@/utils/format';


/**
 * Ô chọn danh mục dùng chung cho tab Dịch vụ và tab Thuốc.
 *
 * Dùng `Select` với cây đã làm phẳng (thụt đầu dòng theo độ sâu) thay vì `Combobox`
 * như kế hoạch phase gợi ý: cùng cách đã dùng ở `ProductsPage`, và danh mục của một
 * phòng khám là hàng chục dòng chứ không hàng nghìn nên chưa cần ô tìm kiếm. Đổi sang
 * Combobox sau này chỉ phải sửa đúng ở đây.
 */
function CategorySelect({
  itemType,
  value,
  onChange,
  label = 'Danh mục',
}: {
  itemType: ItemType;
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const query = useQuery({
    queryKey: ['categories', itemType],
    queryFn: () => categoriesApi.tree({ itemType }),
  });
  return (
    <Select
      label={label}
      value={value}
      onChange={onChange}
      options={[
        { value: '', label: '— Chưa phân loại —' },
        ...flattenCategories(query.data ?? []),
      ]}
    />
  );
}

type Tab = 'services' | 'medications' | 'vaccines' | 'diseases' | 'inventory';

const TABS: { id: Tab; label: string }[] = [
  { id: 'services', label: 'Dịch vụ' },
  { id: 'medications', label: 'Thuốc' },
  { id: 'vaccines', label: 'Vaccine' },
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
      {tab === 'vaccines' && <VaccinesTab />}
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
    </div>
  );
}

interface MedicationFormState {
  itemName: string;
  describe: string;
  unitPrice: string;
  unit: string;
  activeIngredient: string;
  categoryId: string;
  genericName: string;
  manufacturer: string;
  supplierId: string;
  costPrice: string;
  minimumStock: string;
}

const EMPTY_MEDICATION_FORM: MedicationFormState = {
  itemName: '',
  describe: '',
  unitPrice: '',
  unit: '',
  activeIngredient: '',
  categoryId: '',
  genericName: '',
  manufacturer: '',
  supplierId: '',
  costPrice: '',
  minimumStock: '',
};

/**
 * Thuốc (SRS FR-15).
 *
 * Việc sửa nằm trong **Modal** chứ không sửa tại chỗ trong hàng bảng như trước: P5 bổ
 * sung 6 trường (danh mục, tên gốc, nhà sản xuất, nhà cung cấp, giá vốn, tồn tối
 * thiểu), nhồi thêm 6 ô nhập vào một hàng ngang sẽ không còn dùng được. Bảng giữ vai
 * hiển thị, Modal lo phần nhập — cùng khuôn với `ProductsPage`.
 */
function MedicationsTab() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const listQuery = useQuery({
    queryKey: ['catalog-medications'],
    queryFn: () => catalogApi.medications({ limit: 100 }),
  });
  // `limit` tối đa 100 (PaginationQueryDto phía backend) - gửi 200 sẽ bị trả 400 và ô
  // chọn nhà cung cấp lặng lẽ rỗng.
  const suppliersQuery = useQuery({
    queryKey: ['suppliers', 'for-medication'],
    queryFn: () => suppliersApi.list({ limit: 100 }),
  });
  const supplierOptions = [
    { value: '', label: '— Chưa gán —' },
    ...(suppliersQuery.data?.data ?? []).map((s) => ({ value: s.id, label: s.name })),
  ];

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [form, setForm] = useState<MedicationFormState>(EMPTY_MEDICATION_FORM);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        itemName: form.itemName,
        describe: form.describe || undefined,
        unitPrice: Number(form.unitPrice) || 0,
        unit: form.unit,
        activeIngredient: form.activeIngredient || undefined,
        categoryId: form.categoryId || null,
        genericName: form.genericName || undefined,
        manufacturer: form.manufacturer || undefined,
        supplierId: form.supplierId || null,
        costPrice: Number(form.costPrice) || 0,
        minimumStock: Number(form.minimumStock) || 0,
      };
      return editing
        ? catalogApi.updateMedication(editing.id, payload)
        : catalogApi.createMedication(payload);
    },
    onSuccess: () => {
      toast.show(editing ? 'Đã cập nhật thuốc.' : 'Đã thêm thuốc.', 'success');
      closeForm();
      void queryClient.invalidateQueries({ queryKey: ['catalog-medications'] });
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_MEDICATION_FORM);
    setFormOpen(true);
  }

  function openEdit(m: Medication) {
    setEditing(m);
    setForm({
      itemName: m.item.itemName,
      describe: m.item.describe ?? '',
      unitPrice: String(m.item.unitPrice),
      unit: m.unit,
      activeIngredient: m.activeIngredient ?? '',
      categoryId: m.item.categoryId ?? '',
      genericName: m.genericName ?? '',
      manufacturer: m.manufacturer ?? '',
      supplierId: m.supplierId ?? '',
      costPrice: String(m.costPrice ?? 0),
      minimumStock: String(m.minimumStock ?? 0),
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY_MEDICATION_FORM);
  }

  // Bán lỗ là nghiệp vụ có thật (xả hàng cận hạn) nên chỉ CẢNH BÁO, không chặn.
  const sellingBelowCost =
    form.costPrice !== '' &&
    form.unitPrice !== '' &&
    Number(form.costPrice) > Number(form.unitPrice);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Thuốc</h2>
        <Button onClick={openCreate}>Thêm thuốc</Button>
      </div>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full min-w-[1000px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-muted text-left">
              <th className="px-3 py-2">Mã</th>
              <th className="px-3 py-2">Tên</th>
              <th className="px-3 py-2">Danh mục</th>
              <th className="px-3 py-2">Tên gốc</th>
              <th className="px-3 py-2">Hoạt chất</th>
              <th className="px-3 py-2">Nhà sản xuất</th>
              <th className="px-3 py-2 text-right">Giá bán</th>
              <th className="px-3 py-2 text-right">Giá vốn</th>
              <th className="px-3 py-2">Đơn vị</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {(listQuery.data?.data ?? []).map((m) => (
              <tr key={m.id} className="border-t border-border hover:bg-surface-muted">
                <td className="px-3 py-2 font-mono text-xs text-muted">{m.item.code}</td>
                <td className="px-3 py-2">{m.item.itemName}</td>
                <td className="px-3 py-2 text-muted">{m.item.category?.categoryName ?? '—'}</td>
                <td className="px-3 py-2 text-muted">{m.genericName ?? '—'}</td>
                <td className="px-3 py-2 text-muted">{m.activeIngredient ?? '—'}</td>
                <td className="px-3 py-2 text-muted">{m.manufacturer ?? '—'}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(m.item.unitPrice)}</td>
                <td className="px-3 py-2 text-right text-muted">
                  {formatCurrency(m.costPrice ?? 0)}
                </td>
                <td className="px-3 py-2">{m.unit}</td>
                <td className="px-3 py-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(m)}>
                    Sửa
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? `Cập nhật: ${editing.item.itemName}` : 'Thêm thuốc'}
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>
              Hủy
            </Button>
            <Button type="submit" form="medication-form" loading={saveMutation.isPending}>
              {editing ? 'Lưu thay đổi' : 'Thêm thuốc'}
            </Button>
          </>
        }
      >
        <form
          id="medication-form"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <Input
            label="Tên thuốc"
            required
            value={form.itemName}
            onChange={(e) => setForm({ ...form, itemName: e.target.value })}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Tên gốc (INN)"
              value={form.genericName}
              onChange={(e) => setForm({ ...form, genericName: e.target.value })}
              hint='Tên không mang thương hiệu, ví dụ "Paracetamol".'
            />
            <Input
              label="Hoạt chất"
              value={form.activeIngredient}
              onChange={(e) => setForm({ ...form, activeIngredient: e.target.value })}
            />
            <Input
              label="Nhà sản xuất"
              value={form.manufacturer}
              onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
            />
            <Select
              label="Nhà cung cấp"
              value={form.supplierId}
              onChange={(value) => setForm({ ...form, supplierId: value })}
              options={supplierOptions}
              hint="Chỉ là gợi ý cho đơn nhập hàng, không bắt buộc."
            />
            <CategorySelect
              itemType={ItemType.MEDICATION}
              value={form.categoryId}
              onChange={(value) => setForm({ ...form, categoryId: value })}
            />
            <Input
              label="Đơn vị"
              required
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="viên, chai, ống…"
            />
            <Input
              label="Giá bán (đồng)"
              type="number"
              min={0}
              required
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
            />
            <Input
              label="Giá vốn (đồng)"
              type="number"
              min={0}
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
              error={sellingBelowCost ? 'Giá vốn đang cao hơn giá bán — sẽ bán lỗ.' : undefined}
            />
            <Input
              label="Tồn kho tối thiểu"
              type="number"
              min={0}
              value={form.minimumStock}
              onChange={(e) => setForm({ ...form, minimumStock: e.target.value })}
            />
          </div>
          <Textarea
            label="Mô tả"
            rows={2}
            value={form.describe}
            onChange={(e) => setForm({ ...form, describe: e.target.value })}
          />
          {editing && (
            <p className="text-sm text-muted">
              Mã <span className="font-mono">{editing.item.code}</span> do hệ thống sinh và không
              đổi được. Lô và hạn sử dụng quản lý theo từng lô nhập ở Phase 6.
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
}

interface VaccineFormState {
  itemName: string;
  describe: string;
  unitPrice: string;
  diseasePrevented: string;
  categoryId: string;
  speciesIds: string[];
  doseCount: string;
  intervalDays: string;
  boosterIntervalDays: string;
  manufacturer: string;
  supplierId: string;
  costPrice: string;
  minimumStock: string;
}

const EMPTY_VACCINE_FORM: VaccineFormState = {
  itemName: '',
  describe: '',
  unitPrice: '',
  diseasePrevented: '',
  categoryId: '',
  speciesIds: [],
  doseCount: '1',
  intervalDays: '',
  boosterIntervalDays: '365',
  manufacturer: '',
  supplierId: '',
  costPrice: '',
  minimumStock: '0',
};

/**
 * Danh mục vaccine — SRS FR-12 (P9-T1).
 *
 * Cùng khuôn với tab Thuốc, thêm phần **phác đồ**: số mũi, khoảng cách giữa các mũi và
 * khoảng nhắc lại hằng năm. Ba trường đó là thứ `VaccinationsService` đọc để tính ngày
 * hẹn mũi kế tiếp, nên khai sai ở đây sẽ ra lịch nhắc sai cho mọi mũi tiêm sau đó.
 *
 * "Loài áp dụng" bỏ trống = dùng cho mọi loài (vaccine dại). Chọn loài chỉ để **lọc** ô
 * chọn của bác sĩ khi khám, không phải một ràng buộc cứng ở backend.
 */
function VaccinesTab() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const listQuery = useQuery({
    queryKey: ['catalog-vaccines'],
    queryFn: () => vaccinationsApi.catalog({ limit: 100 }),
  });
  const speciesQuery = useQuery({ queryKey: ['species'], queryFn: () => speciesApi.list() });
  const suppliersQuery = useQuery({
    queryKey: ['suppliers', 'for-vaccine'],
    queryFn: () => suppliersApi.list({ limit: 100 }),
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vaccine | null>(null);
  const [form, setForm] = useState<VaccineFormState>(EMPTY_VACCINE_FORM);

  const doseCount = Number(form.doseCount) || 1;
  // Backend chặn cứng trường hợp này (phác đồ nhiều mũi mà thiếu khoảng cách) - báo
  // ngay tại form để người khai sửa được trước khi bấm lưu.
  const missingInterval = doseCount > 1 && !form.intervalDays;

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        itemName: form.itemName,
        describe: form.describe || undefined,
        unitPrice: Number(form.unitPrice) || 0,
        diseasePrevented: form.diseasePrevented,
        categoryId: form.categoryId || null,
        speciesIds: form.speciesIds,
        doseCount,
        intervalDays: form.intervalDays ? Number(form.intervalDays) : null,
        boosterIntervalDays: form.boosterIntervalDays ? Number(form.boosterIntervalDays) : null,
        manufacturer: form.manufacturer || undefined,
        supplierId: form.supplierId || null,
        costPrice: Number(form.costPrice) || 0,
        minimumStock: Number(form.minimumStock) || 0,
      };
      return editing
        ? vaccinationsApi.updateVaccine(editing.id, payload)
        : vaccinationsApi.createVaccine(payload);
    },
    onSuccess: () => {
      toast.show(editing ? 'Đã cập nhật vaccine.' : 'Đã thêm vaccine.', 'success');
      closeForm();
      void queryClient.invalidateQueries({ queryKey: ['catalog-vaccines'] });
      void queryClient.invalidateQueries({ queryKey: ['vaccines'] });
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_VACCINE_FORM);
    setFormOpen(true);
  }

  function openEdit(vaccine: Vaccine) {
    setEditing(vaccine);
    setForm({
      itemName: vaccine.item.itemName,
      describe: vaccine.item.describe ?? '',
      unitPrice: String(vaccine.item.unitPrice),
      diseasePrevented: vaccine.diseasePrevented,
      categoryId: vaccine.item.categoryId ?? '',
      speciesIds: (vaccine.speciesApplicable ?? []).map((s) => s.id),
      doseCount: String(vaccine.doseCount),
      intervalDays: vaccine.intervalDays === null ? '' : String(vaccine.intervalDays),
      boosterIntervalDays:
        vaccine.boosterIntervalDays === null ? '' : String(vaccine.boosterIntervalDays),
      manufacturer: vaccine.manufacturer ?? '',
      supplierId: vaccine.supplierId ?? '',
      costPrice: String(vaccine.costPrice ?? 0),
      minimumStock: String(vaccine.minimumStock ?? 0),
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY_VACCINE_FORM);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Vaccine</h2>
        <Button onClick={openCreate}>Thêm vaccine</Button>
      </div>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-muted text-left">
              <th className="px-3 py-2">Mã</th>
              <th className="px-3 py-2">Tên</th>
              <th className="px-3 py-2">Phòng bệnh</th>
              <th className="px-3 py-2">Loài áp dụng</th>
              <th className="px-3 py-2">Phác đồ</th>
              <th className="px-3 py-2 text-right">Giá bán</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {(listQuery.data?.data ?? []).map((v) => (
              <tr key={v.id} className="border-t border-border hover:bg-surface-muted">
                <td className="px-3 py-2 font-mono text-xs text-muted">{v.item.code}</td>
                <td className="px-3 py-2">{v.item.itemName}</td>
                <td className="px-3 py-2 text-muted">{v.diseasePrevented}</td>
                <td className="px-3 py-2 text-muted">
                  {(v.speciesApplicable ?? []).length === 0
                    ? 'Mọi loài'
                    : (v.speciesApplicable ?? []).map((s) => s.speciesName).join(', ')}
                </td>
                <td className="px-3 py-2 text-muted">
                  {v.doseCount} mũi
                  {v.intervalDays ? ` · cách ${v.intervalDays} ngày` : ''}
                  {v.boosterIntervalDays ? ` · nhắc mỗi ${v.boosterIntervalDays} ngày` : ''}
                </td>
                <td className="px-3 py-2 text-right">{formatCurrency(v.item.unitPrice)}</td>
                <td className="px-3 py-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(v)}>
                    Sửa
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? `Cập nhật: ${editing.item.itemName}` : 'Thêm vaccine'}
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>
              Hủy
            </Button>
            <Button
              type="submit"
              form="vaccine-form"
              loading={saveMutation.isPending}
              disabled={missingInterval}
            >
              {editing ? 'Lưu thay đổi' : 'Thêm vaccine'}
            </Button>
          </>
        }
      >
        <form
          id="vaccine-form"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <Input
            label="Tên vaccine"
            required
            value={form.itemName}
            onChange={(e) => setForm({ ...form, itemName: e.target.value })}
          />
          <Input
            label="Bệnh phòng ngừa"
            required
            value={form.diseasePrevented}
            onChange={(e) => setForm({ ...form, diseasePrevented: e.target.value })}
            placeholder="Bệnh dại / Care, Parvo, Ho cũi…"
          />
          <CheckboxGroup
            label="Loài áp dụng"
            value={form.speciesIds}
            onChange={(value) => setForm({ ...form, speciesIds: value })}
            options={(speciesQuery.data ?? []).map((s) => ({
              value: s.id,
              label: s.speciesName,
            }))}
          />
          <p className="-mt-2 text-xs text-muted">
            Không chọn loài nào = dùng được cho mọi loài (ví dụ vaccine dại).
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Số mũi của phác đồ"
              type="number"
              min={1}
              required
              value={form.doseCount}
              onChange={(e) => setForm({ ...form, doseCount: e.target.value })}
            />
            <Input
              label="Khoảng cách giữa các mũi (ngày)"
              type="number"
              min={1}
              value={form.intervalDays}
              onChange={(e) => setForm({ ...form, intervalDays: e.target.value })}
              error={missingInterval ? 'Phác đồ nhiều hơn một mũi phải khai khoảng cách.' : undefined}
            />
            <Input
              label="Khoảng nhắc lại (ngày)"
              type="number"
              min={1}
              value={form.boosterIntervalDays}
              onChange={(e) => setForm({ ...form, boosterIntervalDays: e.target.value })}
              hint="Bỏ trống = tiêm đủ phác đồ là xong, không nhắc lại."
            />
            <Input
              label="Nhà sản xuất"
              value={form.manufacturer}
              onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
            />
            <Select
              label="Nhà cung cấp"
              value={form.supplierId}
              onChange={(value) => setForm({ ...form, supplierId: value })}
              options={[
                { value: '', label: '— Chưa gán —' },
                ...(suppliersQuery.data?.data ?? []).map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
            <CategorySelect
              itemType={ItemType.VACCINE}
              value={form.categoryId}
              onChange={(value) => setForm({ ...form, categoryId: value })}
            />
            <Input
              label="Giá bán (đồng)"
              type="number"
              min={0}
              required
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
            />
            <Input
              label="Giá vốn (đồng)"
              type="number"
              min={0}
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
            />
            <Input
              label="Tồn kho tối thiểu"
              type="number"
              min={0}
              value={form.minimumStock}
              onChange={(e) => setForm({ ...form, minimumStock: e.target.value })}
            />
          </div>

          <Textarea
            label="Mô tả"
            rows={2}
            value={form.describe}
            onChange={(e) => setForm({ ...form, describe: e.target.value })}
          />
          <p className="text-sm text-muted">
            Vaccine nằm trong kho như thuốc: lô và hạn sử dụng quản lý theo từng lô nhập (P6), và
            vaccine hết hạn sẽ bị chặn không cho tiêm (BR-11).
          </p>
        </form>
      </Modal>
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
