import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalRecordsApi } from '@/api/medical-records.api';
import { Button, Textarea, useToast } from '@/components/basic';
import { MedicalRecord } from '@/types/models';
import { extractApiMessage } from '../api-utils';
import { Section } from '../Section';

/** Khối hành chính (FR-07): lý do khám + tình trạng chung + ghi chú của hồ sơ. */
export function RecordHeaderSection({
  record,
  readOnly,
}: {
  record: MedicalRecord;
  readOnly: boolean;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [visitReason, setVisitReason] = useState(record.visitReason ?? '');
  const [generalCondition, setGeneralCondition] = useState(record.generalCondition ?? '');
  const [notes, setNotes] = useState(record.notes ?? '');

  const saveMutation = useMutation({
    mutationFn: () =>
      medicalRecordsApi.update(record.id, { visitReason, generalCondition, notes }),
    onSuccess: () => {
      toast.show('Đã lưu thông tin hồ sơ', 'success');
      void queryClient.invalidateQueries({ queryKey: ['medical-record'] });
    },
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Lưu thất bại', 'error'),
  });

  return (
    <Section title="Thông tin lần khám">
      <div className="flex flex-col gap-3">
        <Textarea
          label="Lý do khám"
          rows={2}
          value={visitReason}
          disabled={readOnly}
          onChange={(e) => setVisitReason(e.target.value)}
          hint="Lý do bác sĩ ghi lại sau khi hỏi bệnh — khác lời khách tự kể lúc đặt lịch."
        />
        <Textarea
          label="Tình trạng chung"
          rows={2}
          value={generalCondition}
          disabled={readOnly}
          onChange={(e) => setGeneralCondition(e.target.value)}
        />
        <Textarea
          label="Ghi chú"
          rows={2}
          value={notes}
          disabled={readOnly}
          onChange={(e) => setNotes(e.target.value)}
        />
        {!readOnly && (
          <Button
            type="button"
            className="w-fit"
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Lưu thông tin
          </Button>
        )}
      </div>
    </Section>
  );
}
