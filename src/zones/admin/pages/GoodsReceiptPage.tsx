import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import {
  GoodsReceiptListParams,
  goodsReceiptsApi,
  purchaseOrdersApi,
} from '@/api/inventory.api';
import {
  Badge,
  Button,
  Combobox,
  DatePicker,
  Input,
  Modal,
  Select,
  Table,
  Textarea,
  useToast,
} from '@/components/basic';
import type { Column, SortOrder } from '@/components/basic';
import { GoodsReceipt, PurchaseOrderStatus } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatCurrency, formatDate } from '@/utils/format';
import { EXPIRY_BADGE_VARIANT, expiryLabel, expiryLevel } from '@/utils/inventory';

const LIMIT = 20;

/** Một dòng đang nhập trên form nhận hàng, khớp với một dòng của đơn đặt. */
interface ReceivingLine {
  purchaseOrderItemId: string;
  itemId: string;
  itemLabel: string;
  ordered: number;
  alreadyReceived: number;
  unitCost: number;
  /** Chuỗi vì người dùng đang gõ — "" nghĩa là không nhận dòng này lần này. */
  quantity: string;
  batchNo: string;
  expiryDate: string;
}

/** SRS UC-05, BR-13 — nhận hàng theo đơn đặt, một lần xác nhận là hàng vào kho. */
export function GoodsReceiptPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [branchId, setBranchId] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');

  const [formOpen, setFormOpen] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState<string | null>(searchParams.get('po'));
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [receivingLines, setReceivingLines] = useState<ReceivingLine[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });

  useEffect(() => {
    if (!branchId && branchesQuery.data?.length) {
      setBranchId(branchesQuery.data[0].id);
    }
  }, [branchId, branchesQuery.data]);

  // Chỉ đơn đã gửi NCC mới nhận hàng được — đơn nháp phải chuyển ORDERED trước.
  const openOrdersQuery = useQuery({
    queryKey: ['purchase-orders', 'receivable', branchId],
    queryFn: async () => {
      const [ordered, partial] = await Promise.all([
        purchaseOrdersApi.list({ branchId, status: PurchaseOrderStatus.ORDERED, limit: 100 }),
        purchaseOrdersApi.list({
          branchId,
          status: PurchaseOrderStatus.PARTIALLY_RECEIVED,
          limit: 100,
        }),
      ]);
      return [...ordered.data, ...partial.data];
    },
    enabled: Boolean(branchId),
  });

  const selectedPoQuery = useQuery({
    queryKey: ['purchase-order', selectedPoId],
    queryFn: () => purchaseOrdersApi.getOne(selectedPoId!),
    enabled: selectedPoId !== null,
  });

  // Đơn được chọn -> dựng sẵn một dòng nhập cho mỗi dòng còn thiếu của đơn.
  useEffect(() => {
    const order = selectedPoQuery.data;
    if (!order) {
      setReceivingLines([]);
      return;
    }
    setReceivingLines(
      (order.items ?? [])
        .filter((line) => line.receivedQuantity < line.quantity)
        .map((line) => ({
          purchaseOrderItemId: line.id,
          itemId: line.itemId,
          itemLabel: `${line.item.code} — ${line.item.itemName}`,
          ordered: line.quantity,
          alreadyReceived: line.receivedQuantity,
          unitCost: line.unitCost,
          quantity: String(line.quantity - line.receivedQuantity),
          batchNo: '',
          expiryDate: '',
        })),
    );
  }, [selectedPoQuery.data]);

  const params: GoodsReceiptListParams = {
    page,
    limit: LIMIT,
    sortBy,
    sortOrder,
    branchId: branchId || undefined,
  };

  const listQuery = useQuery({
    queryKey: ['goods-receipts', params],
    queryFn: () => goodsReceiptsApi.list(params),
    enabled: Boolean(branchId),
    placeholderData: (prev) => prev,
  });

  const detailQuery = useQuery({
    queryKey: ['goods-receipt', detailId],
    queryFn: () => goodsReceiptsApi.getOne(detailId!),
    enabled: detailId !== null,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const order = selectedPoQuery.data!;
      return goodsReceiptsApi.create({
        purchaseOrderId: order.id,
        supplierId: order.supplierId,
        branchId,
        receivedDate,
        note: note || undefined,
        items: receivingLines
          .filter((line) => Number(line.quantity) > 0)
          .map((line) => ({
            itemId: line.itemId,
            purchaseOrderItemId: line.purchaseOrderItemId,
            quantity: Number(line.quantity),
            unitCost: line.unitCost,
            batchNo: line.batchNo,
            expiryDate: line.expiryDate || undefined,
          })),
      });
    },
    onSuccess: (receipt) => {
      toast.show(`Đã nhập kho theo phiếu ${receipt.receiptCode}.`, 'success');
      closeForm();
      void queryClient.invalidateQueries({ queryKey: ['goods-receipts'] });
      void queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      void queryClient.invalidateQueries({ queryKey: ['purchase-order'] });
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
      void queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  function openForm() {
    setReceivedDate(new Date().toISOString().slice(0, 10));
    setNote('');
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setSelectedPoId(null);
    setReceivingLines([]);
    setSearchParams({});
  }

  // Mở thẳng từ trang đơn đặt hàng (`?po=`) thì bật form luôn.
  useEffect(() => {
    if (searchParams.get('po') && !formOpen) {
      setSelectedPoId(searchParams.get('po'));
      setFormOpen(true);
    }
    // Chỉ chạy khi query string đổi — không phụ thuộc `formOpen` để tránh mở lại sau khi đóng.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function updateLine(index: number, patch: Partial<ReceivingLine>) {
    setReceivingLines(receivingLines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  const activeLines = receivingLines.filter((line) => Number(line.quantity) > 0);
  const canSubmit =
    selectedPoId !== null &&
    activeLines.length > 0 &&
    activeLines.every(
      (line) =>
        line.batchNo.trim() !== '' &&
        Number(line.quantity) > 0 &&
        Number(line.quantity) <= line.ordered - line.alreadyReceived,
    );
  const receiptTotal = activeLines.reduce(
    (sum, line) => sum + Number(line.quantity) * line.unitCost,
    0,
  );

  const columns: Column<GoodsReceipt>[] = [
    {
      key: 'receiptCode',
      header: 'Mã phiếu',
      render: (row) => (
        <button
          type="button"
          onClick={() => setDetailId(row.id)}
          className="font-mono text-primary hover:underline"
        >
          {row.receiptCode}
        </button>
      ),
    },
    {
      key: 'purchaseOrder',
      header: 'Đơn đặt',
      render: (row) => row.purchaseOrder?.poCode ?? 'Nhập lẻ',
    },
    { key: 'supplier', header: 'Nhà cung cấp', render: (row) => row.supplier?.name ?? '—' },
    {
      key: 'receivedDate',
      header: 'Ngày nhận',
      sortable: true,
      render: (row) => formatDate(row.receivedDate),
    },
    {
      key: 'totalAmount',
      header: 'Giá trị',
      sortable: true,
      render: (row) => formatCurrency(row.totalAmount),
    },
  ];

  const data = listQuery.data;
  const detail = detailQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nhận hàng</h1>
        <Button onClick={openForm} disabled={!branchId}>
          Lập phiếu nhập
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
        <p className="text-sm text-muted">
          Phiếu nhập không sửa và không xóa được: nó đã tăng tồn thật và đã ghi sổ cái. Nhập sai
          thì lập phiếu kiểm kê có ghi lý do.
        </p>
      </div>

      <Table
        columns={columns}
        data={data?.data ?? []}
        getRowId={(row) => row.id}
        loading={listQuery.isLoading}
        error={listQuery.isError}
        onRetry={() => void listQuery.refetch()}
        emptyMessage="Chưa có phiếu nhập nào."
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
        open={formOpen}
        onClose={closeForm}
        title="Lập phiếu nhập kho"
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>
              Hủy
            </Button>
            <Button
              type="submit"
              form="gr-form"
              loading={createMutation.isPending}
              disabled={!canSubmit}
            >
              Xác nhận nhập kho
            </Button>
          </>
        }
      >
        <form
          id="gr-form"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <Combobox
            label="Đơn đặt hàng"
            value={selectedPoId}
            onChange={setSelectedPoId}
            loading={openOrdersQuery.isLoading}
            options={(openOrdersQuery.data ?? []).map((order) => ({
              value: order.id,
              label: `${order.poCode} — ${order.supplier?.name ?? ''}`,
            }))}
            placeholder="Chọn đơn đã gửi nhà cung cấp…"
          />
          <DatePicker
            label="Ngày nhận"
            value={receivedDate || null}
            onChange={(value) => setReceivedDate(value ?? '')}
          />

          {selectedPoId && receivingLines.length === 0 && !selectedPoQuery.isLoading && (
            <p className="rounded border border-border bg-surface-muted p-3 text-sm text-muted">
              Đơn này đã nhận đủ mọi dòng.
            </p>
          )}

          {receivingLines.map((line, index) => (
            <div key={line.purchaseOrderItemId} className="flex flex-col gap-3 rounded border border-border p-3">
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{line.itemLabel}</span>
                <span className="text-sm text-muted">
                  Đặt {line.ordered}, đã nhận {line.alreadyReceived}, còn{' '}
                  {line.ordered - line.alreadyReceived}
                </span>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <Input
                  label="Thực nhận"
                  type="number"
                  min={0}
                  max={line.ordered - line.alreadyReceived}
                  className="w-28"
                  value={line.quantity}
                  onChange={(e) => updateLine(index, { quantity: e.target.value })}
                  error={
                    Number(line.quantity) > line.ordered - line.alreadyReceived
                      ? 'Vượt số còn lại của đơn'
                      : undefined
                  }
                />
                <Input
                  label="Mã lô"
                  className="w-40"
                  value={line.batchNo}
                  onChange={(e) => updateLine(index, { batchNo: e.target.value })}
                  error={
                    Number(line.quantity) > 0 && line.batchNo.trim() === ''
                      ? 'Bắt buộc'
                      : undefined
                  }
                />
                <DatePicker
                  label="Hạn dùng"
                  value={line.expiryDate || null}
                  onChange={(value) => updateLine(index, { expiryDate: value ?? '' })}
                  hint="Bỏ trống nếu hàng không có hạn."
                />
                <span className="pb-2 text-sm text-muted">
                  {formatCurrency(Number(line.quantity) * line.unitCost)}
                </span>
              </div>
            </div>
          ))}

          {activeLines.length > 0 && (
            <p className="text-right font-medium">Giá trị phiếu: {formatCurrency(receiptTotal)}</p>
          )}

          <Textarea label="Ghi chú" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          <p className="text-sm text-muted">
            Toàn bộ phiếu vào kho trong một lần: hoặc mọi dòng đều được ghi, hoặc không dòng nào.
          </p>
        </form>
      </Modal>

      <Modal
        open={detailId !== null}
        onClose={() => setDetailId(null)}
        title={detail ? `Phiếu nhập ${detail.receiptCode}` : 'Phiếu nhập'}
        footer={
          <Button variant="secondary" onClick={() => setDetailId(null)}>
            Đóng
          </Button>
        }
      >
        {detail && (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted">Đơn đặt</dt>
              <dd>{detail.purchaseOrder?.poCode ?? 'Nhập lẻ (không theo đơn)'}</dd>
              <dt className="text-muted">Nhà cung cấp</dt>
              <dd>{detail.supplier?.name ?? '—'}</dd>
              <dt className="text-muted">Ngày nhận</dt>
              <dd>{formatDate(detail.receivedDate)}</dd>
              <dt className="text-muted">Ghi chú</dt>
              <dd>{detail.note ?? '—'}</dd>
            </dl>

            <Table
              columns={[
                { key: 'itemName', header: 'Mặt hàng', render: (row) => row.item.itemName },
                {
                  key: 'batchNo',
                  header: 'Lô',
                  render: (row) => <span className="font-mono">{row.batchNo}</span>,
                },
                {
                  key: 'expiryDate',
                  header: 'Hạn dùng',
                  render: (row) => (
                    <div className="flex items-center gap-2">
                      <span>{row.expiryDate ? formatDate(row.expiryDate) : '—'}</span>
                      <Badge variant={EXPIRY_BADGE_VARIANT[expiryLevel(row.expiryDate)]}>
                        {expiryLabel(row.expiryDate)}
                      </Badge>
                    </div>
                  ),
                },
                { key: 'quantity', header: 'Số lượng', render: (row) => row.quantity },
                { key: 'unitCost', header: 'Giá nhập', render: (row) => formatCurrency(row.unitCost) },
              ]}
              data={detail.items ?? []}
              getRowId={(row) => row.id}
              emptyMessage="Phiếu không có dòng nào."
            />
            <p className="text-right font-medium">
              Giá trị phiếu: {formatCurrency(detail.totalAmount)}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
