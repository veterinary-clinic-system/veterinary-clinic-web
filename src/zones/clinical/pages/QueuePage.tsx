import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { vi } from 'date-fns/locale';
import { branchesApi } from '@/api/branches.api';
import { queueApi } from '@/api/queue.api';
import {
  Badge,
  Button,
  Icon,
  Input,
  PageHeader,
  Select,
  StatTile,
  Table,
  TriageBadge,
  usePagination,
  useToast,
} from '@/components/basic';
import type { Column } from '@/components/basic';
import {
  QueueEntry,
  QueueSource,
  QueueStatus,
  QUEUE_SOURCE_LABEL_VI,
  QUEUE_STATUS_LABEL_VI,
} from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatTime } from '@/utils/format';
import { AssignDoctorModal } from '../queue/AssignDoctorModal';
import { CancelQueueEntryDialog } from '../queue/CancelQueueEntryDialog';
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
  const [cancelTarget, setCancelTarget] = useState<QueueEntry | null>(null);

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
        row.priorityColor ? <TriageBadge color={row.priorityColor} /> : <span className="text-muted">—</span>,
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
      /*
        Hiện THỜI GIAN ĐÃ CHỜ, không chỉ giờ check-in. "Đã chờ 40 phút" là con số dẫn
        tới hành động (gọi ai tiếp theo); "vào lúc 09:15" bắt lễ tân tự trừ trong đầu,
        và giữa giờ cao điểm thì họ sẽ không trừ.
      */
      key: 'checkedInAt',
      header: 'Đã chờ',
      render: (row) =>
        isFinished(row.status) ? (
          <span className="tabular-nums text-muted">{formatTime(row.checkedInAt)}</span>
        ) : (
          <span className="tabular-nums">
            {formatDistanceToNowStrict(new Date(row.checkedInAt), { locale: vi })}
          </span>
        ),
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
            <Button size="sm" variant="ghost" onClick={() => setCancelTarget(row)}>
              Huỷ lượt
            </Button>
          )}
        </div>
      ),
    },
  ];

  const entries = queueQuery.data ?? [];
  /*
    "Đang chờ" gồm cả WAITING lẫn ASSIGNED: với người ngồi ngoài phòng chờ, đã gán bác
    sĩ hay chưa không đổi việc gì - họ vẫn đang đợi được gọi. Đếm riêng WAITING làm ô
    này hiện 0 trong khi vẫn còn người chờ, đúng thứ nó phải cảnh báo.
  */
  const waiting = entries.filter(
    (e) => e.status === QueueStatus.WAITING || e.status === QueueStatus.ASSIGNED,
  ).length;
  const inRoom = entries.filter((e) => e.status === QueueStatus.IN_ROOM).length;

  // Hàng chờ một ngày của một chi nhánh trả về trong một lần gọi - cắt trang ở client
  // giữ nguyên thứ tự ưu tiên backend đã sắp.
  const { page, setPage, pageItems } = usePagination(entries, PAGE_SIZE, [
    branchId,
    date,
    showFinished,
  ]);

  return (
    <div className="flex flex-col gap-stack">
      <PageHeader
        title="Hàng chờ"
        description="Danh sách tiếp nhận trong ngày, tự làm mới mỗi 30 giây."
        actions={
          <>
            <Button variant="secondary" onClick={() => setCheckInOpen(true)} disabled={!branchId}>
              <Icon name="check" className="h-4 w-4" />
              Khách đã đến
            </Button>
            <Button onClick={() => setWalkInOpen(true)} disabled={!branchId}>
              <Icon name="plus" className="h-4 w-4" />
              Khách vãng lai
            </Button>
          </>
        }
      />

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
      </div>

      {/*
        Hai con số này là thứ lễ tân liếc mắt nhiều nhất trong ngày, nên tách khỏi thanh
        bộ lọc thành ô riêng: nhét chúng vào cuối một hàng bộ lọc thì chúng bị đọc như
        một nhãn phụ của ô lọc bên cạnh.
      */}
      <div className="grid grid-cols-2 gap-4 sm:max-w-md">
        <StatTile
          label="Đang chờ"
          value={waiting}
          icon="queue"
          tone={waiting > 4 ? 'warning' : 'default'}
        />
        <StatTile label="Trong phòng khám" value={inRoom} icon="stethoscope" />
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

      {/* Huỷ lượt chờ kéo theo lịch hẹn sang "đã huỷ" và ghi lý do (FR-05-04). */}
      <CancelQueueEntryDialog
        entry={cancelTarget}
        loading={updateMutation.isPending}
        onClose={() => setCancelTarget(null)}
        onConfirm={(reason) => {
          if (!cancelTarget) return;
          updateMutation.mutate(
            { id: cancelTarget.id, status: QueueStatus.CANCELLED, reason },
            { onSuccess: () => setCancelTarget(null) },
          );
        }}
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
