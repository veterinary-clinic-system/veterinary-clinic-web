import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/appointments.api';
import { queueApi } from '@/api/queue.api';
import { Button, Modal, Select, Table, useToast } from '@/components/basic';
import type { Column } from '@/components/basic';
import { Appointment, AppointmentStatus, PriorityColor, PRIORITY_COLOR_LABEL_VI } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatTime } from '@/utils/format';

/** Trạng thái lịch hẹn còn "chờ khách đến" - đủ điều kiện để lễ tân bấm check-in. */
const CHECK_IN_ELIGIBLE = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED];

export function CheckInModal({
  open,
  branchId,
  date,
  onClose,
  onDone,
}: {
  open: boolean;
  branchId: string;
  date: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [priorityColor, setPriorityColor] = useState<string>('');

  const appointmentsQuery = useQuery({
    queryKey: ['staff-appointments', 'check-in', branchId, date],
    queryFn: () =>
      appointmentsApi.list({
        branchId,
        date,
        limit: 100,
        sortBy: 'startAt',
        sortOrder: 'ASC',
      }),
    enabled: open && Boolean(branchId),
  });

  const checkInMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      queueApi.checkIn({
        appointmentId,
        priorityColor: (priorityColor || undefined) as PriorityColor | undefined,
      }),
    onSuccess: (entry) => {
      toast.show(`Đã check-in — số thứ tự ${entry.ticketNumber}.`, 'success');
      onDone();
      onClose();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const pending = (appointmentsQuery.data?.data ?? []).filter((a) =>
    CHECK_IN_ELIGIBLE.includes(a.status),
  );

  const columns: Column<Appointment>[] = [
    { key: 'startAt', header: 'Giờ hẹn', render: (row) => formatTime(row.startAt) },
    { key: 'pet', header: 'Thú cưng', render: (row) => row.pet?.name ?? '—' },
    {
      key: 'owner',
      header: 'Chủ nuôi',
      render: (row) => `${row.pet?.owner?.fullName ?? '—'} · ${row.pet?.owner?.phone ?? '—'}`,
    },
    { key: 'doctor', header: 'Bác sĩ', render: (row) => row.doctor?.fullName ?? '—' },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button
          size="sm"
          loading={checkInMutation.isPending && checkInMutation.variables === row.id}
          onClick={() => checkInMutation.mutate(row.id)}
        >
          Đã đến
        </Button>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Lịch hẹn ngày ${date} chưa check-in`}
      className="max-w-4xl"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Mức ưu tiên gán khi check-in (tùy chọn)"
          value={priorityColor}
          onChange={setPriorityColor}
          options={[
            { value: '', label: 'Giữ nguyên mức của lịch hẹn' },
            ...Object.values(PriorityColor).map((color) => ({
              value: color,
              label: PRIORITY_COLOR_LABEL_VI[color],
            })),
          ]}
        />
        <Table
          columns={columns}
          data={pending}
          getRowId={(row) => row.id}
          loading={appointmentsQuery.isLoading}
          emptyMessage="Không còn lịch hẹn nào chờ check-in trong ngày."
        />
      </div>
    </Modal>
  );
}
