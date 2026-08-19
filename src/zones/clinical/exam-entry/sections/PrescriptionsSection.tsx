import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { catalogApi } from '@/api/catalog.api';
import { examinationsApi } from '@/api/examinations.api';
import { Button, Input, Select, useToast } from '@/components/basic';
import { MedicalRecord, Medication, Prescription } from '@/types/models';
import { MEDICATION_ROUTE_LABEL_VI, MedicationRoute, PRESCRIPTION_STATUS_LABEL_VI } from '@/types/enums';
import { extractApiMessage } from '../api-utils';
import { Section } from '../Section';

interface PrescriptionLine {
  medicationId: string;
  /**
   * Số lượng thực cấp (P7, FR-11-01). Bác sĩ nhập tay chứ hệ thống **không** suy ra từ
   * liều × tần suất × số ngày: y lệnh thực tế có những dạng không quy về một con số
   * được ("khi sốt trên 39 độ"), mà đây lại là con số trừ kho và tính tiền.
   */
  quantity: string;
  dosage: string;
  frequency: string;
  durationDays: string;
  route: MedicationRoute;
  instructions: string;
}

const EMPTY_LINE: PrescriptionLine = {
  medicationId: '',
  quantity: '',
  dosage: '',
  frequency: '',
  durationDays: '',
  route: MedicationRoute.ORAL,
  instructions: '',
};

export function PrescriptionsSection({
  record,
  readOnly,
}: {
  record: MedicalRecord;
  readOnly: boolean;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const examination = record.examination ?? null;
  const prescriptions = record.prescriptions ?? [];

  const medicationsQuery = useQuery({
    queryKey: ['medications', 'for-prescription'],
    queryFn: () => catalogApi.medications({ limit: 100 }),
  });
  const medications: Medication[] = medicationsQuery.data?.data ?? [];
  const medicationOptions = [
    { value: '', label: '— Chọn thuốc —' },
    ...medications.map((m) => ({ value: m.id, label: `${m.item.itemName} (${m.unit})` })),
  ];

  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<PrescriptionLine[]>([{ ...EMPTY_LINE }]);

  const addMutation = useMutation({
    mutationFn: () =>
      examinationsApi.addPrescription(examination!.id, {
        notes: notes || undefined,
        items: lines
          .filter((l) => l.medicationId)
          .map((l) => ({
            medicationId: l.medicationId,
            quantity: Number(l.quantity) || 0,
            dosage: l.dosage,
            frequency: l.frequency || undefined,
            durationDays: Number(l.durationDays) || 0,
            route: l.route,
            instructions: l.instructions || undefined,
          })),
      }),
    onSuccess: (view) => {
      setLines([{ ...EMPTY_LINE }]);
      setNotes('');
      // FR-11-02: thiếu tồn thì CẢNH BÁO chứ không chặn - đơn đã lưu, bác sĩ vẫn kê
      // được thuốc bệnh nhân cần. Nói rõ thiếu thuốc nào để dược sĩ biết đường nhập.
      const short = view.stockCheck.filter((s) => s.insufficientStock);
      if (short.length > 0) {
        toast.show(
          `Đã lưu đơn thuốc. Lưu ý kho đang thiếu: ${short
            .map((s) => `${s.medicationName} (cần ${s.requested}, còn ${s.availableQuantity})`)
            .join('; ')}`,
          'error',
        );
      } else {
        toast.show('Đã lưu đơn thuốc', 'success');
      }
      void queryClient.invalidateQueries({ queryKey: ['medical-record'] });
    },
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Lưu đơn thuốc thất bại', 'error'),
  });

  function updateLine(index: number, patch: Partial<PrescriptionLine>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  return (
    <Section title="Đơn thuốc">
      {prescriptions.length === 0 ? (
        <p className="text-sm text-muted">Chưa kê đơn thuốc nào.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {prescriptions.map((prescription: Prescription) => (
            <div key={prescription.id} className="rounded border border-border p-3 text-sm">
              <ul className="list-inside list-disc">
                {prescription.items.map((item) => (
                  <li key={item.id}>
                    {item.medication?.item.itemName ?? item.medicationId} — {item.quantity}{' '}
                    {item.medication?.unit ?? ''} — {item.dosage}
                    {item.frequency ? ` — ${item.frequency}` : ''} — {item.durationDays} ngày —{' '}
                    {MEDICATION_ROUTE_LABEL_VI[item.route] ?? item.route}
                    {item.instructions ? ` — ${item.instructions}` : ''}
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-muted">
                Trạng thái: {PRESCRIPTION_STATUS_LABEL_VI[prescription.status] ?? prescription.status}
              </p>
              {prescription.notes && (
                <p className="mt-1 text-muted">Ghi chú: {prescription.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {!readOnly &&
        (examination ? (
          <form
            className="mt-4 flex flex-col gap-3 border-t border-border pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              addMutation.mutate();
            }}
          >
            {lines.map((line, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_2fr]"
              >
                <Select
                  value={line.medicationId}
                  onChange={(value) => updateLine(index, { medicationId: value })}
                  options={medicationOptions}
                />
                <Input
                  type="number"
                  min={1}
                  placeholder="Số lượng"
                  value={line.quantity}
                  onChange={(e) => updateLine(index, { quantity: e.target.value })}
                />
                <Input
                  placeholder="Liều dùng"
                  value={line.dosage}
                  onChange={(e) => updateLine(index, { dosage: e.target.value })}
                />
                <Input
                  placeholder="Tần suất"
                  value={line.frequency}
                  onChange={(e) => updateLine(index, { frequency: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Số ngày"
                  value={line.durationDays}
                  onChange={(e) => updateLine(index, { durationDays: e.target.value })}
                />
                <Select
                  value={line.route}
                  onChange={(value) => updateLine(index, { route: value as MedicationRoute })}
                  options={Object.values(MedicationRoute).map((route) => ({
                    value: route,
                    label: MEDICATION_ROUTE_LABEL_VI[route],
                  }))}
                />
                <Input
                  placeholder="Hướng dẫn (tuỳ chọn)"
                  value={line.instructions}
                  onChange={(e) => updateLine(index, { instructions: e.target.value })}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-fit"
              onClick={() => setLines((prev) => [...prev, { ...EMPTY_LINE }])}
            >
              + Thêm thuốc
            </Button>
            <Input
              label="Ghi chú đơn thuốc"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button
              type="submit"
              className="w-fit"
              loading={addMutation.isPending}
              disabled={!lines.some((l) => l.medicationId)}
            >
              Lưu đơn thuốc
            </Button>
          </form>
        ) : (
          <p className="mt-4 border-t border-border pt-4 text-sm text-muted">
            Cần lưu sinh hiệu trước khi kê đơn thuốc.
          </p>
        ))}
    </Section>
  );
}
