import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/appointments.api';
import { medicalRecordsApi } from '@/api/medical-records.api';
import { Icon, Skeleton, SkeletonText } from '@/components/basic';
import { QueryErrorState } from '@/components/QueryErrorState';
import { formatDateTime } from '@/utils/format';
import { CurrentVisitPanel } from '../exam-entry/CurrentVisitPanel';
import { OpenRecordError } from '../exam-entry/OpenRecordError';
import { PatientSummaryPanel } from '../exam-entry/PatientSummaryPanel';
import { PetHistoryPanel } from '../exam-entry/PetHistoryPanel';

export function ExamEntryPage() {
  const { id: appointmentId } = useParams<{ id: string }>();

  const apptQuery = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentsApi.getOne(appointmentId!),
    enabled: !!appointmentId,
  });

  const recordQuery = useQuery({
    queryKey: ['medical-record', 'by-appointment', appointmentId],
    queryFn: () => medicalRecordsApi.open({ appointmentId: appointmentId! }),
    enabled: !!appointmentId,
    retry: false,
  });

  if (apptQuery.isLoading || recordQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-1/2" />
        <SkeletonText lines={10} />
      </div>
    );
  }

  if (!apptQuery.data) {
    return (
      <QueryErrorState
        error={apptQuery.error}
        title="Không tìm thấy lịch hẹn"
        description="Lịch hẹn có thể đã bị huỷ, hoặc mã trong đường dẫn không đúng."
        onRetry={() => void apptQuery.refetch()}
      />
    );
  }

  const appt = apptQuery.data;

  return (
    <div className="flex flex-col gap-stack">
      <div>
        <Link
          to={`/staff/appointments/${appt.id}`}
          className="inline-flex min-h-touch items-center gap-1 text-sm text-primary hover:underline"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Chi tiết lịch hẹn
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          Phiếu khám · {appt.pet?.name ?? 'Thú cưng'}
        </h1>
        <p className="text-data text-muted">
          {formatDateTime(appt.startAt)} · {appt.doctor?.fullName ?? 'Chưa gán bác sĩ'} ·{' '}
          {appt.service?.item.itemName ?? 'Chưa chọn dịch vụ'}
        </p>
      </div>

      {recordQuery.isError ? (
        <OpenRecordError error={recordQuery.error} />
      ) : recordQuery.data ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[17rem_minmax(0,1fr)_20rem]">
          {}
          <PatientSummaryPanel appointment={appt} />
          <CurrentVisitPanel record={recordQuery.data} appointmentId={appt.id} appt={appt} />
          <PetHistoryPanel petId={appt.petId} currentRecordId={recordQuery.data.id} />
        </div>
      ) : (
        <QueryErrorState
          error={recordQuery.error}
          title="Không mở được hồ sơ bệnh án"
          onRetry={() => void recordQuery.refetch()}
        />
      )}
    </div>
  );
}
