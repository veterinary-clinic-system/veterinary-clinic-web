import { Link } from 'react-router-dom';
import { PetTimelineEntry } from '@/api/pets.api';
import { Badge, EmptyState, SkeletonText, Timeline, TimelineEntry } from '@/components/basic';
import { AppointmentStatus } from '@/types/enums';
import { APPOINTMENT_STATUS_LABEL_VI } from '@/utils/labels';
import { APPOINTMENT_STATUS_TONE } from '@/utils/appointment-status';
import { formatDateTime } from '@/utils/format';

export function MedicalHistoryTab({
  entries,
  isLoading,
}: {
  entries: PetTimelineEntry[] | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <SkeletonText lines={6} />;
  }

  if (!entries || entries.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="Chưa có lần khám nào"
        description="Lịch sử khám của bé sẽ xuất hiện tại đây sau buổi khám đầu tiên."
      />
    );
  }

  const timelineEntries: TimelineEntry[] = entries.map((entry) => {
    const status = entry.status as AppointmentStatus;
    const examination = entry.examination;

    return {
      id: entry.id,
      time: formatDateTime(entry.startAt),
      tone: status === AppointmentStatus.COMPLETED ? 'success' : 'default',
      title: (
        <Link to={`/my/appointments/${entry.id}`} className="text-primary hover:underline">
          {examination?.diagnosisText || 'Buổi khám'}
        </Link>
      ),
      description: (
        <>
          {entry.doctor?.fullName && <p>Bác sĩ phụ trách: {entry.doctor.fullName}</p>}
          {examination?.notes && <p className="mt-1">{examination.notes}</p>}
        </>
      ),
      footer: (
        <Badge variant={APPOINTMENT_STATUS_TONE[status] ?? 'neutral'}>
          {APPOINTMENT_STATUS_LABEL_VI[status] ?? entry.status}
        </Badge>
      ),
    };
  });

  return <Timeline entries={timelineEntries} />;
}
