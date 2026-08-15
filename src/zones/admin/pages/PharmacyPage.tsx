import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { PrescriptionListParams, prescriptionsApi } from '@/api/prescriptions.api';
import { Badge, Button, Select, Table, useToast } from '@/components/basic';
import type { BadgeVariant, Column } from '@/components/basic';
import {
  MEDICATION_ROUTE_LABEL_VI,
  PRESCRIPTION_STATUS_LABEL_VI,
  Prescription,
  PrescriptionItem,
  PrescriptionStatus,
} from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatDateTime } from '@/utils/format';

const LIMIT = 20;

const STATUS_VARIANT: Record<PrescriptionStatus, BadgeVariant> = {
  [PrescriptionStatus.PRESCRIBED]: 'warning',
  [PrescriptionStatus.DISPENSING]: 'default',
  [PrescriptionStatus.DISPENSED]: 'success',
  [PrescriptionStatus.CANCELLED]: 'destructive',
};

/**
 * Quầy thuốc — SRS FR-11, BR-10.
 *
 * Bố cục hai cột: trái là hàng chờ, phải là đơn đang chọn. Cột phải hiện tồn kho **từng
 * dòng**, tô đỏ dòng thiếu và khoá nút cấp phát kèm giải thích — backend cũng chặn
 * (`dispense` trả 409), nút khoá chỉ để dược sĩ khỏi bấm rồi mới biết.
 */
