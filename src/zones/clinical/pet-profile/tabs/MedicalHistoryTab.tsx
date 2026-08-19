import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { petsApi } from '@/api/pets.api';
import { Badge, ClientPagedTable } from '@/components/basic';
import type { Column } from '@/components/basic';
import { MedicalRecordStatus } from '@/types/enums';
import type { PetMedicalHistory } from '@/types/models';
import { formatDateTime } from '@/utils/format';
import { MEDICAL_RECORD_STATUS_LABEL_VI } from '@/utils/labels';

/** Khối 3 - Medical History. */
export function MedicalHistoryTab({ petId }: { petId: string }) {
  const query = useQuery({
    queryKey: ['pet-medical-history', petId],
    queryFn: () => petsApi.medicalHistory(petId),
  });

  const columns: Column<PetMedicalHistory>[] = [
    { key: 'examinedAt', header: 'Ngày khám', render: (row) => formatDateTime(row.examinedAt) },
    { key: 'doctorName', header: 'Bác sĩ', render: (row) => row.doctorName ?? '—' },
    { key: 'branchName', header: 'Chi nhánh', render: (row) => row.branchName ?? '—' },
    {
      key: 'diagnoses',
      header: 'Chẩn đoán',
      // Từ P4, một hồ sơ có nhiều chẩn đoán; backend đã xếp chẩn đoán chính lên đầu.
      render: (row) =>
        row.diagnoses.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.diagnoses.map((diagnosis) => (
              <Badge key={diagnosis.id} variant={diagnosis.isPrimary ? 'default' : 'outline'}>
                {diagnosis.diseaseName ?? diagnosis.diagnosisText}
              </Badge>
            ))}
          </div>
        ) : (
          '—'
        ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => (
        <Badge variant={row.status === MedicalRecordStatus.COMPLETED ? 'success' : 'warning'}>
          {MEDICAL_RECORD_STATUS_LABEL_VI[row.status]}
        </Badge>
      ),
    },
    {
      key: 'vitals',
      header: 'Sinh hiệu',
      render: (row) =>
        [
          row.temperatureCelsius != null ? `${row.temperatureCelsius}°C` : null,
          row.weightKg != null ? `${row.weightKg} kg` : null,
        ]
          .filter(Boolean)
          .join(' · ') || '—',
    },
    {
      key: 'link',
      header: '',
      render: (row) => (
        <Link
          to={`/staff/appointments/${row.appointmentId}`}
          className="text-sm text-primary hover:underline"
        >
          Xem phiếu khám
        </Link>
      ),
    },
  ];

  return (
    <ClientPagedTable
      columns={columns}
      data={query.data ?? []}
      getRowId={(row) => row.medicalRecordId}
      loading={query.isLoading}
      emptyMessage="Thú cưng chưa có lần khám nào được ghi hồ sơ."
    />
  );
}
