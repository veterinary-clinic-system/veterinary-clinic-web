import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/appointments.api';
import { Alert, Button, Modal, Textarea, useToast } from '@/components/basic';
import { Appointment } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatDateTime } from '@/utils/format';

export interface MarkNoShowDialogProps {
  /** `null` = đóng. Truyền lịch hẹn vào để mở. */
  appointment: Appointment | null;
  onClose: () => void;
}

/**
 * Đánh dấu "khách không đến" (FR-06-03).
 *
 * Thay `window.prompt` dùng trước đây. Ngoài chuyện hộp thoại trình duyệt chặn cả tab,
 * nó còn có một vấn đề riêng ở đây: nó KHÔNG nói rõ đang đánh dấu lịch hẹn nào. Lễ tân
 * rà lịch cuối ngày thường mở liên tiếp năm sáu hàng, và một hộp thoại chỉ ghi "Ghi chú
 * (tuỳ chọn)" thì không có cách nào biết mình đang ở hàng nào.
 *
 * Ghi chú là TUỲ CHỌN ở đây, khác với huỷ lịch (bắt buộc có lý do): backend chỉ yêu cầu
 * lý do cho `cancel`. Không tự thêm một ràng buộc mà API không đòi - nó chỉ làm chậm
 * một thao tác lặp lại nhiều lần.
 */
export function MarkNoShowDialog({ appointment, onClose }: MarkNoShowDialogProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');

  const mutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      appointmentsApi.markNoShow(id, reason),
    onSuccess: (result) => {
      toast.show(`Đã đánh dấu ${result.pet?.name ?? 'lịch hẹn'} không đến.`, 'success');
      void queryClient.invalidateQueries({ queryKey: ['appointments-list'] });
      setNote('');
      onClose();
    },
  });

  return (
    <Modal
      open={Boolean(appointment)}
      onClose={() => {
        if (!mutation.isPending) onClose();
      }}
      title="Đánh dấu khách không đến"
      className="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Huỷ
          </Button>
          <Button
            loading={mutation.isPending}
            onClick={() =>
              appointment &&
              mutation.mutate({ id: appointment.id, reason: note.trim() || undefined })
            }
          >
            Xác nhận không đến
          </Button>
        </>
      }
    >
      {appointment && (
        <p className="text-sm text-muted">
          Lịch hẹn của{' '}
          <span className="font-medium text-foreground">{appointment.pet?.name ?? 'thú cưng'}</span>{' '}
          lúc <span className="font-medium text-foreground">{formatDateTime(appointment.startAt)}</span>
          {appointment.doctor?.fullName && ` với ${appointment.doctor.fullName}`}.
        </p>
      )}

      <Textarea
        label="Ghi chú (không bắt buộc)"
        className="mt-4"
        rows={2}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Ví dụ: đã gọi hai lần không liên lạc được."
      />

      {mutation.isError && (
        <Alert tone="danger" className="mt-4">
          {getErrorMessage(mutation.error, 'Không cập nhật được lịch hẹn.')}
        </Alert>
      )}
    </Modal>
  );
}
