import { useQuery } from '@tanstack/react-query';
import { vaccinationsApi } from '@/api/vaccinations.api';
import { ClientPagedTable } from '@/components/basic';
import type { Column } from '@/components/basic';
import { VACCINATION_DUE_STATUS_LABEL_VI } from '@/types/enums';
import type { VaccinationRecordView } from '@/types/models';
import { formatDate } from '@/utils/format';
import { vaccinationDueClasses } from '@/utils/labels';

/**
 * Khối 5 - Vaccination (P9-T3).
 *
 * Trạng thái nhắc (`dueStatus`) do **backend** tính, không tự so ngày ở client: lễ tân
 * gọi nhắc theo `GET /vaccinations/due` và bác sĩ nhìn sổ này, hai chỗ phải tô cùng một
 * màu cho cùng một mũi. Tự so ở client là mở đường cho hai ngưỡng lệch nhau.
 */
export function VaccinationTab({ petId }: { petId: string }) {
  const query = useQuery({
    queryKey: ['pet-vaccinations', petId],
    queryFn: () => vaccinationsApi.byPet(petId),
  });

  const columns: Column<VaccinationRecordView>[] = [
    {
      key: 'vaccinatedAt',
      header: 'Ngày tiêm',
      render: (row) => formatDate(row.vaccination.vaccinatedAt),
    },
    {
      key: 'vaccine',
      header: 'Vaccine',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{row.vaccination.vaccine?.item.itemName ?? '—'}</span>
          <span className="text-xs text-muted">
            {row.vaccination.vaccine?.diseasePrevented ?? ''}
          </span>
        </div>
      ),
    },
    {
      key: 'doseNumber',
      header: 'Mũi',
      render: (row) =>
        row.vaccination.vaccine
          ? `${row.vaccination.doseNumber}/${row.vaccination.vaccine.doseCount}`
          : String(row.vaccination.doseNumber),
    },
    {
      key: 'batch',
      header: 'Lô / HSD',
      render: (row) =>
        row.vaccination.batchNo ? (
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-xs">{row.vaccination.batchNo}</span>
            <span className="text-xs text-muted">
              {row.vaccination.expiryDate ? `HSD ${formatDate(row.vaccination.expiryDate)}` : '—'}
            </span>
          </div>
        ) : (
          '—'
        ),
    },
    {
      key: 'doctor',
      header: 'Bác sĩ',
      render: (row) => row.vaccination.doctor?.fullName ?? '—',
    },
    {
      key: 'nextDueDate',
      header: 'Hẹn nhắc lại',
      render: (row) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${vaccinationDueClasses(row.dueStatus)}`}
        >
          {row.vaccination.nextDueDate
            ? `${formatDate(row.vaccination.nextDueDate)} · ${VACCINATION_DUE_STATUS_LABEL_VI[row.dueStatus]}`
            : VACCINATION_DUE_STATUS_LABEL_VI.NONE}
        </span>
      ),
    },
    {
      key: 'notes',
      header: 'Ghi chú',
      render: (row) => row.vaccination.notes ?? '—',
    },
  ];

  return (
    <ClientPagedTable
      columns={columns}
      data={query.data ?? []}
      getRowId={(row) => row.vaccination.id}
      loading={query.isLoading}
      error={query.isError}
      errorTitle="Không tải được sổ tiêm chủng"
      onRetry={() => void query.refetch()}
      emptyMessage="Thú cưng chưa có mũi tiêm nào được ghi nhận."
    />
  );
}
