import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import {
  Button,
  DataTable,
  Icon,
  PageHeader,
  SearchInput,
  Select,
  StatusBadge,
} from '@/components/basic';
import type { DataColumn } from '@/components/basic';
import { Branch } from '@/types/models';
import { groupOpeningHours } from '@/utils/opening-hours';
import { BranchModal } from '../branches/BranchModal';
import { OpeningHoursModal } from '../branches/OpeningHoursModal';

const PAGE_SIZE = 10;

type StatusFilter = '' | 'active' | 'inactive';

/**
 * Chi nhánh - chỉ ADMIN.
 *
 * Trang lắp ráp mỏng: danh sách là `DataTable` như mọi màn hình danh sách của zone quản
 * trị, còn hai việc sửa nằm trong hộp thoại ở `../branches/`. Bản trước tự dựng lấy ô
 * nhập, nút bấm và thẻ chi nhánh bằng lớp Tailwind thô, và không có một trạng thái nào
 * trong ba trạng thái tài liệu kiến trúc bắt buộc: máy chủ hỏng hiện ra y hệt "phòng
 * khám chưa có chi nhánh nào".
 *
 * `GET /branches/admin` trả về toàn bộ chi nhánh trong một lần (số chi nhánh của một
 * phòng khám luôn đếm trên đầu ngón tay), nên lọc, tìm và cắt trang đều làm ở client.
 */
export function BranchesAdminPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [hoursBranch, setHoursBranch] = useState<Branch | null>(null);

  const listQuery = useQuery({
    queryKey: ['branches-admin'],
    queryFn: () => branchesApi.listAll(),
  });

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return (listQuery.data ?? []).filter((branch) => {
      if (status === 'active' && !branch.active) return false;
      if (status === 'inactive' && branch.active) return false;
      if (!keyword) return true;
      return [branch.branchName, branch.address, branch.phone].some((field) =>
        field.toLowerCase().includes(keyword),
      );
    });
  }, [listQuery.data, search, status]);

  /*
    Trang hiện tại có thể vượt quá số trang sau khi lọc (đang ở trang 3, gõ một từ khoá
    chỉ còn 4 kết quả). Kẹp lại khi vẽ thay vì đặt lại state trong effect - ít một vòng
    render, và người dùng bỏ bộ lọc thì quay về đúng trang cũ.
    */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(branch: Branch) {
    setEditing(branch);
    setFormOpen(true);
  }

  const columns: DataColumn<Branch>[] = [
    {
      key: 'branchName',
      header: 'Chi nhánh',
      render: (branch) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{branch.branchName}</span>
          {branch.description && (
            <span className="text-xs text-muted">{branch.description}</span>
          )}
        </div>
      ),
    },
    { key: 'phone', header: 'Điện thoại' },
    { key: 'address', header: 'Địa chỉ', hideBelow: 'md' },
    {
      key: 'openingHours',
      header: 'Giờ mở cửa',
      hideBelow: 'lg',
      /*
        Gộp bằng đúng hàm mà thẻ chi nhánh ở trang công khai dùng - quản trị viên nhìn
        thấy y hệt thứ khách nhìn thấy.
      */
      render: (branch) => {
        const groups = groupOpeningHours(branch.openingHours ?? []);
        if (groups.length === 0) {
          return <span className="text-muted">Chưa đặt giờ</span>;
        }
        return (
          <ul className="flex flex-col">
            {groups.map((group) => (
              <li key={group.days} className="whitespace-nowrap text-xs">
                <span className="text-muted">{group.days}:</span> {group.time}
              </li>
            ))}
          </ul>
        );
      },
    },
    {
      key: 'active',
      header: 'Trạng thái',
      render: (branch) => (
        <StatusBadge variant={branch.active ? 'success' : 'destructive'}>
          {branch.active ? 'Hoạt động' : 'Ngừng hoạt động'}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-stack">
      <PageHeader
        title="Chi nhánh"
        description="Thông tin liên hệ và giờ mở cửa của từng cơ sở. Giờ mở cửa quyết định khung giờ khách đặt lịch được."
      />

      <DataTable
        columns={columns}
        data={pageItems}
        getRowId={(branch) => branch.id}
        loading={listQuery.isLoading}
        error={listQuery.isError}
        onRetry={() => void listQuery.refetch()}
        page={currentPage}
        limit={PAGE_SIZE}
        total={filtered.length}
        onPageChange={setPage}
        rowActions={(branch) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => openEdit(branch)}>
              <Icon name="edit" className="h-4 w-4" />
              Sửa
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setHoursBranch(branch)}>
              <Icon name="clock" className="h-4 w-4" />
              Giờ mở cửa
            </Button>
          </div>
        )}
        emptyTitle={
          search || status ? 'Không có chi nhánh nào khớp bộ lọc' : 'Chưa có chi nhánh nào'
        }
        emptyDescription={
          search || status
            ? 'Thử bỏ bớt điều kiện lọc, hoặc tìm bằng tên khác.'
            : 'Thêm chi nhánh đầu tiên để khách đặt lịch và nhân viên có nơi làm việc.'
        }
        emptyAction={<Button onClick={openCreate}>Thêm chi nhánh</Button>}
        actions={
          <Button onClick={openCreate}>
            <Icon name="plus" className="h-4 w-4" />
            Thêm chi nhánh
          </Button>
        }
        toolbar={
          <>
            <SearchInput
              label="Tìm chi nhánh"
              placeholder="Tên, địa chỉ hoặc số điện thoại"
              value={search}
              onValueChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              className="w-64"
            />
            <Select
              label="Trạng thái"
              value={status}
              onChange={(value) => {
                setStatus(value as StatusFilter);
                setPage(1);
              }}
              options={[
                { value: '', label: 'Tất cả trạng thái' },
                { value: 'active', label: 'Đang hoạt động' },
                { value: 'inactive', label: 'Ngừng hoạt động' },
              ]}
            />
          </>
        }
      />

      <BranchModal open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />

      <OpeningHoursModal
        open={hoursBranch !== null}
        onClose={() => setHoursBranch(null)}
        branch={hoursBranch}
      />
    </div>
  );
}
