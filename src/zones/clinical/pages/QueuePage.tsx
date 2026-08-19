import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { branchesApi } from '@/api/branches.api';
import { queueApi } from '@/api/queue.api';
import { Badge, Button, Input, Select, Table, usePagination, useToast } from '@/components/basic';
import type { Column } from '@/components/basic';
import {
  PRIORITY_COLOR_LABEL_VI,
  QueueEntry,
  QueueSource,
  QueueStatus,
  QUEUE_SOURCE_LABEL_VI,
  QUEUE_STATUS_LABEL_VI,
} from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatTime } from '@/utils/format';
import { triageColorClasses } from '@/utils/labels';
import { AssignDoctorModal } from '../queue/AssignDoctorModal';
import { CheckInModal } from '../queue/CheckInModal';
import { WalkInModal } from '../queue/WalkInModal';

const today = () => format(new Date(), 'yyyy-MM-dd');

const PAGE_SIZE = 20;

/**
 * Quầy lễ tân - hàng chờ trong ngày. Bốn thao tác của nhân viên:
 * xác nhận khách đã đến, tạo lượt khám không đặt lịch, đưa vào hàng chờ (cả hai thao
 * tác trên đều tạo một lượt chờ), và gán bác sĩ.
 *
 * Ba thao tác đó là ba Modal độc lập trong `../queue/` - tự có state, truy vấn và
 * mutation riêng. Trang này chỉ còn bảng chính, bộ lọc và lắp ráp ba Modal.
 */
