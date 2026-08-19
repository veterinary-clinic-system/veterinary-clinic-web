import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { catalogApi } from '@/api/catalog.api';
import { medicalRecordsApi } from '@/api/medical-records.api';
import { Badge, Button, Input, Select, Textarea, useToast } from '@/components/basic';
import { Diagnosis, MedicalRecord } from '@/types/models';
import { DiagnosisSeverity } from '@/types/enums';
import { DIAGNOSIS_SEVERITY_LABEL_VI } from '@/utils/labels';
import { extractApiMessage } from '../api-utils';
import { Section } from '../Section';

const SEVERITY_OPTIONS = Object.values(DiagnosisSeverity).map((value) => ({
  value,
  label: DIAGNOSIS_SEVERITY_LABEL_VI[value],
}));

/** Khối chẩn đoán (FR-09) — nhiều chẩn đoán trên cùng một hồ sơ, đúng một cái là chính. */
export function DiagnosesSection({ record, readOnly }: { record: MedicalRecord; readOnly: boolean }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const diagnoses = record.diagnoses ?? [];

  const [diagnosisText, setDiagnosisText] = useState('');
  const [severity, setSeverity] = useState<string>(DiagnosisSeverity.MILD);
  const [diseaseId, setDiseaseId] = useState('');
  const [notes, setNotes] = useState('');

  // `limit` tối đa 100 (PaginationQueryDto phía backend) - gửi 200 sẽ bị trả 400 và ô
  // chọn bệnh lặng lẽ rỗng.
  const diseasesQuery = useQuery({
    queryKey: ['diseases', 'for-diagnosis'],
    queryFn: () => catalogApi.diseases({ limit: 100 }),
  });
  const diseaseOptions = [
    { value: '', label: '— Không chọn từ danh mục —' },
    ...((diseasesQuery.data?.data ?? []) as { id: string; diseaseName: string }[]).map((d) => ({
      value: d.id,
      label: d.diseaseName,
    })),
  ];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['medical-record'] });

  const addMutation = useMutation({
    mutationFn: () =>
      medicalRecordsApi.addDiagnosis(record.id, {
        diagnosisText,
        severity,
        diseaseId: diseaseId || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      setDiagnosisText('');
      setNotes('');
      setDiseaseId('');
      setSeverity(DiagnosisSeverity.MILD);
      toast.show('Đã thêm chẩn đoán', 'success');
      void invalidate();
    },
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Thêm thất bại', 'error'),
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (id: string) => medicalRecordsApi.updateDiagnosis(id, { isPrimary: true }),
    onSuccess: () => void invalidate(),
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Cập nhật thất bại', 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => medicalRecordsApi.removeDiagnosis(id),
    onSuccess: () => {
      toast.show('Đã xoá chẩn đoán', 'success');
      void invalidate();
    },
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Xoá thất bại', 'error'),
  });

  return (
    <Section title="Chẩn đoán">
      {diagnoses.length === 0 ? (
        <p className="text-sm text-muted">Chưa có chẩn đoán nào.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {diagnoses.map((diagnosis) => (
            <DiagnosisRow
              key={diagnosis.id}
              diagnosis={diagnosis}
              readOnly={readOnly}
              onSetPrimary={() => setPrimaryMutation.mutate(diagnosis.id)}
              onRemove={() => removeMutation.mutate(diagnosis.id)}
            />
          ))}
        </ul>
      )}

      {!readOnly && (
        <form
          className="mt-4 flex flex-col gap-3 border-t border-border pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (diagnosisText.trim()) addMutation.mutate();
          }}
        >
          <Textarea
            label="Chẩn đoán"
            rows={2}
            value={diagnosisText}
            onChange={(e) => setDiagnosisText(e.target.value)}
            placeholder="Ví dụ: Viêm da dị ứng nhẹ, nghi do phấn hoa"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Mức độ"
              value={severity}
              onChange={setSeverity}
              options={SEVERITY_OPTIONS}
            />
            <Select
              label="Bệnh trong danh mục (tuỳ chọn)"
              value={diseaseId}
              onChange={setDiseaseId}
              options={diseaseOptions}
              hint="Bỏ trống nếu bệnh chưa có trong danh mục."
            />
          </div>
          <Input
            label="Ghi chú"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button
            type="submit"
            className="w-fit"
            loading={addMutation.isPending}
            disabled={!diagnosisText.trim()}
          >
            + Thêm chẩn đoán
          </Button>
        </form>
      )}
    </Section>
  );
}

function DiagnosisRow({
  diagnosis,
  readOnly,
  onSetPrimary,
  onRemove,
}: {
  diagnosis: Diagnosis;
  readOnly: boolean;
  onSetPrimary: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 rounded border border-border p-3 text-sm">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{diagnosis.diagnosisText}</span>
          <Badge variant="outline">{DIAGNOSIS_SEVERITY_LABEL_VI[diagnosis.severity]}</Badge>
          {diagnosis.isPrimary && <Badge>Chẩn đoán chính</Badge>}
        </p>
        {diagnosis.disease && (
          <p className="text-muted">Danh mục: {diagnosis.disease.diseaseName}</p>
        )}
        {diagnosis.notes && <p className="text-muted">{diagnosis.notes}</p>}
      </div>
      {!readOnly && (
        <div className="flex shrink-0 gap-2">
          {!diagnosis.isPrimary && (
            <Button type="button" variant="secondary" size="sm" onClick={onSetPrimary}>
              Đặt làm chính
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            Xoá
          </Button>
        </div>
      )}
    </li>
  );
}
