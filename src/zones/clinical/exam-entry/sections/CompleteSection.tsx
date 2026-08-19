import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalRecordsApi } from '@/api/medical-records.api';
import { Button, useToast } from '@/components/basic';
import { MedicalRecord } from '@/types/models';
import { extractApiMessage } from '../api-utils';
import { Section } from '../Section';

/**
 * Chốt hồ sơ. Một hành động không lùi được, nên có bước xác nhận: sau khi bấm, BR-08
 * khoá toàn bộ hồ sơ và lịch hẹn chuyển sang COMPLETED.
 */
export function CompleteSection({ record, readOnly }: { record: MedicalRecord; readOnly: boolean }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);

  const completeMutation = useMutation({
    mutationFn: () => medicalRecordsApi.complete(record.id),
    onSuccess: () => {
      toast.show('Đã hoàn tất hồ sơ bệnh án', 'success');
      void queryClient.invalidateQueries({ queryKey: ['medical-record'] });
      void queryClient.invalidateQueries({ queryKey: ['appointment'] });
      void queryClient.invalidateQueries({ queryKey: ['queue'] });
    },
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Hoàn tất thất bại', 'error'),
  });

  if (readOnly) return null;

  return (
    <Section title="Hoàn tất">
      {confirming ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            Sau khi hoàn tất, hồ sơ <strong>không sửa được nữa</strong> (BR-08) và lịch hẹn sẽ
            chuyển sang trạng thái hoàn tất. Bạn chắc chắn chứ?
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              loading={completeMutation.isPending}
              onClick={() => completeMutation.mutate()}
            >
              Xác nhận hoàn tất
            </Button>
            <Button type="button" variant="secondary" onClick={() => setConfirming(false)}>
              Huỷ
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" className="w-fit" onClick={() => setConfirming(true)}>
          Hoàn tất hồ sơ bệnh án
        </Button>
      )}
    </Section>
  );
}
