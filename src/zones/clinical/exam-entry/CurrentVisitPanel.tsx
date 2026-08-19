import { MedicalRecord } from '@/types/models';
import { MedicalRecordStatus } from '@/types/enums';
import { formatDateTime } from '@/utils/format';
import { CompleteSection } from './sections/CompleteSection';
import { DiagnosesSection } from './sections/DiagnosesSection';
import { FollowUpSection } from './sections/FollowUpSection';
import { LabTestsSection } from './sections/LabTestsSection';
import { PrescriptionsSection } from './sections/PrescriptionsSection';
import { RecordHeaderSection } from './sections/RecordHeaderSection';
import { TreatmentsSection } from './sections/TreatmentsSection';
import { VaccinationsSection } from './sections/VaccinationsSection';
import { VitalsSection } from './sections/VitalsSection';

export function CurrentVisitPanel({
  record,
  appointmentId,
  appt,
}: {
  record: MedicalRecord;
  appointmentId: string;
  appt: { doctorId: string; branchId: string; serviceId: string };
}) {
  // BR-08 - hồ sơ đã hoàn tất thì mọi ô nhập bị khoá. Một cờ duy nhất, truyền xuống mọi
  // khối con: nếu để từng khối tự hỏi trạng thái, chỉ cần quên một chỗ là BR-08 thủng.
  const readOnly = record.status === MedicalRecordStatus.COMPLETED;

  return (
    <div className="flex flex-col gap-6">
      {readOnly && (
        <div className="rounded border border-border bg-surface-muted p-4">
          <p className="text-sm font-medium">Hồ sơ đã hoàn tất — chỉ xem</p>
          <p className="mt-1 text-sm text-muted">
            Hoàn tất lúc {record.completedAt ? formatDateTime(record.completedAt) : '—'}. Theo BR-08,
            hồ sơ bệnh án đã chốt không được sửa; mọi thay đổi sau đó phải đi qua đường sửa có ghi
            nhật ký kiểm toán.
          </p>
        </div>
      )}

      <RecordHeaderSection record={record} readOnly={readOnly} />
      <VitalsSection record={record} readOnly={readOnly} />
      <DiagnosesSection record={record} readOnly={readOnly} />
      <TreatmentsSection record={record} readOnly={readOnly} />
      <LabTestsSection record={record} readOnly={readOnly} />
      <VaccinationsSection record={record} readOnly={readOnly} />
      <PrescriptionsSection record={record} readOnly={readOnly} />
      <CompleteSection record={record} readOnly={readOnly} />
      {readOnly && <FollowUpSection appointmentId={appointmentId} appt={appt} />}
    </div>
  );
}
