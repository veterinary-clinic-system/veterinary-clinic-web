import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doctorsApi } from '@/api/doctors.api';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DatePicker,
  EmptyState,
  ErrorState,
  Icon,
  Input,
  SkeletonText,
  useToast,
} from '@/components/basic';
import { getErrorMessage } from '@/utils/errors';
import { formatDate } from '@/utils/format';

/**
 * Nghỉ ngoài lịch: những khoảng bác sĩ bận trong một NGÀY cụ thể, chồng lên ca tuần.
 *
 * Ngày để trống thì nút bị khoá thay vì gọi API rồi nhận lỗi - đây là ràng buộc biết
 * trước, không cần đi một vòng qua máy chủ mới nói cho người dùng.
 */
export function BreaksPanel({ doctorId }: { doctorId: string }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [date, setDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('13:00');
  const [reason, setReason] = useState('');

  const breaksQuery = useQuery({
    queryKey: ['doctor-breaks', doctorId],
    queryFn: () => doctorsApi.getBreaks(doctorId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      doctorsApi.createBreak(doctorId, {
        date: date!,
        startTime,
        endTime,
        reason: reason || undefined,
      }),
    onSuccess: () => {
      toast.show('Đã thêm lịch nghỉ.', 'success');
      setReason('');
      void queryClient.invalidateQueries({ queryKey: ['doctor-breaks', doctorId] });
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (date) createMutation.mutate();
  }

  const breaks = breaksQuery.data ?? [];

  return (
    <Card as="section">
      <CardHeader>
        <CardTitle>Nghỉ ngoài lịch</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-5 pt-0">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <DatePicker label="Ngày" required value={date} onChange={setDate} className="w-44" />
          <Input
            label="Từ"
            type="time"
            required
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className="w-32"
          />
          <Input
            label="Đến"
            type="time"
            required
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className="w-32"
          />
          <Input
            label="Lý do"
            hint="Không bắt buộc"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="w-52"
          />
          <Button type="submit" disabled={!date} loading={createMutation.isPending}>
            <Icon name="plus" className="h-4 w-4" />
            Thêm lịch nghỉ
          </Button>
        </form>

        {breaksQuery.isLoading ? (
          <SkeletonText lines={3} />
        ) : breaksQuery.isError ? (
          <ErrorState title="Không tải được lịch nghỉ" onRetry={() => void breaksQuery.refetch()} />
        ) : breaks.length === 0 ? (
          <EmptyState
            title="Không có lịch nghỉ nào"
            description="Bác sĩ nhận lịch bình thường theo ca tuần bên cạnh."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {breaks.map((item) => (
              <li key={item.id} className="rounded-lg border border-border px-3 py-2 text-data">
                <span className="font-medium text-foreground">{formatDate(item.date)}</span>{' '}
                <span className="text-muted">
                  {item.startTime} – {item.endTime}
                </span>
                {item.reason && <span className="text-muted"> · {item.reason}</span>}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