export function PharmacyPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [branchId, setBranchId] = useState('');
  const [statusFilter, setStatusFilter] = useState<PrescriptionStatus>(
    PrescriptionStatus.PRESCRIBED,
  );
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });

  useEffect(() => {
    if (!branchId && branchesQuery.data?.length) {
      setBranchId(branchesQuery.data[0].id);
    }
  }, [branchId, branchesQuery.data]);

  const params: PrescriptionListParams = {
    page,
    limit: LIMIT,
    status: statusFilter,
    branchId: branchId || undefined,
  };

  const queueQuery = useQuery({
    queryKey: ['prescriptions', params],
    queryFn: () => prescriptionsApi.list(params),
    enabled: Boolean(branchId),
    placeholderData: (prev) => prev,
    // Nhiều dược sĩ có thể cùng đứng ở quầy - làm mới định kỳ để không cùng soạn một đơn.
    refetchInterval: 30_000,
  });

  const detailQuery = useQuery({
    queryKey: ['prescription', selectedId],
    queryFn: () => prescriptionsApi.getOne(selectedId!),
    enabled: selectedId !== null,
  });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    void queryClient.invalidateQueries({ queryKey: ['prescription'] });
    void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    void queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
  }

  const startMutation = useMutation({
    mutationFn: () => prescriptionsApi.startDispensing(selectedId!),
    onSuccess: () => {
      toast.show('Đã nhận đơn về quầy.', 'success');
      refresh();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const dispenseMutation = useMutation({
    mutationFn: () => prescriptionsApi.dispense(selectedId!),
    onSuccess: () => {
      toast.show('Đã cấp phát và trừ kho.', 'success');
      // Đơn rời hàng chờ - bỏ chọn để dược sĩ nhặt đơn tiếp theo.
      setSelectedId(null);
      refresh();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const queueColumns: Column<Prescription>[] = [
    {
      key: 'createdAt',
      header: 'Kê lúc',
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedId(row.id)}
          className={
            row.id === selectedId
              ? 'font-semibold text-primary underline'
              : 'text-primary hover:underline'
          }
        >
          {formatDateTime(row.createdAt)}
        </button>
      ),
    },
    {
      key: 'items',
      header: 'Số loại thuốc',
      render: (row) => row.items?.length ?? 0,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => (
        <Badge variant={STATUS_VARIANT[row.status]}>
          {PRESCRIPTION_STATUS_LABEL_VI[row.status]}
        </Badge>
      ),
    },
  ];

  const view = detailQuery.data;
  const stockByItemId = new Map((view?.stockCheck ?? []).map((line) => [line.prescriptionItemId, line]));

  const detailColumns: Column<PrescriptionItem>[] = [
    {
      key: 'medication',
      header: 'Thuốc',
      render: (row) => row.medication?.item?.itemName ?? '—',
    },
    {
      key: 'quantity',
      header: 'Số lượng',
      render: (row) => (
        <span className="font-semibold">
          {row.quantity} {row.medication?.unit ?? ''}
        </span>
      ),
    },
    {
      key: 'stock',
      header: 'Tồn dùng được',
      render: (row) => {
        const stock = stockByItemId.get(row.id);
        if (!stock) return '—';
        return (
          <span className={stock.insufficientStock ? 'font-semibold text-red-600' : ''}>
            {stock.availableQuantity}
            {stock.insufficientStock && ' — thiếu'}
          </span>
        );
      },
    },
    { key: 'dosage', header: 'Liều', render: (row) => row.dosage },
    { key: 'frequency', header: 'Tần suất', render: (row) => row.frequency ?? '—' },
    { key: 'durationDays', header: 'Số ngày', render: (row) => row.durationDays },
    {
      key: 'route',
      header: 'Đường dùng',
      render: (row) => MEDICATION_ROUTE_LABEL_VI[row.route] ?? row.route,
    },
    { key: 'instructions', header: 'Dặn dò', render: (row) => row.instructions ?? '—' },
  ];

  const prescription = view?.prescription;
  const isOpen =
    prescription?.status === PrescriptionStatus.PRESCRIBED ||
    prescription?.status === PrescriptionStatus.DISPENSING;
  const canDispense = isOpen && view?.hasInsufficientStock === false;

  const queue = queueQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Quầy thuốc</h1>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded border border-border bg-surface p-4">
        <Select
          label="Chi nhánh"
          value={branchId}
          onChange={(value) => {
            setBranchId(value);
            setSelectedId(null);
            setPage(1);
          }}
          options={(branchesQuery.data ?? []).map((b) => ({ value: b.id, label: b.branchName }))}
        />
        <Select
          label="Trạng thái"
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value as PrescriptionStatus);
            setSelectedId(null);
            setPage(1);
          }}
          options={Object.values(PrescriptionStatus).map((status) => ({
            value: status,
            label: PRESCRIPTION_STATUS_LABEL_VI[status],
          }))}
        />
        <p className="text-sm text-muted">
          Hàng chờ sắp theo đơn kê lâu nhất trước. Kho chỉ bị trừ khi bấm “Xác nhận cấp phát”.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">
            Hàng chờ{queue ? ` (${queue.total})` : ''}
          </h2>
          <Table
            columns={queueColumns}
            data={queue?.data ?? []}
            getRowId={(row) => row.id}
            loading={queueQuery.isLoading}
            emptyMessage={
              branchId ? 'Không có đơn nào ở trạng thái này.' : 'Chọn một chi nhánh.'
            }
            page={queue?.page}
            limit={queue?.limit}
            total={queue?.total}
            onPageChange={setPage}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Chi tiết đơn</h2>

          {!selectedId && (
            <p className="rounded border border-border bg-surface-muted p-4 text-sm text-muted">
              Chọn một đơn ở hàng chờ để xem thuốc và tồn kho từng dòng.
            </p>
          )}

          {selectedId && prescription && (
            <div className="flex flex-col gap-4 rounded border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={STATUS_VARIANT[prescription.status]}>
                  {PRESCRIPTION_STATUS_LABEL_VI[prescription.status]}
                </Badge>
                <span className="text-sm text-muted">
                  Kê lúc {formatDateTime(prescription.createdAt)}
                </span>
                {prescription.dispensedAt && (
                  <span className="text-sm text-muted">
                    Cấp phát lúc {formatDateTime(prescription.dispensedAt)}
                  </span>
                )}
              </div>

              {prescription.notes && (
                <p className="text-sm">
                  <span className="text-muted">Ghi chú của bác sĩ: </span>
                  {prescription.notes}
                </p>
              )}

              <Table
                columns={detailColumns}
                data={prescription.items ?? []}
                getRowId={(row) => row.id}
                loading={detailQuery.isLoading}
                emptyMessage="Đơn không có dòng thuốc nào."
              />

              {view?.hasInsufficientStock && isOpen && (
                <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                  Không cấp phát được: một hoặc nhiều dòng thiếu tồn ở chi nhánh này (các dòng tô
                  đỏ ở trên). Nhập thêm hàng ở màn hình <strong>Nhận hàng</strong>, hoặc báo bác sĩ
                  đổi thuốc — đơn vẫn giữ nguyên cho tới lúc đó.
                </p>
              )}

              {!isOpen && (
                <p className="rounded border border-border bg-surface-muted p-3 text-sm text-muted">
                  Đơn đã {PRESCRIPTION_STATUS_LABEL_VI[prescription.status].toLowerCase()} — chỉ
                  xem. Đơn đã cấp phát đã sinh các dòng sổ cái kho bất biến, cấp nhầm thì xử lý
                  bằng một phiếu kiểm kê có ghi lý do.
                </p>
              )}

              {isOpen && (
                <div className="flex flex-wrap gap-2">
                  {prescription.status === PrescriptionStatus.PRESCRIBED && (
                    <Button
                      variant="secondary"
                      onClick={() => startMutation.mutate()}
                      loading={startMutation.isPending}
                    >
                      Nhận đơn về quầy
                    </Button>
                  )}
                  <Button
                    onClick={() => dispenseMutation.mutate()}
                    loading={dispenseMutation.isPending}
                    disabled={!canDispense}
                  >
                    Xác nhận cấp phát
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
