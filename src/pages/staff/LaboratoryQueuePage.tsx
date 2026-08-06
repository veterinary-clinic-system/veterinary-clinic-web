import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { laboratoriesApi } from '@/api/laboratories.api';
import { Badge, Select, Table } from '@/components/basic';
import type { Column } from '@/components/basic';
import { LabQueueRow, LabTestStatus } from '@/types/models';
import { formatDateTime } from '@/utils/format';
import { LAB_TEST_STATUS_LABEL_VI } from '@/utils/labels';

/**
 * Hàng chờ xét nghiệm — acceptance P9-T7: "chỉ định xét nghiệm từ màn hình khám →
 * xuất hiện ở hàng chờ xét nghiệm".
 *
 * Cũ nhất lên trước (backend sắp sẵn), cùng quy ước với hàng chờ quầy thuốc ở P7: việc
 * chờ lâu nhất phải được làm trước. Mặc định **không** hiện việc đã xong — hàng chờ là
 * những việc còn phải làm; muốn xem lại thì lọc `Đã có kết quả` một cách tường minh.
 *
 * Cột "Vào hồ sơ" dẫn thẳng tới phiếu khám: kỹ thuật viên nhập kết quả ngay tại đó, nên
 * màn hình này cố ý **không** dựng thêm một form nhập kết quả thứ hai. Hai form cùng ghi
 * một bảng là hai chỗ phải sửa mỗi lần đổi quy tắc, và sớm muộn sẽ lệch nhau.
 */
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

  const columns: Column<LabQueueRow>[] = [
    { key: 'orderedAt', header: 'Chỉ định lúc', render: (row) => formatDateTime(row.orderedAt) },
    {
      key: 'pet',
      header: 'Thú cưng',
      render: (row) => (
        <Link to={`/staff/patients/${row.petId}`} className="text-primary hover:underline">
          {row.petName} <span className="font-mono text-xs text-muted">{row.petCode}</span>
        </Link>
      ),
    },
    { key: 'testName', header: 'Xét nghiệm' },
    { key: 'doctorName', header: 'Bác sĩ chỉ định', render: (row) => row.doctorName ?? '—' },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => (
        <Badge variant={row.status === LabTestStatus.COMPLETED ? 'success' : 'warning'}>
          {LAB_TEST_STATUS_LABEL_VI[row.status]}
        </Badge>
      ),
    },
    {
      key: 'resultCount',
      header: 'Số chỉ số',
      render: (row) => (row.resultCount > 0 ? row.resultCount : '—'),
    },
    {
      key: 'link',
      header: '',
      render: (row) => (
        <Link
          to={`/staff/patients/${row.petId}`}
          className="text-sm text-primary hover:underline"
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
        <h1 className="text-2xl font-semibold">Hàng chờ xét nghiệm</h1>
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

      <Table
        columns={columns}
        data={queueQuery.data ?? []}
        getRowId={(row) => row.labTestOrderId}
        loading={queueQuery.isLoading}
        emptyMessage="Không có yêu cầu xét nghiệm nào đang chờ."
      />
    </div>
  );
}
