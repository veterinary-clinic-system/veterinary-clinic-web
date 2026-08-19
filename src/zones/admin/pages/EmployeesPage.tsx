import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import {
  CreateEmployeePayload,
  Employee,
  EmployeeListParams,
  employeesApi,
} from '@/api/employees.api';
import { Badge, Button, Input, Modal, Select, Table, useToast } from '@/components/basic';
import type { Column, SortOrder } from '@/components/basic';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  EMPLOYEE_STATUS_LABEL_VI,
  EmployeeStatus,
  Role,
  BRANCH_SCOPED_ROLES,
} from '@/types/enums';
import { getErrorMessage } from '@/utils/errors';
import { formatDate } from '@/utils/format';
import { ROLE_LABEL_VI } from '@/utils/labels';

const LIMIT = 20;

/** Vai trò tài khoản có thể gán cho một hồ sơ nhân sự. */
const ACCOUNT_ROLES = [Role.ADMIN, ...BRANCH_SCOPED_ROLES];

interface EmployeeFormState {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  position: string;
  branchId: string;
  hireDate: string;
  status: EmployeeStatus;
  note: string;
  createAccount: boolean;
  role: Role;
  password: string;
}

const EMPTY_FORM: EmployeeFormState = {
  fullName: '',
  phone: '',
  email: '',
  address: '',
  position: '',
  branchId: '',
  hireDate: '',
  status: EmployeeStatus.PROBATION,
  note: '',
  createAccount: false,
  role: Role.RECEPTIONIST,
  password: '',
};

/**
 * Hồ sơ nhân sự — SRS FR-22. Khác với trang "Nhân sự" cũ (`/staff/users`) vốn chỉ quản
 * lý **tài khoản đăng nhập**: ở đây quản lý con người, kể cả người không dùng phần mềm.
 */
