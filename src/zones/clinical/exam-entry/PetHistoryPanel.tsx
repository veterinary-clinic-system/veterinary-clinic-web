import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { medicalRecordsApi } from '@/api/medical-records.api';
import { Badge } from '@/components/basic';
import { MedicalRecord } from '@/types/models';
import { MedicalRecordStatus } from '@/types/enums';
import { formatDate } from '@/utils/format';
import { DIAGNOSIS_SEVERITY_LABEL_VI, MEDICAL_RECORD_STATUS_LABEL_VI } from '@/utils/labels';

export function PetHistoryPanel({
  petId,
  currentRecordId,
}: {
  petId: string;
  currentRecordId: string;
}) {
  const historyQuery = useQuery({
    queryKey: ['medical-records', 'by-pet', petId],
    queryFn: () => medicalRecordsApi.getTimelineForPet(petId),
  });

  // Lần khám ĐANG diễn ra đã nằm ở cột giữa - để lại ở đây là nhìn thấy hai lần.
  const previous = (historyQuery.data ?? []).filter((r) => r.id !== currentRecordId);

  return (
    /* `top-20` chứ không phải `top-4`: thanh trên của StaffLayout cao 4rem và cũng
       sticky, nên neo cao hơn sẽ làm tiêu đề cột chui xuống dưới nó. */
    <aside className="flex flex-col gap-3 xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
      <h2 className="font-medium">Bệnh sử ({previous.length})</h2>
      {historyQuery.isLoading && <p className="text-sm text-muted">Đang tải bệnh sử…</p>}
      {!historyQuery.isLoading && previous.length === 0 && (
        <p className="rounded border border-border bg-surface p-4 text-sm text-muted">
          Đây là lần khám đầu tiên được ghi nhận cho thú cưng này.
        </p>
      )}
      {previous.map((record) => (
        <HistoryCard key={record.id} record={record} />
      ))}
    </aside>
  );
}

function HistoryCard({ record }: { record: MedicalRecord }) {
  const [expanded, setExpanded] = useState(false);
  const visitedAt = record.examination?.examinedAt ?? record.createdAt;
  const primary = (record.diagnoses ?? []).find((d) => d.isPrimary) ?? record.diagnoses?.[0];

  return (
    <article className="rounded border border-border bg-surface p-3 text-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-2 text-left"
      >
        <span>
          <span className="font-medium">{formatDate(visitedAt)}</span>
          <span className="block text-muted">BS. {record.doctor?.fullName ?? '—'}</span>
        </span>
        <Badge variant={record.status === MedicalRecordStatus.COMPLETED ? 'success' : 'warning'}>
          {MEDICAL_RECORD_STATUS_LABEL_VI[record.status]}
        </Badge>
      </button>

      <p className="mt-2 text-foreground">{primary?.diagnosisText ?? 'Chưa có chẩn đoán'}</p>

      {expanded && (
        <dl className="mt-3 flex flex-col gap-2 border-t border-border pt-3 text-xs">
          {record.visitReason && (
            <div>
              <dt className="text-muted">Lý do khám</dt>
              <dd>{record.visitReason}</dd>
            </div>
          )}
          {(record.diagnoses ?? []).length > 0 && (
            <div>
              <dt className="text-muted">Chẩn đoán</dt>
              <dd>
                <ul className="list-inside list-disc">
                  {record.diagnoses!.map((d) => (
                    <li key={d.id}>
                      {d.diagnosisText} — {DIAGNOSIS_SEVERITY_LABEL_VI[d.severity]}
                      {d.isPrimary ? ' (chính)' : ''}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          {(record.treatments ?? []).length > 0 && (
            <div>
              <dt className="text-muted">Điều trị</dt>
              <dd>
                <ul className="list-inside list-disc">
                  {record.treatments!.map((t) => (
                    <li key={t.id}>{t.method}</li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          {record.examination && (
            <div>
              <dt className="text-muted">Sinh hiệu</dt>
              <dd>
                {record.examination.temperatureCelsius ?? '—'} °C ·{' '}
                {record.examination.weightKg ?? '—'} kg
              </dd>
            </div>
          )}
          {record.notes && (
            <div>
              <dt className="text-muted">Ghi chú</dt>
              <dd>{record.notes}</dd>
            </div>
          )}
        </dl>
      )}
    </article>
  );
}
