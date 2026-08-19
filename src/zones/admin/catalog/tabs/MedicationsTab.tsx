import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { catalogApi } from '@/api/catalog.api';
import { suppliersApi } from '@/api/suppliers.api';
import { Button, Input, Modal, Select, Textarea, useToast } from '@/components/basic';
import { ItemType, Medication } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatCurrency } from '@/utils/format';
import { CategorySelect, PAGE_SIZE, TabPagination } from '../shared';

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
export function MedicationsTab() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const listQuery = useQuery({
    queryKey: ['catalog-medications', page],
    queryFn: () => catalogApi.medications({ page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
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

      <TabPagination page={page} total={listQuery.data?.total ?? 0} onPageChange={setPage} />

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