export function EmployeesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | ''>('');
  const [branchFilter, setBranchFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeFormState>(EMPTY_FORM);

  const debouncedSearch = useDebouncedValue(search, 300);
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });

  const params: EmployeeListParams = {
    page,
    limit: LIMIT,
    sortBy,
    sortOrder,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    branchId: branchFilter || undefined,
  };

  const listQuery = useQuery({
    queryKey: ['employees', params],
    queryFn: () => employeesApi.list(params),
    placeholderData: (prev) => prev,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      if (editing) {
        return employeesApi.update(editing.id, {
          fullName: form.fullName,
          email: form.email || undefined,
          address: form.address || undefined,
          position: form.position || undefined,
          branchId: form.branchId || undefined,
          hireDate: form.hireDate || undefined,
          status: form.status,
          note: form.note || undefined,
        });
      }
      const payload: CreateEmployeePayload = {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email || undefined,
        address: form.address || undefined,
        position: form.position || undefined,
        branchId: form.branchId || undefined,
        hireDate: form.hireDate || undefined,
        status: form.status,
        note: form.note || undefined,
        ...(form.createAccount ? { account: { role: form.role, password: form.password } } : {}),
      };
      return employeesApi.create(payload);
    },
    onSuccess: (employee) => {
      toast.show(
        editing ? 'Đã cập nhật hồ sơ nhân sự.' : `Đã thêm nhân viên ${employee.employeeCode}.`,
        'success',
      );
      closeForm();
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(employee: Employee) {
    setEditing(employee);
    setForm({
      ...EMPTY_FORM,
      fullName: employee.fullName,
      phone: employee.phone,
      email: employee.email ?? '',
      address: employee.address ?? '',
      position: employee.position ?? '',
      branchId: employee.branchId ?? '',
      hireDate: employee.hireDate ?? '',
      status: employee.status,
      note: employee.note ?? '',
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

  const columns: Column<Employee>[] = [
    { key: 'employeeCode', header: 'Mã NV', sortable: true },
    { key: 'fullName', header: 'Họ tên', sortable: true },
    { key: 'phone', header: 'Số điện thoại' },
    { key: 'position', header: 'Chức danh', render: (row) => row.position ?? '—' },
    { key: 'branch', header: 'Chi nhánh', render: (row) => row.branch?.branchName ?? '—' },
    {
      key: 'account',
      header: 'Tài khoản',
      render: (row) =>
        row.user ? (
          <Badge variant="default">{ROLE_LABEL_VI[row.user.role]}</Badge>
        ) : (
          <span className="text-muted">Không có</span>
        ),
    },
    {
      key: 'hireDate',
      header: 'Ngày vào làm',
      sortable: true,
      render: (row) => (row.hireDate ? formatDate(row.hireDate) : '—'),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      sortable: true,
      render: (row) => (
        <Badge variant={statusVariant(row.status)}>{EMPLOYEE_STATUS_LABEL_VI[row.status]}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
          Sửa
        </Button>
      ),
    },
  ];

  const data = listQuery.data;
  const needsBranch = form.createAccount && BRANCH_SCOPED_ROLES.includes(form.role);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Hồ sơ nhân sự</h1>
        <Button onClick={openCreate}>Thêm nhân viên</Button>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded border border-border bg-surface p-4">
        <Input
          label="Tìm kiếm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Họ tên, SĐT hoặc mã nhân viên…"
          className="w-72"
        />
        <Select
          label="Trạng thái"
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value as EmployeeStatus | '');
            setPage(1);
          }}
          options={[
            { value: '', label: 'Tất cả' },
            ...Object.values(EmployeeStatus).map((s) => ({
              value: s,
              label: EMPLOYEE_STATUS_LABEL_VI[s],
            })),
          ]}
        />
        <Select
          label="Chi nhánh"
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
      </div>

      <Table
        columns={columns}
        data={data?.data ?? []}
        getRowId={(row) => row.id}
        loading={listQuery.isLoading}
        emptyMessage="Không tìm thấy nhân viên nào."
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

      {data && <p className="text-sm text-muted">Tổng {data.total} nhân viên.</p>}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? `Sửa hồ sơ: ${editing.employeeCode}` : 'Thêm nhân viên'}
        className="max-w-2xl"
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>
              Hủy
            </Button>
            <Button type="submit" form="employee-form" loading={saveMutation.isPending}>
              {editing ? 'Lưu thay đổi' : 'Thêm nhân viên'}
            </Button>
          </>
        }
      >
        <form id="employee-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Họ tên"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            <Input
              label="Số điện thoại"
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              disabled={Boolean(editing)}
              hint={editing ? 'Không thể đổi số điện thoại của hồ sơ đã tạo.' : undefined}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Chức danh"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              placeholder="Bác sĩ trưởng, Lễ tân ca sáng…"
            />
            <Select
              label="Chi nhánh"
              value={form.branchId}
              onChange={(value) => setForm({ ...form, branchId: value })}
              options={[
                { value: '', label: '— Không gán —' },
                ...(branchesQuery.data ?? []).map((b) => ({ value: b.id, label: b.branchName })),
              ]}
              error={needsBranch && !form.branchId ? 'Vai trò này bắt buộc phải có chi nhánh' : undefined}
            />
            <Input
              label="Ngày vào làm"
              type="date"
              value={form.hireDate}
              onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
            />
            <Select
              label="Trạng thái"
              value={form.status}
              onChange={(value) => setForm({ ...form, status: value as EmployeeStatus })}
              options={Object.values(EmployeeStatus).map((s) => ({
                value: s,
                label: EMPLOYEE_STATUS_LABEL_VI[s],
              }))}
              hint={
                form.status === EmployeeStatus.SUSPENDED || form.status === EmployeeStatus.RESIGNED
                  ? 'Tài khoản đăng nhập liên kết sẽ bị khóa.'
                  : undefined
              }
            />
          </div>

          <Input
            label="Địa chỉ"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Input
            label="Ghi chú"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />

          {!editing && (
            <div className="flex flex-col gap-3 rounded border border-border p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.createAccount}
                  onChange={(e) => setForm({ ...form, createAccount: e.target.checked })}
                />
                Tạo tài khoản đăng nhập
              </label>
              <p className="text-xs text-muted">
                Bỏ trống nếu nhân viên không dùng phần mềm (bảo vệ, tạp vụ…). Có thể tạo tài
                khoản sau.
              </p>
              {form.createAccount && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Select
                    label="Vai trò"
                    value={form.role}
                    onChange={(value) => setForm({ ...form, role: value as Role })}
                    options={ACCOUNT_ROLES.map((r) => ({ value: r, label: ROLE_LABEL_VI[r] }))}
                  />
                  <Input
                    label="Mật khẩu"
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    hint="Tối thiểu 8 ký tự."
                  />
                </div>
              )}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}

function statusVariant(status: EmployeeStatus): 'default' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case EmployeeStatus.ACTIVE:
      return 'success';
    case EmployeeStatus.PROBATION:
      return 'warning';
    case EmployeeStatus.SUSPENDED:
      return 'warning';
    case EmployeeStatus.RESIGNED:
      return 'destructive';
  }
}
