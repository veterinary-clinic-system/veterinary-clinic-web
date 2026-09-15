import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { vaccinationsApi } from '@/api/vaccinations.api';
import { Select, Table, usePagination } from '@/components/basic';
import type { Column } from '@/components/basic';
import { VaccinationDueRow } from '@/types/models';
import { formatDate } from '@/utils/format';
import { vaccinationDueClasses } from '@/utils/labels';

const DAY_OPTIONS = [7, 14, 30, 60, 90];
const PAGE_SIZE = 20;

export function VaccinationDuePage() {
  const [days, setDays] = useState('30');
  const [branchId, setBranchId] = useState('');

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });

  const dueQuery = useQuery({
    queryKey: ['vaccinations', 'due', days, branchId],
    queryFn: () =>
      vaccinationsApi.due({ days: Number(days), branchId: branchId || undefined }),
  });

  const rows = dueQuery.data ?? [];
  const { page, setPage, pageItems } = usePagination(rows, PAGE_SIZE, [days, branchId]);

  const columns: Column<VaccinationDueRow>[] = [
    {
      key: 'nextDueDate',
      header: 'Hạn tiêm',
      render: (row) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${vaccinationDueClasses(
            row.daysUntilDue < 0 ? 'OVERDUE' : 'DUE_SOON',
          )}`}
        >
          {formatDate(row.nextDueDate)}
          {row.daysUntilDue < 0
            ? ` · quá ${Math.abs(row.daysUntilDue)} ngày`
            : ` · còn ${row.daysUntilDue} ngày`}
        </span>
      ),
    },
    {
      key: 'pet',
      header: 'Thú cưng',
      render: (row) => (
        <Link to={`/staff/patients/${row.petId}`} className="text-primary hover:underline">
          {row.petName} <span className="font-mono text-xs text-muted">{row.petCode}</span>
        </Link>
      ),
    },
    {
      key: 'owner',
      header: 'Chủ nuôi',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <Link
            to={`/staff/customers/${row.ownerId}`}
            className="text-primary hover:underline"
          >
            {row.ownerName}
          </Link>
          <a href={`tel:${row.ownerPhone}`} className="text-xs text-muted hover:underline">
            {row.ownerPhone}
          </a>
        </div>
      ),
    },
    {
      key: 'vaccine',
      header: 'Vaccine',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span>{row.vaccineName}</span>
          <span className="text-xs text-muted">{row.diseasePrevented}</span>
        </div>
      ),
    },
    {
      key: 'lastDose',
      header: 'Mũi gần nhất',
      render: (row) => `Mũi ${row.doseNumber} · ${formatDate(row.vaccinatedAt)}`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nhắc lịch tiêm</h1>
        <p className="text-muted">
          Các mũi đã quá hạn và sắp đến hạn, mũi cần gọi gấp nhất nằm trên cùng. Khách đã ngưng
          hoạt động không xuất hiện ở đây.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="Trong vòng"
          value={days}
          onChange={setDays}
          options={DAY_OPTIONS.map((value) => ({
            value: String(value),
            label: `${value} ngày tới`,
          }))}
        />
        <Select
          label="Chi nhánh"
          value={branchId}
          onChange={setBranchId}
          options={[
            { value: '', label: 'Tất cả chi nhánh' },
            ...(branchesQuery.data ?? []).map((branch) => ({
              value: branch.id,
              label: branch.branchName,
            })),
          ]}
        />
      </div>

      <Table
        columns={columns}
        data={pageItems}
        getRowId={(row) => row.vaccinationId}
        loading={dueQuery.isLoading}
        error={dueQuery.isError}
        onRetry={() => void dueQuery.refetch()}
        emptyMessage="Không có mũi tiêm nào đến hạn trong khoảng đã chọn."
        page={page}
        limit={PAGE_SIZE}
        total={rows.length}
        onPageChange={setPage}
      />
    </div>
  );
}
