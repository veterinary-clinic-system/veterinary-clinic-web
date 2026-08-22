import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vaccinationsApi } from '@/api/vaccinations.api';
import { Button, Input, Select, useToast } from '@/components/basic';
import { MedicalRecord } from '@/types/models';
import { formatDate } from '@/utils/format';
import { extractApiMessage } from '../api-utils';
import { Section } from '../Section';

/**
 * Khối tiêm chủng trong lúc khám — acceptance P9-T3: "ghi nhận được ngay trong màn hình
 * khám, không phải rời trang".
 *
 * Danh mục vaccine được lọc theo `petId`: backend suy ra loài từ giống của con này, và
 * chỉ trả vaccine dùng được cho loài đó (cộng các vaccine dùng cho mọi loài). Đưa cả
 * danh mục ra rồi để bác sĩ tự tránh là mở đường cho một mũi vaccine chó tiêm vào mèo.
 */
export function VaccinationsSection({
  record,
  readOnly,
}: {
  record: MedicalRecord;
  readOnly: boolean;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [vaccineId, setVaccineId] = useState('');
  const [notes, setNotes] = useState('');

  const vaccinesQuery = useQuery({
    queryKey: ['vaccines', 'for-pet', record.petId],
    queryFn: () => vaccinationsApi.catalog({ petId: record.petId, limit: 100 }),
  });
  const vaccines = vaccinesQuery.data?.data ?? [];

  const givenQuery = useQuery({
    queryKey: ['vaccinations', 'by-record', record.id],
    queryFn: () => vaccinationsApi.byMedicalRecord(record.id),
  });
  const given = givenQuery.data ?? [];

  const addMutation = useMutation({
    mutationFn: () =>
      vaccinationsApi.create({
        petId: record.petId,
        vaccineId,
        medicalRecordId: record.id,
        notes: notes || undefined,
      }),
    onSuccess: (view) => {
      setVaccineId('');
      setNotes('');
      toast.show(
        view.vaccination.nextDueDate
          ? `Đã ghi nhận mũi tiêm. Hẹn nhắc lại ${formatDate(view.vaccination.nextDueDate)}.`
          : 'Đã ghi nhận mũi tiêm.',
        'success',
      );
      void queryClient.invalidateQueries({ queryKey: ['vaccinations'] });
      void queryClient.invalidateQueries({ queryKey: ['medical-record'] });
    },
    // BR-11 (vaccine hết hạn) và hết hàng đều trả 409 kèm thông báo đã đủ rõ - hiện
    // nguyên văn thay vì dịch lại một lần nữa ở client.
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Ghi nhận thất bại', 'error'),
  });

  return (
    <Section title="Tiêm chủng">
      {given.length === 0 ? (
        <p className="text-sm text-muted">Chưa ghi nhận mũi tiêm nào trong lần khám này.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {given.map((view) => (
            <li key={view.vaccination.id} className="rounded border border-border p-3 text-sm">
              <p className="font-medium">
                {view.vaccination.vaccine?.item.itemName ?? '—'} — mũi {view.vaccination.doseNumber}
                {view.vaccination.vaccine ? `/${view.vaccination.vaccine.doseCount}` : ''}
              </p>
              <p className="text-muted">
                Lô {view.vaccination.batchNo ?? '—'}
                {view.vaccination.expiryDate
                  ? ` · HSD ${formatDate(view.vaccination.expiryDate)}`
                  : ''}
                {view.vaccination.nextDueDate
                  ? ` · Hẹn nhắc ${formatDate(view.vaccination.nextDueDate)}`
                  : ' · Không nhắc lại'}
              </p>
              {view.vaccination.notes && (
                <p className="mt-1 text-muted">{view.vaccination.notes}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <form
          className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (vaccineId) addMutation.mutate();
          }}
        >
          <Select
            label="Vaccine"
            value={vaccineId}
            onChange={setVaccineId}
            options={[
              { value: '', label: '— Chọn vaccine —' },
              ...vaccines.map((vaccine) => ({
                value: vaccine.id,
                label: `${vaccine.item.itemName} (${vaccine.diseasePrevented})`,
              })),
            ]}
            error={
              vaccinesQuery.isError
                ? 'Không tải được danh mục vaccine. Tải lại trang để thử lại.'
                : undefined
            }
          />
          <Input
            label="Ghi chú"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button type="submit" loading={addMutation.isPending} disabled={!vaccineId}>
            Ghi nhận mũi tiêm
          </Button>
        </form>
      )}

      {!readOnly && vaccines.length === 0 && !vaccinesQuery.isLoading && (
        <p className="mt-2 text-sm text-muted">
          Chưa có vaccine nào trong danh mục dùng được cho loài này.
        </p>
      )}
    </Section>
  );
}
