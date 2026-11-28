import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DoctorBreak, doctorsApi } from '@/api/doctors.api';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  ConfirmDialog,
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

function toTimeInputValue(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function toDateInputValue(value: string): string {
  return value.length >= 10 ? value.slice(0, 10) : value;
}

function isValidTimeRange(start: string, end: string): boolean {
  return Boolean(start) && Boolean(end) && toTimeInputValue(start) < toTimeInputValue(end);
}

export interface BreaksPanelProps {
  doctorId: string;
  readOnly?: boolean;
}

export function BreaksPanel({ doctorId, readOnly = false }: BreaksPanelProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [date, setDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('13:00');
  const [reason, setReason] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editReason, setEditReason] = useState('');
  const [deleting, setDeleting] = useState<DoctorBreak | null>(null);

  useEffect(() => {
    setEditingId(null);
    setDeleting(null);
  }, [doctorId]);

  const breaksQuery = useQuery({
    queryKey: ['doctor-breaks', doctorId],
    queryFn: () => doctorsApi.getBreaks(doctorId),
  });

  function invalidateBreakQueries() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ['doctor-breaks', doctorId] }),
      queryClient.invalidateQueries({ queryKey: ['staff-calendar-week'] }),
      queryClient.invalidateQueries({ queryKey: ['staff-calendar-day'] }),
      queryClient.invalidateQueries({ queryKey: ['staff-calendar-month'] }),
    ]);
  }

  const createMutation = useMutation({
    mutationFn: () =>
      doctorsApi.createBreak(doctorId, {
        date: date!,
        startTime: toTimeInputValue(startTime),
        endTime: toTimeInputValue(endTime),
        reason: reason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.show('Đã thêm lịch nghỉ.', 'success');
      setReason('');
      void invalidateBreakQueries();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: {
      breakId: string;
      date: string;
      startTime: string;
      endTime: string;
      reason: string | null;
    }) =>
      doctorsApi.updateBreak(payload.breakId, {
        date: payload.date,
        startTime: payload.startTime,
        endTime: payload.endTime,
        reason: payload.reason,
      }),
    onSuccess: () => {
      toast.show('Đã cập nhật lịch nghỉ.', 'success');
      setEditingId(null);
      void invalidateBreakQueries();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (breakId: string) => doctorsApi.deleteBreak(breakId),
    onSuccess: () => {
      toast.show('Đã xóa lịch nghỉ.', 'success');
      if (deleting && editingId === deleting.id) {
        setEditingId(null);
      }
      setDeleting(null);
      void invalidateBreakQueries();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!date) return;
    if (!isValidTimeRange(startTime, endTime)) {
      toast.show('Giờ kết thúc phải sau giờ bắt đầu.', 'error');
      return;
    }
    createMutation.mutate();
  }

  function startEdit(item: DoctorBreak) {
    setEditingId(item.id);
    setEditDate(toDateInputValue(item.date));
    setEditStartTime(toTimeInputValue(item.startTime));
    setEditEndTime(toTimeInputValue(item.endTime));
    setEditReason(item.reason ?? '');
  }

  function handleEditSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editingId || !editDate) return;
    if (!isValidTimeRange(editStartTime, editEndTime)) {
      toast.show('Giờ kết thúc phải sau giờ bắt đầu.', 'error');
      return;
    }
    updateMutation.mutate({
      breakId: editingId,
      date: editDate,
      startTime: toTimeInputValue(editStartTime),
      endTime: toTimeInputValue(editEndTime),
      reason: editReason.trim() || null,
    });
  }

  const breaks = breaksQuery.data ?? [];

  return (
    <Card as="section">
      <CardHeader>
        <CardTitle>Nghỉ ngoài lịch</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-5 pt-0">
        {!readOnly && (
          <form
            aria-label="Thêm lịch nghỉ"
            onSubmit={handleSubmit}
            className="flex flex-wrap items-end gap-3"
          >
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
        )}

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
                {!readOnly && editingId === item.id ? (
                  <form
                    aria-label="Chỉnh sửa lịch nghỉ"
                    onSubmit={handleEditSubmit}
                    className="flex flex-wrap items-end gap-3"
                  >
                    <DatePicker
                      label="Ngày"
                      required
                      value={editDate}
                      onChange={setEditDate}
                      className="w-40"
                    />
                    <Input
                      label="Từ"
                      type="time"
                      required
                      value={editStartTime}
                      onChange={(event) => setEditStartTime(event.target.value)}
                      className="w-28"
                    />
                    <Input
                      label="Đến"
                      type="time"
                      required
                      value={editEndTime}
                      onChange={(event) => setEditEndTime(event.target.value)}
                      className="w-28"
                    />
                    <Input
                      label="Lý do"
                      value={editReason}
                      onChange={(event) => setEditReason(event.target.value)}
                      className="w-48"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!editDate}
                        loading={updateMutation.isPending}
                      >
                        Lưu
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={updateMutation.isPending}
                        onClick={() => setEditingId(null)}
                      >
                        Hủy
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>
                      <span className="font-medium text-foreground">{formatDate(item.date)}</span>{' '}
                      <span className="text-muted">
                        {toTimeInputValue(item.startTime)} – {toTimeInputValue(item.endTime)}
                      </span>
                      {item.reason && <span className="text-muted"> · {item.reason}</span>}
                    </span>
                    {!readOnly && (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(item)}
                        >
                          <Icon name="edit" className="h-4 w-4" />
                          Sửa
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleting(item)}
                        >
                          <Icon name="trash" className="h-4 w-4" />
                          Xóa
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardBody>

      {!readOnly && (
        <ConfirmDialog
          open={deleting !== null}
          onCancel={() => setDeleting(null)}
          onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
          title="Xóa lịch nghỉ?"
          description={
            deleting
              ? `${formatDate(deleting.date)} · ${toTimeInputValue(deleting.startTime)} – ${toTimeInputValue(deleting.endTime)}${deleting.reason ? ` (${deleting.reason})` : ''}. Khung giờ này sẽ mở lại theo ca làm việc của bác sĩ.`
              : ''
          }
          confirmLabel="Xóa lịch nghỉ"
          destructive
          loading={deleteMutation.isPending}
        />
      )}
    </Card>
  );
}
