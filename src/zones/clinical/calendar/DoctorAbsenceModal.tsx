import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/appointments.api';
import { Button, Input, Modal, useToast } from '@/components/basic';
import { getErrorMessage } from '@/utils/errors';
import { formatTime } from '@/utils/format';

/**
 * Báo bác sĩ nghỉ đột xuất trong một ngày.
 *
 * Backend đóng lịch của họ ngày đó rồi chuyển từng ca CHƯA tiếp nhận sang một bác sĩ
 * khác đang trống cùng khung giờ. Ca không tìm được người thay KHÔNG bị hủy — chúng
 * hiện ra ở đây kèm số điện thoại để lễ tân gọi dời lịch.
 */
export function DoctorAbsenceModal({
  open,
  doctorId,
  doctorName,
  date,
  onClose,
}: {
  open: boolean;
  doctorId: string;
  doctorName: string;
  date: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof appointmentsApi.doctorAbsence>
  > | null>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setResult(null);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      appointmentsApi.doctorAbsence({ doctorId, date, reason: reason.trim() || undefined }),
    onSuccess: (data) => {
      setResult(data);
      void queryClient.invalidateQueries({ queryKey: ['staff-calendar-week'] });
      void queryClient.invalidateQueries({ queryKey: ['staff-calendar-day'] });
      void queryClient.invalidateQueries({ queryKey: ['staff-calendar-month'] });
      toast.show(
        `Đã đóng lịch ngày ${date}. Chuyển được ${data.reassigned.length}/${data.total} ca.`,
        data.unresolved.length > 0 ? 'info' : 'success',
      );
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Báo nghỉ — ${doctorName}`}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
          {!result && (
            <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
              Xác nhận nghỉ ngày {date}
            </Button>
          )}
        </>
      }
    >
      {result ? (
        <div className="flex flex-col gap-4 text-sm">
          <p>
            Tổng cộng <strong>{result.total}</strong> ca trong ngày. Đã chuyển{' '}
            <strong>{result.reassigned.length}</strong> ca sang bác sĩ khác.
          </p>

          {result.reassigned.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-muted">
              {result.reassigned.map((item) => (
                <li key={item.appointmentId}>Đã chuyển sang {item.newDoctorName}</li>
              ))}
            </ul>
          )}

          {result.unresolved.length > 0 && (
            <div className="rounded border border-destructive/40 bg-destructive/5 p-3">
              <p className="font-medium text-destructive">
                {result.unresolved.length} ca chưa tìm được bác sĩ thay — cần gọi khách để dời lịch:
              </p>
              <ul className="mt-2 space-y-1">
                {result.unresolved.map((item) => (
                  <li key={item.appointmentId}>
                    {formatTime(item.startAt)} · {item.petName} · {item.ownerPhone}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Lịch của {doctorName} trong ngày {date} sẽ được đóng lại. Các ca chưa tiếp nhận được
            chuyển sang bác sĩ khác đang trống cùng khung giờ; ca không có người thay vẫn giữ
            nguyên và được liệt kê để bạn liên hệ khách.
          </p>
          <Input
            label="Lý do nghỉ"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Bác sĩ bị ốm đột xuất"
          />
        </div>
      )}
    </Modal>
  );
}
