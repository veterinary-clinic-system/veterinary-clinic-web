import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { laboratoriesApi } from '@/api/laboratories.api';
import { Badge, Select, Table, usePagination } from '@/components/basic';
import type { Column } from '@/components/basic';
import { LabQueueRow, LabTestStatus } from '@/types/models';
import { formatDateTime } from '@/utils/format';
import { LAB_TEST_STATUS_LABEL_VI } from '@/utils/labels';

const PAGE_SIZE = 20;

export function LaboratoryQueuePage() {
  const [branchId, setBranchId] = useState('');
  const [status, setStatus] = useState<string>('');

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });

  useEffect(() => {
    if (!branchId && branchesQuery.data?.length) {
      setBranchId(branchesQuery.data[0].id);
    }
  }, [branchId, branchesQuery.data]);

  const queueQuery = useQuery({
    queryKey: ['lab-queue', branchId, status],
    queryFn: () =>
      laboratoriesApi.queue({
        branchId: branchId || undefined,
        status: status ? (status as LabTestStatus) : undefined,
      }),
    enabled: Boolean(branchId),
  });

  const rows = queueQuery.data ?? [];
  const { page, setPage, pageItems } = usePagination(rows, PAGE_SIZE, [branchId, status]);

  const columns: Column<LabQueueRow>[] = [
    {
      key: 'orderedAt',
      header: 'Chỉ định lúc',
      width: '160px',
      minWidth: '150px',
      className: 'whitespace-nowrap tabular-nums text-muted',
      render: (row) => formatDateTime(row.orderedAt),
    },
    {
      key: 'pet',
      header: 'Thú cưng',
      width: '180px',
      minWidth: '150px',
      className: 'whitespace-nowrap',
      render: (row) => (
        <Link to={`/staff/patients/${row.petId}`} className="text-primary hover:underline font-medium">
          {row.petName} <span className="font-mono text-xs text-muted font-normal">({row.petCode})</span>
        </Link>
      ),
    },
    {
      key: 'testName',
      header: 'Xét nghiệm',
      width: '220px',
      minWidth: '180px',
      className: 'font-medium text-foreground',
    },
    {
      key: 'doctorName',
      header: 'Bác sĩ chỉ định',
      width: '180px',
      minWidth: '150px',
      className: 'whitespace-nowrap',
      render: (row) => row.doctorName ?? '—',
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '150px',
      minWidth: '130px',
      className: 'whitespace-nowrap',
      render: (row) => (
        <Badge variant={row.status === LabTestStatus.COMPLETED ? 'success' : 'warning'}>
          {LAB_TEST_STATUS_LABEL_VI[row.status]}
        </Badge>
      ),
    },
    {
      key: 'resultCount',
      header: 'Số chỉ số',
      width: '110px',
      minWidth: '100px',
      align: 'center',
      className: 'whitespace-nowrap tabular-nums',
      render: (row) => (row.resultCount > 0 ? row.resultCount : '—'),
    },
    {
      key: 'link',
      header: '',
      width: '110px',
      minWidth: '100px',
      align: 'right',
      className: 'whitespace-nowrap',
      render: (row) => (
        <Link
          to={`/staff/patients/${row.petId}`}
          className="text-sm font-medium text-primary hover:underline"
          title="Mở hồ sơ thú cưng để xem toàn bộ kết quả"
        >
          Xem hồ sơ
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Hàng chờ xét nghiệm</h1>
        <p className="text-muted">
          Yêu cầu chờ lâu nhất nằm trên cùng. Kỹ thuật viên nhập kết quả trong phiếu khám của
          hồ sơ tương ứng.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="Chi nhánh"
          value={branchId}
          onChange={setBranchId}
          options={(branchesQuery.data ?? []).map((branch) => ({
            value: branch.id,
            label: branch.branchName,
          }))}
        />
        <Select
          label="Trạng thái"
          value={status}
          onChange={setStatus}
          options={[
            { value: '', label: 'Còn phải làm' },
            ...Object.values(LabTestStatus).map((value) => ({
              value,
              label: LAB_TEST_STATUS_LABEL_VI[value],
            })),
          ]}
        />
      </div>

      {}
      <Table
        minWidth="980px"
        columns={columns}
        data={pageItems}
        getRowId={(row) => row.labTestOrderId}
        loading={queueQuery.isLoading}
        error={queueQuery.isError}
        onRetry={() => void queueQuery.refetch()}
        emptyMessage="Không có yêu cầu xét nghiệm nào đang chờ."
        page={page}
        limit={PAGE_SIZE}
        total={rows.length}
        onPageChange={setPage}
      />
    </div>
  );
}
