import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doctorsApi } from '@/api/doctors.api';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Icon,
  Input,
  Select,
  SkeletonText,
  useToast,
} from '@/components/basic';
import type { DoctorShift } from '@/api/doctors.api';
import { getErrorMessage } from '@/utils/errors';
import { WEEKDAYS, weekdayLabel } from './weekdays';

/**
 * Ca làm việc lặp theo tuần của một bác sĩ.
 *
 * Xoá ca là thao tác không hoàn tác được và ảnh hưởng tới khung giờ khách đặt được, nên
 * đi qua `ConfirmDialog` - trước đây nó là một chữ "Xóa" nhỏ xíu, bấm nhầm là mất ca mà
 * không có cách nào lấy lại.
 */
export function ShiftsPanel({ doctorId }: { doctorId: string }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [deleting, setDeleting] = useState<DoctorShift | null>(null);

  const shiftsQuery = useQuery({
    queryKey: ['doctor-shifts', doctorId],
    queryFn: () => doctorsApi.getShifts(doctorId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      doctorsApi.createShift(doctorId, { dayOfWeek: Number(dayOfWeek), startTime, endTime }),
    onSuccess: () => {
      toast.show('Đã thêm ca làm việc.', 'success');
      void queryClient.invalidateQueries({ queryKey: ['doctor-shifts', doctorId] });
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (shiftId: string) => doctorsApi.deleteShift(shiftId),
    onSuccess: () => {
      toast.show('Đã xoá ca làm việc.', 'success');
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: ['doctor-shifts', doctorId] });
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createMutation.mutate();
  }

  const shifts = shiftsQuery.data ?? [];

  return (
    <Card as="section">
      <CardHeader>
        <CardTitle>Ca làm việc theo tuần</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-5 pt-0">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <Select
            label="Thứ"
            value={dayOfWeek}
            onChange={setDayOfWeek}
            options={WEEKDAYS.map((day) => ({ value: String(day.dayOfWeek), label: day.label }))}
            className="w-32"
          />
          <Input
            label="Bắt đầu"
            type="time"
            required
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className="w-32"
          />
          <Input
            label="Kết thúc"
            type="time"
            required
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className="w-32"
          />
          <Button type="submit" loading={createMutation.isPending}>
            <Icon name="plus" className="h-4 w-4" />
            Thêm ca
          </Button>
        </form>

        {shiftsQuery.isLoading ? (
          <SkeletonText lines={3} />
        ) : shiftsQuery.isError ? (
          <ErrorState
            title="Không tải được ca làm việc"
            onRetry={() => void shiftsQuery.refetch()}
          />
        ) : shifts.length === 0 ? (
          <EmptyState
            title="Bác sĩ này chưa có ca làm việc"
            description="Chưa có ca nào thì khách không đặt được lịch với bác sĩ. Thêm ít nhất một ca ở trên."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {shifts.map((shift) => (
              <li
                key={shift.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-data"
              >
                <span>
                  <span className="font-medium text-foreground">
                    {weekdayLabel(shift.dayOfWeek)}
                  </span>{' '}
                  <span className="text-muted">
                    {shift.startTime} – {shift.endTime}
                  </span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => setDeleting(shift)}>
                  <Icon name="trash" className="h-4 w-4" />
                  Xoá
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>

      <ConfirmDialog
        open={deleting !== null}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        title="Xoá ca làm việc?"
        description={
          deleting
            ? `${weekdayLabel(deleting.dayOfWeek)} ${deleting.startTime} – ${deleting.endTime}. Khách sẽ không đặt được lịch với bác sĩ trong khung giờ này nữa.`
            : ''
        }
        confirmLabel="Xoá ca"
        destructive
        loading={deleteMutation.isPending}
      />
    </Card>
  );
}
