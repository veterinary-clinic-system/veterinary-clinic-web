import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/appointments.api';
import { Alert, Button, Modal, Textarea } from '@/components/basic';
import { getErrorMessage } from '@/utils/errors';

const MIN_REASON_LENGTH = 3;

export interface CancelAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  appointmentId: string;
  
  summary: string;
  onCancelled?: () => void;
}

export function CancelAppointmentDialog({
  open,
  onClose,
  appointmentId,
  summary,
  onCancelled,
}: CancelAppointmentDialogProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  const mutation = useMutation({
    mutationFn: (value: string) => appointmentsApi.cancel(appointmentId, value),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setReason('');
      setTouched(false);
      onClose();
      onCancelled?.();
    },
  });

  const tooShort = reason.trim().length < MIN_REASON_LENGTH;

  function handleClose() {
    if (mutation.isPending) return;
    setTouched(false);
    mutation.reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Huỷ lịch hẹn"
      className="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={mutation.isPending}>
            Giữ lịch hẹn
          </Button>
          <Button
            variant="destructive"
            loading={mutation.isPending}
            onClick={() => {
              setTouched(true);
              if (!tooShort) mutation.mutate(reason.trim());
            }}
          >
            Huỷ lịch hẹn
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">
        Bạn sắp huỷ lịch hẹn <span className="font-medium text-foreground">{summary}</span>. Khung
        giờ này sẽ được trả lại cho khách khác, và bạn cần đặt lại nếu đổi ý.
      </p>

      <Textarea
        label="Lý do huỷ"
        className="mt-4"
        rows={3}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        onBlur={() => setTouched(true)}
        placeholder="Ví dụ: bận đột xuất, bé đã khoẻ lại, muốn đổi sang chi nhánh khác..."
        error={touched && tooShort ? `Vui lòng nhập ít nhất ${MIN_REASON_LENGTH} ký tự.` : undefined}
        hint="Phòng khám cần lý do để sắp xếp lại lịch bác sĩ."
      />

      {mutation.isError && (
        <Alert tone="danger" className="mt-4">
          {getErrorMessage(mutation.error, 'Không huỷ được lịch hẹn. Vui lòng thử lại.')}
        </Alert>
      )}
    </Modal>
  );
}
