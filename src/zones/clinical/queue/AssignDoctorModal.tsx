import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { doctorsApi } from '@/api/doctors.api';
import { queueApi } from '@/api/queue.api';
import { Button, Input, Modal, Select, useToast } from '@/components/basic';
import { QueueEntry } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';

export function AssignDoctorModal({
  entry,
  onClose,
  onDone,
}: {
  entry: QueueEntry | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [doctorId, setDoctorId] = useState('');
  const [startAt, setStartAt] = useState('');

  useEffect(() => {
    setDoctorId(entry?.doctorId ?? '');
    setStartAt('');
  }, [entry]);

  const doctorsQuery = useQuery({
    queryKey: ['doctors-public', entry?.branchId],
    queryFn: () => doctorsApi.listPublic(entry!.branchId),
    enabled: Boolean(entry),
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      queueApi.assignDoctor(entry!.id, {
        doctorId,
        startAt: startAt ? new Date(startAt).toISOString() : undefined,
      }),
    onSuccess: (updated) => {
      toast.show(`Đã gán bác sĩ ${updated.doctor?.fullName ?? ''}.`, 'success');
      onDone();
      onClose();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  return (
    <Modal
      open={Boolean(entry)}
      onClose={onClose}
      title={entry ? `Gán bác sĩ — số thứ tự ${entry.ticketNumber}` : ''}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={!doctorId}
            loading={assignMutation.isPending}
            onClick={() => assignMutation.mutate()}
          >
            Xác nhận
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          {entry?.pet?.name} — {entry?.service?.item?.itemName}
        </p>
        <Select
          label="Bác sĩ"
          value={doctorId}
          onChange={setDoctorId}
          options={(doctorsQuery.data ?? []).map((d) => ({ value: d.id, label: d.fullName }))}
          placeholder="— Chọn bác sĩ —"
        />
        <Input
          label="Giờ khám (tùy chọn)"
          type="date"
          value={startAt.slice(0, 10)}
          onChange={(e) =>
            setStartAt(e.target.value ? `${e.target.value}T${startAt.slice(11) || '09:00'}` : '')
          }
          hint="Bỏ trống để hệ thống tự chọn khung giờ trống sớm nhất còn lại hôm nay."
        />
        {startAt && (
          <Input
            label="Giờ bắt đầu"
            value={startAt.slice(11)}
            onChange={(e) => setStartAt(`${startAt.slice(0, 10)}T${e.target.value}`)}
            placeholder="HH:mm"
          />
        )}
      </div>
    </Modal>
  );
}
