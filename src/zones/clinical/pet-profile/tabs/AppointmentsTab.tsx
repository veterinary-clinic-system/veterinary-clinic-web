import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { petsApi } from '@/api/pets.api';
import { ClientPagedTable } from '@/components/basic';
import type { Column } from '@/components/basic';
import { PRIORITY_COLOR_LABEL_VI } from '@/types/enums';
import type { PetAppointment } from '@/types/models';
import { formatDateTime } from '@/utils/format';
import { APPOINTMENT_STATUS_LABEL_VI, triageColorClasses } from '@/utils/labels';

/** Khối 4 - Appointment. */
export function AppointmentsTab({ petId }: { petId: string }) {
  const query = useQuery({
    queryKey: ['pet-appointments', petId],
    queryFn: () => petsApi.staffAppointments(petId),
  });

  const columns: Column<PetAppointment>[] = [
    { key: 'startAt', header: 'Thời gian', render: (row) => formatDateTime(row.startAt) },
    { key: 'serviceName', header: 'Dịch vụ', render: (row) => row.serviceName ?? '—' },
    { key: 'doctorName', header: 'Bác sĩ', render: (row) => row.doctorName ?? '—' },
    { key: 'branchName', header: 'Chi nhánh', render: (row) => row.branchName ?? '—' },
    {
      key: 'priorityColor',
      header: 'Mức ưu tiên',
      render: (row) =>
        row.priorityColor ? (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${triageColorClasses(row.priorityColor)}`}
          >
            {PRIORITY_COLOR_LABEL_VI[row.priorityColor]}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => APPOINTMENT_STATUS_LABEL_VI[row.status],
    },
    {
      key: 'link',
      header: '',
      render: (row) => (
        <Link
          to={`/staff/appointments/${row.appointmentId}`}
          className="text-sm text-primary hover:underline"
        >
          Xem lịch hẹn
        </Link>
      ),
    },
  ];

  return (
    <ClientPagedTable
      columns={columns}
      data={query.data ?? []}
      getRowId={(row) => row.appointmentId}
      loading={query.isLoading}
      emptyMessage="Thú cưng chưa có lịch hẹn nào."
    />
  );
}