export function QueuePage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [branchId, setBranchId] = useState('');
  const [date, setDate] = useState(today());
  const [showFinished, setShowFinished] = useState(false);

  const [walkInOpen, setWalkInOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<QueueEntry | null>(null);

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });

  // Chi nhánh đầu tiên được chọn sẵn để lễ tân mở trang là thấy hàng chờ ngay.
  useEffect(() => {
    if (!branchId && branchesQuery.data?.length) {
      setBranchId(branchesQuery.data[0].id);
    }
  }, [branchId, branchesQuery.data]);

  const queueParams = {
    branchId: branchId || undefined,
    date,
    status: showFinished ? Object.values(QueueStatus) : undefined,
  };

  const queueQuery = useQuery({
    queryKey: ['queue', queueParams],
    queryFn: () => queueApi.list(queueParams),
    enabled: Boolean(branchId),
    // Nhiều người cùng đứng ở quầy - làm mới định kỳ để không gọi trùng số thứ tự.
    refetchInterval: 30_000,
  });

  function invalidateQueue() {
    void queryClient.invalidateQueries({ queryKey: ['queue'] });
    void queryClient.invalidateQueries({ queryKey: ['staff-appointments'] });
  }

  const updateMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: QueueStatus; reason?: string }) =>
      queueApi.update(id, { status, reason }),
    onSuccess: (entry) => {
      toast.show(`Số ${entry.ticketNumber}: ${QUEUE_STATUS_LABEL_VI[entry.status]}.`, 'success');
      invalidateQueue();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  /**
   * Hủy lượt chờ kéo theo lịch hẹn sang "đã hủy" và ghi lý do (FR-05-04). Hỏi lý do
   * bằng prompt để không phải dựng thêm một modal nữa cho một ô nhập duy nhất; bỏ
   * trống vẫn hủy được, backend điền "Khách bỏ về trước khi được khám".
   */
  function cancelQueueEntry(entry: QueueEntry) {
    const reason = window.prompt(
      `Hủy lượt chờ số ${entry.ticketNumber} (${entry.pet?.name ?? 'thú cưng'}). Lý do:`,
      'Khách bỏ về trước khi được khám',
    );
    if (reason === null) return; // bấm Cancel
    updateMutation.mutate({ id: entry.id, status: QueueStatus.CANCELLED, reason: reason.trim() });
  }

  const columns: Column<QueueEntry>[] = [
    {
      key: 'ticketNumber',
      header: 'STT',
      render: (row) => <span className="text-lg font-semibold tabular-nums">{row.ticketNumber}</span>,
    },
    {
      key: 'pet',
      header: 'Thú cưng / Chủ nuôi',
      render: (row) => (
        <div className="flex flex-col">
          <Link
            to={`/staff/patients/${row.petId}`}
            className="font-medium text-primary hover:underline"
          >
            {row.pet?.name ?? '—'}
          </Link>
          <span className="text-xs text-muted">
            {row.pet?.owner?.fullName ?? '—'} · {row.pet?.owner?.phone ?? '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Nguồn',
      render: (row) => (
        <Badge variant={row.source === QueueSource.WALK_IN ? 'warning' : 'default'}>
          {QUEUE_SOURCE_LABEL_VI[row.source]}
        </Badge>
      ),
    },
    {
      key: 'priorityColor',
      header: 'Ưu tiên',
      render: (row) =>
        row.priorityColor ? (
          <span className={`rounded px-2 py-0.5 text-xs ${triageColorClasses(row.priorityColor)}`}>
            {PRIORITY_COLOR_LABEL_VI[row.priorityColor]}
          </span>
        ) : (
          '—'
        ),
    },
    { key: 'service', header: 'Dịch vụ', render: (row) => row.service?.item?.itemName ?? '—' },
    {
      key: 'doctor',
      header: 'Bác sĩ',
      render: (row) =>
        row.doctor ? (
          <span>{row.doctor.fullName}</span>
        ) : (
          <span className="text-muted">Chưa gán</span>
        ),
    },
    {
      key: 'checkedInAt',
      header: 'Vào lúc',
      render: (row) => formatTime(row.checkedInAt),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => <Badge variant={statusVariant(row.status)}>{QUEUE_STATUS_LABEL_VI[row.status]}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          {!isFinished(row.status) && (
            <Button size="sm" variant="secondary" onClick={() => setAssignTarget(row)}>
              {row.doctorId ? 'Đổi bác sĩ' : 'Gán bác sĩ'}
            </Button>
          )}
          {row.status === QueueStatus.ASSIGNED && (
            <Button
              size="sm"
              onClick={() => updateMutation.mutate({ id: row.id, status: QueueStatus.IN_ROOM })}
            >
              Gọi vào phòng
            </Button>
          )}
          {row.status === QueueStatus.IN_ROOM && (
            <>
              {row.appointmentId && (
                <Link
                  to={`/staff/appointments/${row.appointmentId}/exam`}
                  className="inline-flex h-8 items-center rounded border border-border px-3 text-sm hover:bg-surface-muted"
                >
                  Phiếu khám
                </Link>
              )}
              <Button
                size="sm"
                onClick={() => updateMutation.mutate({ id: row.id, status: QueueStatus.DONE })}
              >
                Khám xong
              </Button>
            </>
          )}
          {!isFinished(row.status) && (
            <Button size="sm" variant="ghost" onClick={() => cancelQueueEntry(row)}>
              Hủy lượt
            </Button>
          )}
        </div>
      ),
    },
  ];

  const entries = queueQuery.data ?? [];
  const waiting = entries.filter((e) => e.status === QueueStatus.WAITING).length;
  const inRoom = entries.filter((e) => e.status === QueueStatus.IN_ROOM).length;

  // Hàng chờ một ngày của một chi nhánh trả về trong một lần gọi - cắt trang ở client
  // giữ nguyên thứ tự ưu tiên backend đã sắp.
  const { page, setPage, pageItems } = usePagination(entries, PAGE_SIZE, [
    branchId,
    date,
    showFinished,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Hàng chờ</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setCheckInOpen(true)} disabled={!branchId}>
            Xác nhận khách đã đến
          </Button>
          <Button onClick={() => setWalkInOpen(true)} disabled={!branchId}>
            Khách vãng lai
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded border border-border bg-surface p-4">
        <Select
          label="Chi nhánh"
          value={branchId}
          onChange={setBranchId}
          options={(branchesQuery.data ?? []).map((b) => ({ value: b.id, label: b.branchName }))}
          placeholder="— Chọn chi nhánh —"
        />
        <Input label="Ngày" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <label className="flex h-10 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showFinished}
            onChange={(e) => setShowFinished(e.target.checked)}
          />
          Hiện cả lượt đã kết thúc
        </label>
        <div className="ml-auto flex gap-4 text-sm text-muted">
          <span>
            Đang chờ: <strong className="text-foreground">{waiting}</strong>
          </span>
          <span>
            Trong phòng: <strong className="text-foreground">{inRoom}</strong>
          </span>
        </div>
      </div>

      <Table
        columns={columns}
        data={pageItems}
        getRowId={(row) => row.id}
        loading={queueQuery.isLoading}
        emptyMessage={branchId ? 'Hàng chờ đang trống.' : 'Chọn một chi nhánh để xem hàng chờ.'}
        page={page}
        limit={PAGE_SIZE}
        total={entries.length}
        onPageChange={setPage}
      />

      <CheckInModal
        open={checkInOpen}
        branchId={branchId}
        date={date}
        onClose={() => setCheckInOpen(false)}
        onDone={invalidateQueue}
      />

      <WalkInModal
        open={walkInOpen}
        branchId={branchId}
        onClose={() => setWalkInOpen(false)}
        onDone={invalidateQueue}
      />

      <AssignDoctorModal
        entry={assignTarget}
        onClose={() => setAssignTarget(null)}
        onDone={invalidateQueue}
      />
    </div>
  );
}

function isFinished(status: QueueStatus): boolean {
  return status === QueueStatus.DONE || status === QueueStatus.CANCELLED;
}

function statusVariant(status: QueueStatus): 'default' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case QueueStatus.WAITING:
      return 'warning';
    case QueueStatus.ASSIGNED:
      return 'default';
    case QueueStatus.IN_ROOM:
      return 'default';
    case QueueStatus.DONE:
      return 'success';
    case QueueStatus.CANCELLED:
      return 'destructive';
  }
}
