import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { speciesApi } from '@/api/pets.api';
import { suppliersApi } from '@/api/suppliers.api';
import { vaccinationsApi } from '@/api/vaccinations.api';
import { Button, CheckboxGroup, Input, Modal, Select, Textarea, useToast } from '@/components/basic';
import { ItemType, Vaccine } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatCurrency } from '@/utils/format';
import { CategorySelect, PAGE_SIZE, TabPagination } from '../shared';

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
export function VaccinesTab() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const listQuery = useQuery({
    queryKey: ['catalog-vaccines', page],
    queryFn: () => vaccinationsApi.catalog({ page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
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

      <TabPagination page={page} total={listQuery.data?.total ?? 0} onPageChange={setPage} />

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
