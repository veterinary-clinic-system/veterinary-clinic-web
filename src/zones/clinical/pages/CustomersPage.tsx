import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import {
  CreateCustomerPayload,
  CustomerListParams,
  customersApi,
} from '@/api/customers.api';
import { Badge, Button, Input, Modal, Select, Table, useToast } from '@/components/basic';
import type { Column, SortOrder } from '@/components/basic';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Customer } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatDate } from '@/utils/format';

const LIMIT = 20;

type ActiveFilter = '' | 'true' | 'false';
type PetsFilter = '' | 'true' | 'false';

interface CustomerFormState {
  phone: string;
  fullName: string;
  email: string;
  password: string;
  dateOfBirth: string;
  address: string;
  note: string;
}

const EMPTY_FORM: CustomerFormState = {
  phone: '',
  fullName: '',
  email: '',
  password: '',
  dateOfBirth: '',
  address: '',
  note: '',
};

/**
 * Danh sách khách hàng của quầy lễ tân: thêm / cập nhật / ngưng hoạt động / tìm kiếm /
 * lọc. Lịch sử giao dịch và danh sách thú cưng nằm ở trang chi tiết
 * (`/staff/customers/:id`) để bảng này không phải tải dữ liệu mà đa số dòng không cần.
 */
export function CustomersPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('');
  const [petsFilter, setPetsFilter] = useState<PetsFilter>('');
  const [branchFilter, setBranchFilter] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerFormState>(EMPTY_FORM);
  const [confirmTarget, setConfirmTarget] = useState<Customer | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });

  const params: CustomerListParams = {
    page,
    limit: LIMIT,
    sortBy,
    sortOrder,
    search: debouncedSearch || undefined,
    active: activeFilter === '' ? undefined : activeFilter === 'true',
    hasPets: petsFilter === '' ? undefined : petsFilter === 'true',
    branchId: branchFilter || undefined,
    createdFrom: createdFrom || undefined,
    createdTo: createdTo || undefined,
  };

  const listQuery = useQuery({
    queryKey: ['customers', params],
    queryFn: () => customersApi.list(params),
    placeholderData: (prev) => prev,
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['customers'] });
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      if (editing) {
        return customersApi.update(editing.id, {
          fullName: form.fullName,
          email: form.email || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          address: form.address || undefined,
          note: form.note || undefined,
        });
      }
      const payload: CreateCustomerPayload = {
        phone: form.phone,
        fullName: form.fullName,
        email: form.email || undefined,
        password: form.password || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        address: form.address || undefined,
        note: form.note || undefined,
      };
      return customersApi.create(payload);
    },
    onSuccess: () => {
      toast.show(editing ? 'Đã cập nhật khách hàng.' : 'Đã thêm khách hàng.', 'success');
      closeForm();
      invalidate();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (customer: Customer) =>
      customer.active ? customersApi.deactivate(customer.id) : customersApi.activate(customer.id),
    onSuccess: (updated) => {
      toast.show(updated.active ? 'Đã kích hoạt lại khách hàng.' : 'Đã ngưng hoạt động.', 'success');
      setConfirmTarget(null);
      invalidate();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditing(customer);
    setForm({
      phone: customer.phone,
      fullName: customer.fullName,
      email: customer.email ?? '',
      password: '',
      dateOfBirth: customer.dateOfBirth ?? '',
      address: customer.address ?? '',
      note: customer.note ?? '',
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

  function resetFilters() {
    setSearch('');
    setActiveFilter('');
    setPetsFilter('');
    setBranchFilter('');
    setCreatedFrom('');
    setCreatedTo('');
    setPage(1);
  }

  const columns: Column<Customer>[] = [
    {
      key: 'customerCode',
      header: 'Mã KH',
      render: (row) => (
        <span className="font-mono text-xs text-muted">{row.customerCode ?? '—'}</span>
      ),
    },
    {
      key: 'fullName',
      header: 'Họ tên',
      sortable: true,
      render: (row) => (
        <Link to={`/staff/customers/${row.id}`} className="font-medium text-primary hover:underline">
          {row.fullName}
        </Link>
      ),
    },
    { key: 'phone', header: 'Số điện thoại', sortable: true },
    { key: 'email', header: 'Email', render: (row) => row.email ?? '—' },
    { key: 'address', header: 'Địa chỉ', render: (row) => row.address ?? '—' },
    {
      key: 'petCount',
      header: 'Thú cưng',
      render: (row) => <span className="tabular-nums">{row.petCount}</span>,
    },
    {
      key: 'lastVisitAt',
      header: 'Lần khám gần nhất',
      render: (row) => (row.lastVisitAt ? formatDate(row.lastVisitAt) : '—'),
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      sortable: true,
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'active',
      header: 'Trạng thái',
      render: (row) => (
        <Badge variant={row.active ? 'success' : 'destructive'}>
          {row.active ? 'Hoạt động' : 'Đã ngưng'}
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
            onClick={() => setConfirmTarget(row)}
          >
            {row.active ? 'Ngưng' : 'Kích hoạt'}
          </Button>
        </div>
      ),
    },
  ];

  const data = listQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Khách hàng</h1>
        <Button onClick={openCreate}>Thêm khách hàng</Button>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded border border-border bg-surface p-4">
        <Input
          label="Tìm kiếm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Mã KH, họ tên, số điện thoại hoặc email…"
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
            { value: 'true', label: 'Đang hoạt động' },
            { value: 'false', label: 'Đã ngưng hoạt động' },
          ]}
        />
        <Select
          label="Thú cưng"
          value={petsFilter}
          onChange={(value) => {
            setPetsFilter(value as PetsFilter);
            setPage(1);
          }}
          options={[
            { value: '', label: 'Tất cả' },
            { value: 'true', label: 'Đã có thú cưng' },
            { value: 'false', label: 'Chưa có thú cưng' },
          ]}
        />
        <Select
          label="Từng khám tại chi nhánh"
          value={branchFilter}
          onChange={(value) => {
            setBranchFilter(value);
            setPage(1);
          }}
          options={[
            { value: '', label: 'Tất cả' },
            ...(branchesQuery.data ?? []).map((b) => ({ value: b.id, label: b.branchName })),
          ]}
        />
        <Input
          label="Tạo từ ngày"
          type="date"
          value={createdFrom}
          onChange={(e) => {
            setCreatedFrom(e.target.value);
            setPage(1);
          }}
        />
        <Input
          label="Đến ngày"
          type="date"
          value={createdTo}
          onChange={(e) => {
            setCreatedTo(e.target.value);
            setPage(1);
          }}
        />
        <Button variant="ghost" onClick={resetFilters}>
          Xóa bộ lọc
        </Button>
      </div>

      <Table
        columns={columns}
        data={data?.data ?? []}
        getRowId={(row) => row.id}
        loading={listQuery.isLoading}
        error={listQuery.isError}
        onRetry={() => void listQuery.refetch()}
        emptyMessage="Không tìm thấy khách hàng nào."
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

      {data && <p className="text-sm text-muted">Tổng {data.total} khách hàng.</p>}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? `Cập nhật: ${editing.fullName}` : 'Thêm khách hàng'}
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>
              Hủy
            </Button>
            <Button type="submit" form="customer-form" loading={saveMutation.isPending}>
              {editing ? 'Lưu thay đổi' : 'Thêm khách hàng'}
            </Button>
          </>
        }
      >
        <form id="customer-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Số điện thoại"
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            // Số điện thoại là định danh đăng nhập và là khóa tra cứu tại quầy - backend
            // cố tình không cho đổi, nên khóa ô này khi đang sửa.
            disabled={Boolean(editing)}
            hint={editing ? 'Không thể đổi số điện thoại của hồ sơ đã tạo.' : undefined}
          />
          <Input
            label="Họ tên"
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <Input
            label="Email (tùy chọn)"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Ngày sinh (tùy chọn)"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
          />
          {!editing && (
            <Input
              label="Mật khẩu (tùy chọn)"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              hint="Bỏ trống nếu khách chỉ đến quầy và không cần tài khoản đăng nhập."
            />
          )}
          <Input
            label="Địa chỉ"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Input
            label="Ghi chú nội bộ"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        title={confirmTarget?.active ? 'Ngưng hoạt động khách hàng' : 'Kích hoạt lại khách hàng'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmTarget(null)}>
              Hủy
            </Button>
            <Button
              variant={confirmTarget?.active ? 'destructive' : 'primary'}
              loading={toggleActiveMutation.isPending}
              onClick={() => confirmTarget && toggleActiveMutation.mutate(confirmTarget)}
            >
              Xác nhận
            </Button>
          </>
        }
      >
        {confirmTarget?.active ? (
          <p className="text-sm">
            <strong>{confirmTarget.fullName}</strong> sẽ không đăng nhập được và không nên được
            đặt lịch mới. Toàn bộ hồ sơ khám, hóa đơn và lịch sử giao dịch vẫn được giữ nguyên và
            tra cứu được — hệ thống không xóa dữ liệu y tế.
          </p>
        ) : (
          <p className="text-sm">
            Kích hoạt lại <strong>{confirmTarget?.fullName}</strong>? Khách sẽ đăng nhập và đặt
            lịch bình thường trở lại.
          </p>
        )}
      </Modal>
    </div>
  );
}
