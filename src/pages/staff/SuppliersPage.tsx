import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { purchaseOrdersApi } from '@/api/inventory.api';
import { SupplierListParams, suppliersApi } from '@/api/suppliers.api';
import { Badge, Button, Input, Modal, Select, Table, Textarea, useToast } from '@/components/basic';
import type { Column, SortOrder } from '@/components/basic';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { PURCHASE_ORDER_STATUS_LABEL_VI, Supplier } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatCurrency, formatDate } from '@/utils/format';

const LIMIT = 20;

type ActiveFilter = '' | 'true' | 'false';

interface SupplierFormState {
  name: string;
  phone: string;
  email: string;
  address: string;
  contactPerson: string;
  taxCode: string;
  note: string;
}

const EMPTY_FORM: SupplierFormState = {
  name: '',
  phone: '',
  email: '',
  address: '',
  contactPerson: '',
  taxCode: '',
  note: '',
};

/** SRS FR-17 — quản lý nhà cung cấp. */
export function SuppliersPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('ASC');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierFormState>(EMPTY_FORM);
  const [detail, setDetail] = useState<Supplier | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const params: SupplierListParams = {
    page,
    limit: LIMIT,
    sortBy,
    sortOrder,
    search: debouncedSearch || undefined,
    active: activeFilter === '' ? undefined : activeFilter === 'true',
  };

  const listQuery = useQuery({
    queryKey: ['suppliers', params],
    queryFn: () => suppliersApi.list(params),
    placeholderData: (prev) => prev,
  });

  const ordersQuery = useQuery({
    queryKey: ['purchase-orders', 'by-supplier', detail?.id],
    queryFn: () => purchaseOrdersApi.list({ supplierId: detail!.id, limit: 10 }),
    enabled: detail !== null,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        contactPerson: form.contactPerson || undefined,
        taxCode: form.taxCode || undefined,
        note: form.note || undefined,
      };
      return editing ? suppliersApi.update(editing.id, payload) : suppliersApi.create(payload);
    },
    onSuccess: () => {
      toast.show(editing ? 'Đã cập nhật nhà cung cấp.' : 'Đã thêm nhà cung cấp.', 'success');
      closeForm();
      void queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (supplier: Supplier) =>
      suppliersApi.update(supplier.id, { active: !supplier.active }),
    onSuccess: (updated) => {
      toast.show(updated.active ? 'Đã hợp tác lại.' : 'Đã ngưng hợp tác.', 'success');
      void queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      address: supplier.address ?? '',
      contactPerson: supplier.contactPerson ?? '',
      taxCode: supplier.taxCode ?? '',
      note: supplier.note ?? '',
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    saveMutation.mutate();
  }

  const columns: Column<Supplier>[] = [
    {
      key: 'supplierCode',
      header: 'Mã NCC',
      sortable: true,
      render: (row) => <span className="font-mono text-xs text-muted">{row.supplierCode}</span>,
    },
    {
      key: 'name',
      header: 'Tên nhà cung cấp',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => setDetail(row)}
          className="font-medium text-primary hover:underline"
        >
          {row.name}
        </button>
      ),
    },
    { key: 'contactPerson', header: 'Người liên hệ', render: (row) => row.contactPerson ?? '—' },
    { key: 'phone', header: 'Điện thoại', render: (row) => row.phone ?? '—' },
    { key: 'email', header: 'Email', render: (row) => row.email ?? '—' },
    { key: 'taxCode', header: 'Mã số thuế', render: (row) => row.taxCode ?? '—' },
    {
      key: 'active',
      header: 'Trạng thái',
      render: (row) => (
        <Badge variant={row.active ? 'success' : 'destructive'}>
          {row.active ? 'Đang hợp tác' : 'Đã ngưng'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
            Sửa
          </Button>
          <Button
            size="sm"
            variant={row.active ? 'destructive' : 'secondary'}
            onClick={() => toggleActiveMutation.mutate(row)}
          >
            {row.active ? 'Ngưng' : 'Mở lại'}
          </Button>
        </div>
      ),
    },
  ];

  const data = listQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nhà cung cấp</h1>
        <Button onClick={openCreate}>Thêm nhà cung cấp</Button>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded border border-border bg-surface p-4">
        <Input
          label="Tìm kiếm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Tên, mã NCC hoặc số điện thoại…"
          className="w-72"
        />
        <Select
          label="Trạng thái"
          value={activeFilter}
          onChange={(value) => {
            setActiveFilter(value as ActiveFilter);
            setPage(1);
          }}
          options={[
            { value: '', label: 'Tất cả' },
            { value: 'true', label: 'Đang hợp tác' },
            { value: 'false', label: 'Đã ngưng' },
          ]}
        />
        <Button
          variant="ghost"
          onClick={() => {
            setSearch('');
            setActiveFilter('');
            setPage(1);
          }}
        >
          Xóa bộ lọc
        </Button>
      </div>

      <Table
        columns={columns}
        data={data?.data ?? []}
        getRowId={(row) => row.id}
        loading={listQuery.isLoading}
        emptyMessage="Không tìm thấy nhà cung cấp nào."
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(nextSortBy, nextOrder) => {
          setSortBy(nextSortBy);
          setSortOrder(nextOrder);
          setPage(1);
        }}
        page={data?.page}
        limit={data?.limit}
        total={data?.total}
        onPageChange={setPage}
      />

      {data && <p className="text-sm text-muted">Tổng {data.total} nhà cung cấp.</p>}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? `Cập nhật: ${editing.name}` : 'Thêm nhà cung cấp'}
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>
              Hủy
            </Button>
            <Button type="submit" form="supplier-form" loading={saveMutation.isPending}>
              {editing ? 'Lưu thay đổi' : 'Thêm nhà cung cấp'}
            </Button>
          </>
        }
      >
        <form id="supplier-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Tên nhà cung cấp"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Người liên hệ"
              value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
            />
            <Input
              label="Điện thoại"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              hint="10 chữ số, bắt đầu bằng 0."
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Mã số thuế"
              value={form.taxCode}
              onChange={(e) => setForm({ ...form, taxCode: e.target.value })}
            />
          </div>
          <Textarea
            label="Địa chỉ"
            rows={2}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Textarea
            label="Ghi chú"
            rows={2}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          {editing && (
            <p className="text-sm text-muted">
              Mã <span className="font-mono">{editing.supplierCode}</span> do hệ thống sinh và không
              đổi được.
            </p>
          )}
        </form>
      </Modal>

      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail ? `${detail.supplierCode} — ${detail.name}` : ''}
        footer={
          <Button variant="secondary" onClick={() => setDetail(null)}>
            Đóng
          </Button>
        }
      >
        {detail && (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted">Người liên hệ</dt>
              <dd>{detail.contactPerson ?? '—'}</dd>
              <dt className="text-muted">Điện thoại</dt>
              <dd>{detail.phone ?? '—'}</dd>
              <dt className="text-muted">Email</dt>
              <dd>{detail.email ?? '—'}</dd>
              <dt className="text-muted">Địa chỉ</dt>
              <dd>{detail.address ?? '—'}</dd>
              <dt className="text-muted">Mã số thuế</dt>
              <dd>{detail.taxCode ?? '—'}</dd>
              <dt className="text-muted">Ghi chú</dt>
              <dd>{detail.note ?? '—'}</dd>
            </dl>

            <section>
              <h3 className="mb-2 font-medium">Đơn đặt hàng gần đây</h3>
              {/* Chỗ trống của P5 đã được thay bằng dữ liệu thật — `purchase_orders` ra đời ở P6. */}
              <Table
                columns={[
                  {
                    key: 'poCode',
                    header: 'Mã đơn',
                    render: (row) => <span className="font-mono text-xs">{row.poCode}</span>,
                  },
                  { key: 'orderDate', header: 'Ngày đặt', render: (row) => formatDate(row.orderDate) },
                  {
                    key: 'totalAmount',
                    header: 'Tổng tiền',
                    render: (row) => formatCurrency(row.totalAmount),
                  },
                  {
                    key: 'status',
                    header: 'Trạng thái',
                    render: (row) => (
                      <Badge>{PURCHASE_ORDER_STATUS_LABEL_VI[row.status]}</Badge>
                    ),
                  },
                ]}
                data={ordersQuery.data?.data ?? []}
                getRowId={(row) => row.id}
                loading={ordersQuery.isLoading}
                emptyMessage="Chưa có đơn đặt hàng nào cho nhà cung cấp này."
              />
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
}
