import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { StockTakeListParams, stockTakesApi } from '@/api/inventory.api';
import { Badge, Button, Input, Modal, Select, Table, Textarea, useToast } from '@/components/basic';
import type { BadgeVariant, Column, SortOrder } from '@/components/basic';
import { STOCK_TAKE_STATUS_LABEL_VI, StockTake, StockTakeItem, StockTakeStatus } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatDate, formatDateTime } from '@/utils/format';

const LIMIT = 20;

const STATUS_VARIANT: Record<StockTakeStatus, BadgeVariant> = {
  [StockTakeStatus.DRAFT]: 'warning',
  [StockTakeStatus.CONFIRMED]: 'success',
  [StockTakeStatus.CANCELLED]: 'destructive',
};

/** SRS FR-18-03 — kiểm kê: chụp số hệ thống, nhập số đếm, xác nhận sinh điều chỉnh. */
export function StockTakePage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [branchId, setBranchId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | StockTakeStatus>('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');

  const [detailId, setDetailId] = useState<string | null>(null);
  /** Số đếm đang gõ, khoá theo id dòng. Chỉ giữ ở client tới khi bấm "Lưu số đếm". */
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [confirmNote, setConfirmNote] = useState('');

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });

  useEffect(() => {
    if (!branchId && branchesQuery.data?.length) {
      setBranchId(branchesQuery.data[0].id);
    }
  }, [branchId, branchesQuery.data]);

  const params: StockTakeListParams = {
    page,
    limit: LIMIT,
    sortBy,
    sortOrder,
    branchId: branchId || undefined,
    status: statusFilter || undefined,
  };

  const listQuery = useQuery({
    queryKey: ['stock-takes', params],
    queryFn: () => stockTakesApi.list(params),
    enabled: Boolean(branchId),
    placeholderData: (prev) => prev,
  });

  const detailQuery = useQuery({
    queryKey: ['stock-take', detailId],
    queryFn: () => stockTakesApi.getOne(detailId!),
    enabled: detailId !== null,
  });

  // Mở phiếu -> nạp số đếm đã lưu vào ô nhập để nhân viên đếm tiếp chỗ bỏ dở.
  useEffect(() => {
    const stockTake = detailQuery.data;
    if (!stockTake) return;
    setCounts(
      Object.fromEntries(
        (stockTake.items ?? []).map((line) => [
          line.id,
          line.countedQuantity === null ? '' : String(line.countedQuantity),
        ]),
      ),
    );
    setConfirmNote(stockTake.note ?? '');
  }, [detailQuery.data]);

  const createMutation = useMutation({
    mutationFn: () => stockTakesApi.create({ branchId }),
    onSuccess: (stockTake) => {
      toast.show(`Đã tạo phiếu ${stockTake.stockTakeCode}.`, 'success');
      setDetailId(stockTake.id);
      void queryClient.invalidateQueries({ queryKey: ['stock-takes'] });
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const saveCountsMutation = useMutation({
    mutationFn: () =>
      stockTakesApi.submitCounts(
        detailId!,
        Object.entries(counts)
          .filter(([, value]) => value !== '')
          .map(([stockTakeItemId, value]) => ({
            stockTakeItemId,
            countedQuantity: Number(value),
          })),
      ),
    onSuccess: () => {
      toast.show('Đã lưu số đếm.', 'success');
      void queryClient.invalidateQueries({ queryKey: ['stock-take'] });
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const confirmMutation = useMutation({
    mutationFn: () => stockTakesApi.confirm(detailId!, confirmNote || undefined),
    onSuccess: (stockTake) => {
      toast.show(`Đã xác nhận phiếu ${stockTake.stockTakeCode}, tồn kho đã điều chỉnh.`, 'success');
      void queryClient.invalidateQueries({ queryKey: ['stock-takes'] });
      void queryClient.invalidateQueries({ queryKey: ['stock-take'] });
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
      void queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => stockTakesApi.cancel(detailId!),
    onSuccess: () => {
      toast.show('Đã hủy phiếu kiểm kê.', 'success');
      void queryClient.invalidateQueries({ queryKey: ['stock-takes'] });
      void queryClient.invalidateQueries({ queryKey: ['stock-take'] });
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  /** Chênh lệch = số đếm đang gõ − số hệ thống. `null` khi chưa đếm dòng này. */
  function discrepancyOf(line: StockTakeItem): number | null {
    const raw = counts[line.id];
    if (raw === undefined || raw === '') return null;
    return Number(raw) - line.systemQuantity;
  }

  const columns: Column<StockTake>[] = [
    {
      key: 'stockTakeCode',
      header: 'Mã phiếu',
      render: (row) => (
        <button
          type="button"
          onClick={() => setDetailId(row.id)}
          className="font-mono text-primary hover:underline"
        >
          {row.stockTakeCode}
        </button>
      ),
    },
    { key: 'branch', header: 'Chi nhánh', render: (row) => row.branch?.branchName ?? '—' },
    { key: 'takenDate', header: 'Ngày kiểm', sortable: true, render: (row) => formatDate(row.takenDate) },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => (
        <Badge variant={STATUS_VARIANT[row.status]}>{STOCK_TAKE_STATUS_LABEL_VI[row.status]}</Badge>
      ),
    },
    {
      key: 'confirmedAt',
      header: 'Xác nhận lúc',
      render: (row) => (row.confirmedAt ? formatDateTime(row.confirmedAt) : '—'),
    },
  ];

  const data = listQuery.data;
  const detail = detailQuery.data;
  const isDraft = detail?.status === StockTakeStatus.DRAFT;
  const countedLines = (detail?.items ?? []).filter((line) => line.countedQuantity !== null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Kiểm kê</h1>
        <Button
          onClick={() => createMutation.mutate()}
          loading={createMutation.isPending}
          disabled={!branchId}
        >
          Tạo phiếu kiểm kê
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded border border-border bg-surface p-4">
        <Select
          label="Chi nhánh"
          value={branchId}
          onChange={(value) => {
            setBranchId(value);
            setPage(1);
          }}
          options={(branchesQuery.data ?? []).map((b) => ({ value: b.id, label: b.branchName }))}
        />
        <Select
          label="Trạng thái"
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value as '' | StockTakeStatus);
            setPage(1);
          }}
          options={[
            { value: '', label: 'Tất cả' },
            ...Object.values(StockTakeStatus).map((status) => ({
              value: status,
              label: STOCK_TAKE_STATUS_LABEL_VI[status],
            })),
          ]}
        />
        <p className="text-sm text-muted">
          Tạo phiếu là chụp số tồn hệ thống ngay lúc đó — số đếm sau này được đối chiếu với mốc
          này, không phải với tồn tại thời điểm xác nhận.
        </p>
      </div>

      <Table
        columns={columns}
        data={data?.data ?? []}
        getRowId={(row) => row.id}
        loading={listQuery.isLoading}
        emptyMessage="Chưa có phiếu kiểm kê nào."
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(nextSortBy, nextOrder) => {
          setSortBy(nextSortBy);
          setSortOrder(nextOrder);
          setPage(1);
        }}
        page={data?.page}
        limit={data?.limit}
        total={data?.total}
        onPageChange={setPage}
      />

      <Modal
        open={detailId !== null}
        onClose={() => setDetailId(null)}
        title={detail ? `Phiếu kiểm kê ${detail.stockTakeCode}` : 'Phiếu kiểm kê'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetailId(null)}>
              Đóng
            </Button>
            {isDraft && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => cancelMutation.mutate()}
                  loading={cancelMutation.isPending}
                >
                  Hủy phiếu
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => saveCountsMutation.mutate()}
                  loading={saveCountsMutation.isPending}
                >
                  Lưu số đếm
                </Button>
                <Button
                  onClick={() => confirmMutation.mutate()}
                  loading={confirmMutation.isPending}
                  disabled={countedLines.length === 0}
                >
                  Xác nhận &amp; điều chỉnh tồn
                </Button>
              </>
            )}
          </>
        }
      >
        {detail && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={STATUS_VARIANT[detail.status]}>
                {STOCK_TAKE_STATUS_LABEL_VI[detail.status]}
              </Badge>
              <span className="text-sm text-muted">Ngày kiểm {formatDate(detail.takenDate)}</span>
              {detail.confirmedAt && (
                <span className="text-sm text-muted">
                  Xác nhận lúc {formatDateTime(detail.confirmedAt)}
                </span>
              )}
            </div>

            {!isDraft && (
              <p className="rounded border border-border bg-surface-muted p-3 text-sm text-muted">
                Phiếu đã {STOCK_TAKE_STATUS_LABEL_VI[detail.status].toLowerCase()} — chỉ xem, không
                sửa được nữa. Phiếu đã xác nhận đã sinh các dòng sổ cái bất biến.
              </p>
            )}

            <Table
              columns={[
                { key: 'code', header: 'Mã', render: (row) => row.item.code },
                { key: 'itemName', header: 'Mặt hàng', render: (row) => row.item.itemName },
                { key: 'systemQuantity', header: 'Hệ thống', render: (row) => row.systemQuantity },
                {
                  key: 'countedQuantity',
                  header: 'Đếm thực tế',
                  render: (row) =>
                    isDraft ? (
                      <Input
                        type="number"
                        min={0}
                        className="w-24"
                        value={counts[row.id] ?? ''}
                        onChange={(e) => setCounts({ ...counts, [row.id]: e.target.value })}
                      />
                    ) : (
                      (row.countedQuantity ?? '—')
                    ),
                },
                {
                  key: 'discrepancy',
                  header: 'Chênh lệch',
                  render: (row) => {
                    const diff = isDraft
                      ? discrepancyOf(row)
                      : row.countedQuantity === null
                        ? null
                        : row.countedQuantity - row.systemQuantity;
                    if (diff === null) return <span className="text-muted">chưa đếm</span>;
                    if (diff === 0) return <span className="text-muted">khớp</span>;
                    return (
                      <span className={diff > 0 ? 'text-success' : 'text-danger'}>
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    );
                  },
                },
                { key: 'note', header: 'Ghi chú', render: (row) => row.note ?? '—' },
              ]}
              data={detail.items ?? []}
              getRowId={(row) => row.id}
              loading={detailQuery.isLoading}
              emptyMessage="Phiếu không có dòng nào."
            />

            <Textarea
              label="Lý do chung"
              rows={2}
              disabled={!isDraft}
              value={confirmNote}
              onChange={(e) => setConfirmNote(e.target.value)}
              hint="Đi vào ghi chú của các dòng sổ cái không có lý do riêng."
            />

            {isDraft && (
              <p className="text-sm text-muted">
                Dòng chưa đếm sẽ bị bỏ qua khi xác nhận — không bị coi là thiếu toàn bộ. Đã đếm{' '}
                {countedLines.length}/{detail.items?.length ?? 0} dòng.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
