import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/appointments.api';
import { Alert, Button, Modal, Textarea, useToast } from '@/components/basic';
import { Appointment } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatDateTime } from '@/utils/format';

export interface MarkNoShowDialogProps {
  
  appointment: Appointment | null;
  onClose: () => void;
}

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
