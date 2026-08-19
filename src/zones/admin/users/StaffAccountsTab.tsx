import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { usersApi } from '@/api/doctors.api';
import { Button, DataTable, Icon, Select, StatusBadge } from '@/components/basic';
import type { DataColumn } from '@/components/basic';
import { Role } from '@/types/enums';
import { StaffUser } from '@/types/models';
import { ROLE_LABEL_VI } from '@/utils/labels';
import { StaffAccountModal } from './StaffAccountModal';

const LIMIT = 20;

/**
 * Vai trò lọc được - TẤT CẢ bảy vai trò, kể cả chủ thú cưng.
 *
 * `GET /users` trả về mọi tài khoản chứ không riêng nhân viên, nên một danh sách lọc chỉ
 * có sáu vai trò nhân viên tạo ra tình huống khó chịu: bảng đầy tài khoản "Chủ thú cưng"
 * mà không có cách nào lọc chúng đi, cũng không có cách nào chỉ xem chúng.
 */
const FILTERABLE_ROLES = [
  Role.ADMIN,
  Role.MANAGER,
  Role.DOCTOR,
  Role.RECEPTIONIST,
  Role.PHARMACIST,
  Role.STAFF,
  Role.PET_OWNER,
];

/**
 * Danh sách tài khoản đăng nhập.
 *
 * Dựng trên `DataTable` như mọi danh sách của zone quản trị: một chỗ duy nhất lo thanh
 * công cụ, skeleton, trạng thái rỗng, trạng thái lỗi và phân trang. Bản trước tự dựng
 * `<table>` bằng tay và không có trạng thái nào trong bốn cái đó - khi API hỏng, bảng
 * chỉ đơn giản là trống.
 */
export function StaffAccountsTab() {
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [branchFilter, setBranchFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });

  const listQuery = useQuery({
    queryKey: ['staff-users', roleFilter, branchFilter, page],
    queryFn: () =>
      usersApi.list({
        page,
        limit: LIMIT,
        role: roleFilter || undefined,
        branchId: branchFilter || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(user: StaffUser) {
    setEditing(user);
    setModalOpen(true);
  }

  const branchName = (branchId: string | null) =>
    (branchesQuery.data ?? []).find((branch) => branch.id === branchId)?.branchName ?? '—';

  const columns: DataColumn<StaffUser>[] = [
    {
      key: 'fullName',
      header: 'Họ và tên',
      render: (user) => <span className="font-medium text-foreground">{user.fullName}</span>,
    },
    { key: 'phone', header: 'Số điện thoại' },
    { key: 'email', header: 'Email', hideBelow: 'lg', render: (user) => user.email ?? '—' },
    { key: 'role', header: 'Vai trò', render: (user) => ROLE_LABEL_VI[user.role] },
    {
      key: 'branchId',
      header: 'Chi nhánh',
      hideBelow: 'md',
      /* Quản trị viên không thuộc chi nhánh nào - nói ra thay vì để một gạch ngang. */
      render: (user) => (user.role === Role.ADMIN ? 'Toàn hệ thống' : branchName(user.branchId)),
    },
    {
      key: 'active',
      header: 'Trạng thái',
      render: (user) => (
        <StatusBadge variant={user.active ? 'success' : 'destructive'}>
          {user.active ? 'Hoạt động' : 'Đã khoá'}
        </StatusBadge>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={listQuery.data?.data ?? []}
        getRowId={(user) => user.id}
        loading={listQuery.isLoading}
        error={listQuery.isError}
        onRetry={() => void listQuery.refetch()}
        page={listQuery.data?.page}
        limit={listQuery.data?.limit}
        total={listQuery.data?.total}
        onPageChange={setPage}
        rowActions={(user) => (
          <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
            <Icon name="edit" className="h-4 w-4" />
            Sửa
          </Button>
        )}
        emptyTitle="Không có tài khoản nào khớp bộ lọc"
        emptyDescription="Thử bỏ bớt điều kiện lọc, hoặc tạo tài khoản mới cho nhân viên."
        emptyAction={<Button onClick={openCreate}>Thêm tài khoản</Button>}
        actions={
          <Button onClick={openCreate}>
            <Icon name="plus" className="h-4 w-4" />
            Thêm tài khoản
          </Button>
        }
        toolbar={
          <>
            <Select
              label="Vai trò"
              value={roleFilter}
              onChange={(value) => {
                setRoleFilter(value as Role | '');
                setPage(1);
              }}
              options={[
                { value: '', label: 'Tất cả vai trò' },
                ...FILTERABLE_ROLES.map((role) => ({ value: role, label: ROLE_LABEL_VI[role] })),
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
                { value: '', label: 'Tất cả chi nhánh' },
                ...(branchesQuery.data ?? []).map((branch) => ({
                  value: branch.id,
                  label: branch.branchName,
                })),
              ]}
            />
          </>
        }
      />

      <StaffAccountModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
    </>
  );
}
