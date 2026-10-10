import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/appointments.api';
import { queueApi } from '@/api/queue.api';
import { Button, Modal, Select, Table, useToast } from '@/components/basic';
import type { Column } from '@/components/basic';
import { Appointment, AppointmentStatus, PriorityColor, PRIORITY_COLOR_LABEL_VI } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatTime } from '@/utils/format';

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
    {
      key: 'startAt',
      header: 'Giờ hẹn',
      width: '100px',
      minWidth: '90px',
      className: 'whitespace-nowrap tabular-nums font-medium text-foreground',
      render: (row) => formatTime(row.startAt),
    },
    {
      key: 'pet',
      header: 'Thú cưng',
      width: '160px',
      minWidth: '140px',
      className: 'whitespace-nowrap font-semibold text-primary',
      render: (row) => row.pet?.name ?? '—',
    },
    {
      key: 'owner',
      header: 'Chủ nuôi',
      width: '220px',
      minWidth: '180px',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className="text-muted">
          <span className="font-medium text-foreground">{row.pet?.owner?.fullName ?? '—'}</span> · <span className="tabular-nums">{row.pet?.owner?.phone ?? '—'}</span>
        </span>
      ),
    },
    {
      key: 'doctor',
      header: 'Bác sĩ',
      width: '160px',
      minWidth: '140px',
      className: 'whitespace-nowrap text-muted',
      render: (row) => row.doctor?.fullName ?? '—',
    },
    {
      key: 'actions',
      header: '',
      width: '180px',
      minWidth: '160px',
      align: 'right',
      className: 'whitespace-nowrap',
      render: (row) => (
        <div className="flex justify-end">
          <Button
            size="sm"
            className="whitespace-nowrap"
            loading={checkInMutation.isPending && checkInMutation.variables === row.id}
            onClick={() => checkInMutation.mutate(row.id)}
          >
            Tiếp nhận (Check-in)
          </Button>
        </div>
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
          minWidth="750px"
          columns={columns}
          data={pending}
          getRowId={(row) => row.id}
          loading={appointmentsQuery.isLoading}
          error={appointmentsQuery.isError}
          onRetry={() => void appointmentsQuery.refetch()}
          emptyMessage="Không còn lịch hẹn nào chờ check-in trong ngày."
        />
      </div>
    </Modal>
  );
}
