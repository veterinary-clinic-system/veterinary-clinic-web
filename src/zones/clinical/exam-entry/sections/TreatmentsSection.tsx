import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalRecordsApi } from '@/api/medical-records.api';
import { Badge, Button, Input, Textarea, useToast } from '@/components/basic';
import { MedicalRecord, Treatment } from '@/types/models';
import { formatDate } from '@/utils/format';
import { extractApiMessage } from '../api-utils';
import { Section } from '../Section';

/** Khối điều trị (FR-10) — `endDate` bỏ trống nghĩa là điều trị đang tiếp diễn. */
export function TreatmentsSection({
  record,
  readOnly,
}: {
  record: MedicalRecord;
  readOnly: boolean;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const treatments = record.treatments ?? [];

  const [method, setMethod] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [instruction, setInstruction] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['medical-record'] });

  const addMutation = useMutation({
    mutationFn: () =>
      medicalRecordsApi.addTreatment(record.id, {
        method,
        description: description || undefined,
        startDate,
        endDate: endDate || undefined,
        instruction: instruction || undefined,
      }),
    onSuccess: () => {
      setMethod('');
      setDescription('');
      setEndDate('');
      setInstruction('');
      toast.show('Đã thêm phương pháp điều trị', 'success');
      void invalidate();
    },
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Thêm thất bại', 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => medicalRecordsApi.removeTreatment(id),
    onSuccess: () => void invalidate(),
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Xoá thất bại', 'error'),
  });

  return (
    <Section title="Điều trị">
      {treatments.length === 0 ? (
        <p className="text-sm text-muted">Chưa ghi phương pháp điều trị nào.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {treatments.map((treatment) => (
            <TreatmentRow
              key={treatment.id}
              treatment={treatment}
              readOnly={readOnly}
              onRemove={() => removeMutation.mutate(treatment.id)}
            />
          ))}
        </ul>
      )}

      {!readOnly && (
        <form
          className="mt-4 flex flex-col gap-3 border-t border-border pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (method.trim() && startDate) addMutation.mutate();
          }}
        >
          <Input
            label="Phương pháp"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            placeholder="Ví dụ: Truyền dịch, Tiêm kháng sinh, Bôi thuốc ngoài da"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Ngày bắt đầu"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="Ngày kết thúc"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              hint="Bỏ trống nếu điều trị còn tiếp diễn."
            />
          </div>
          <Textarea
            label="Mô tả (phòng khám đã làm gì)"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Textarea
            label="Hướng dẫn cho chủ nuôi"
            rows={2}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
          />
          <Button
            type="submit"
            className="w-fit"
            loading={addMutation.isPending}
            disabled={!method.trim() || !startDate}
          >
            + Thêm điều trị
          </Button>
        </form>
      )}
    </Section>
  );
}

function TreatmentRow({
  treatment,
  readOnly,
  onRemove,
}: {
  treatment: Treatment;
  readOnly: boolean;
  onRemove: () => void;
}) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 rounded border border-border p-3 text-sm">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{treatment.method}</span>
          <Badge variant="outline">
            {formatDate(treatment.startDate)} →{' '}
            {treatment.endDate ? formatDate(treatment.endDate) : 'đang tiếp diễn'}
          </Badge>
        </p>
        {treatment.description && <p className="text-muted">{treatment.description}</p>}
        {treatment.instruction && (
          <p className="text-muted">Hướng dẫn: {treatment.instruction}</p>
        )}
      </div>
      {!readOnly && (
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          Xoá
        </Button>
      )}
    </li>
  );
}
