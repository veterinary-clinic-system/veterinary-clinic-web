import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { catalogApi } from '@/api/catalog.api';
import { PurchaseOrderListParams, purchaseOrdersApi } from '@/api/inventory.api';
import { suppliersApi } from '@/api/suppliers.api';
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
import type { BadgeVariant, Column, SortOrder } from '@/components/basic';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  PURCHASE_ORDER_STATUS_LABEL_VI,
  PurchaseOrder,
  PurchaseOrderStatus,
} from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatCurrency, formatDate } from '@/utils/format';

const LIMIT = 20;

const STATUS_VARIANT: Record<PurchaseOrderStatus, BadgeVariant> = {
  [PurchaseOrderStatus.DRAFT]: 'outline',
  [PurchaseOrderStatus.ORDERED]: 'default',
  [PurchaseOrderStatus.PARTIALLY_RECEIVED]: 'warning',
  [PurchaseOrderStatus.RECEIVED]: 'success',
  [PurchaseOrderStatus.CANCELLED]: 'destructive',
};

interface DraftLine {
  itemId: string;
  quantity: string;
  unitCost: string;
}

const EMPTY_LINE: DraftLine = { itemId: '', quantity: '1', unitCost: '0' };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** SRS UC-05 — đơn đặt hàng gửi nhà cung cấp. */
export function PurchaseOrdersPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();

  const [branchId, setBranchId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | PurchaseOrderStatus>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');

  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState({
    supplierId: '',
    orderDate: today(),
    expectedDate: '',
    note: '',
  });
  const [lines, setLines] = useState<DraftLine[]>([{ ...EMPTY_LINE }]);

  const debouncedSearch = useDebouncedValue(search, 300);
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });
  const suppliersQuery = useQuery({
    queryKey: ['suppliers', 'all'],
    queryFn: () => suppliersApi.list({ limit: 100, active: true }),
  });
  const itemsQuery = useQuery({
    queryKey: ['items', 'orderable'],
    queryFn: () => catalogApi.items({ limit: 100 }),
  });

  useEffect(() => {
    if (!branchId && branchesQuery.data?.length) {
      setBranchId(branchesQuery.data[0].id);
    }
  }, [branchId, branchesQuery.data]);

  const params: PurchaseOrderListParams = {
    page,
    limit: LIMIT,
    sortBy,
    sortOrder,
    branchId: branchId || undefined,
    status: statusFilter || undefined,
    search: debouncedSearch || undefined,
  };

  const listQuery = useQuery({
    queryKey: ['purchase-orders', params],
    queryFn: () => purchaseOrdersApi.list(params),
    enabled: Boolean(branchId),
    placeholderData: (prev) => prev,
  });

  const detailQuery = useQuery({
    queryKey: ['purchase-order', detailId],
    queryFn: () => purchaseOrdersApi.getOne(detailId!),
    enabled: detailId !== null,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      purchaseOrdersApi.create({
        supplierId: form.supplierId,
        branchId,
        orderDate: form.orderDate || undefined,
        expectedDate: form.expectedDate || undefined,
        note: form.note || undefined,
        items: lines.map((line) => ({
          itemId: line.itemId,
          quantity: Number(line.quantity),
          unitCost: Number(line.unitCost),
        })),
      }),
    onSuccess: (order) => {
      toast.show(`Đã tạo đơn ${order.poCode}.`, 'success');
      closeForm();
      void queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PurchaseOrderStatus }) =>
      purchaseOrdersApi.update(id, { status }),
    onSuccess: (order) => {
      toast.show(`Đơn ${order.poCode}: ${PURCHASE_ORDER_STATUS_LABEL_VI[order.status]}.`, 'success');
      void queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      void queryClient.invalidateQueries({ queryKey: ['purchase-order'] });
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  function closeForm() {
    setFormOpen(false);
    setForm({ supplierId: '', orderDate: today(), expectedDate: '', note: '' });
    setLines([{ ...EMPTY_LINE }]);
  }

  function updateLine(index: number, patch: Partial<DraftLine>) {
    setLines(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  // Tổng tiền hiện ngay khi gõ để người đặt đối chiếu với báo giá — backend vẫn tính lại.
  const draftTotal = lines.reduce(
    (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitCost) || 0),
    0,
  );
  const canSubmit =
    form.supplierId !== '' && lines.length > 0 && lines.every((line) => line.itemId !== '');

  const columns: Column<PurchaseOrder>[] = [
    {
      key: 'poCode',
      header: 'Mã đơn',
      render: (row) => (
        <button
          type="button"
          onClick={() => setDetailId(row.id)}
          className="font-mono text-primary hover:underline"
        >
          {row.poCode}
        </button>
      ),
    },
    { key: 'supplier', header: 'Nhà cung cấp', render: (row) => row.supplier?.name ?? '—' },
    { key: 'orderDate', header: 'Ngày đặt', sortable: true, render: (row) => formatDate(row.orderDate) },
    {
      key: 'expectedDate',
      header: 'Hẹn giao',
      sortable: true,
      render: (row) => (row.expectedDate ? formatDate(row.expectedDate) : '—'),
    },
    {
      key: 'totalAmount',
      header: 'Tổng tiền',
      sortable: true,
      render: (row) => formatCurrency(row.totalAmount),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => (
        <Badge variant={STATUS_VARIANT[row.status]}>
          {PURCHASE_ORDER_STATUS_LABEL_VI[row.status]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          {row.status === PurchaseOrderStatus.DRAFT && (
            <Button
              size="sm"
              onClick={() =>
                statusMutation.mutate({ id: row.id, status: PurchaseOrderStatus.ORDERED })
              }
            >
              Gửi NCC
            </Button>
          )}
          {(row.status === PurchaseOrderStatus.ORDERED ||
            row.status === PurchaseOrderStatus.PARTIALLY_RECEIVED) && (
            <Button
              size="sm"
              onClick={() => navigate(`/staff/goods-receipts?po=${row.id}`)}
            >
              Nhận hàng
            </Button>
          )}
          {row.status !== PurchaseOrderStatus.RECEIVED &&
            row.status !== PurchaseOrderStatus.CANCELLED && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  statusMutation.mutate({ id: row.id, status: PurchaseOrderStatus.CANCELLED })
                }
              >
                Hủy
              </Button>
            )}
        </div>
      ),
    },
  ];

  const data = listQuery.data;
  const detail = detailQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Đơn đặt hàng</h1>
        <Button onClick={() => setFormOpen(true)} disabled={!branchId}>
          Tạo đơn đặt hàng
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
            setStatusFilter(value as '' | PurchaseOrderStatus);
            setPage(1);
          }}
          options={[
            { value: '', label: 'Tất cả' },
            ...Object.values(PurchaseOrderStatus).map((status) => ({
              value: status,
              label: PURCHASE_ORDER_STATUS_LABEL_VI[status],
            })),
          ]}
        />
        <Input
          label="Tìm mã đơn"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="PO00001…"
          className="w-56"
        />
      </div>

      <Table
        columns={columns}
        data={data?.data ?? []}
        getRowId={(row) => row.id}
        loading={listQuery.isLoading}
        error={listQuery.isError}
        onRetry={() => void listQuery.refetch()}
        emptyMessage="Chưa có đơn đặt hàng nào."
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
        title="Tạo đơn đặt hàng"
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>
              Hủy
            </Button>
            <Button
              type="submit"
              form="po-form"
              loading={createMutation.isPending}
              disabled={!canSubmit}
            >
              Tạo đơn
            </Button>
          </>
        }
      >
        <form
          id="po-form"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <Combobox
            label="Nhà cung cấp"
            value={form.supplierId || null}
            onChange={(value) => setForm({ ...form, supplierId: value })}
            loading={suppliersQuery.isLoading}
            options={(suppliersQuery.data?.data ?? []).map((s) => ({
              value: s.id,
              label: `${s.supplierCode} — ${s.name}`,
            }))}
            placeholder="Chọn nhà cung cấp…"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DatePicker
              label="Ngày đặt"
              value={form.orderDate || null}
              onChange={(value) => setForm({ ...form, orderDate: value ?? '' })}
            />
            <DatePicker
              label="Hẹn giao"
              value={form.expectedDate || null}
              onChange={(value) => setForm({ ...form, expectedDate: value ?? '' })}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Các dòng hàng</h3>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setLines([...lines, { ...EMPTY_LINE }])}
              >
                Thêm dòng
              </Button>
            </div>
            {lines.map((line, index) => (
              <div key={index} className="flex flex-wrap items-end gap-3 rounded border border-border p-3">
                <Combobox
                  label="Mặt hàng"
                  className="w-64"
                  value={line.itemId || null}
                  onChange={(value) => updateLine(index, { itemId: value })}
                  loading={itemsQuery.isLoading}
                  options={(itemsQuery.data?.data ?? []).map((item) => ({
                    value: item.id,
                    label: `${item.code} — ${item.itemName}`,
                  }))}
                  placeholder="Chọn mặt hàng…"
                />
                <Input
                  label="Số lượng"
                  type="number"
                  min={1}
                  className="w-28"
                  value={line.quantity}
                  onChange={(e) => updateLine(index, { quantity: e.target.value })}
                />
                <Input
                  label="Giá nhập"
                  type="number"
                  min={0}
                  className="w-36"
                  value={line.unitCost}
                  onChange={(e) => updateLine(index, { unitCost: e.target.value })}
                />
                <span className="pb-2 text-sm text-muted">
                  {formatCurrency((Number(line.quantity) || 0) * (Number(line.unitCost) || 0))}
                </span>
                {lines.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setLines(lines.filter((_, i) => i !== index))}
                  >
                    Xóa
                  </Button>
                )}
              </div>
            ))}
            <p className="text-right font-medium">Tổng tiền: {formatCurrency(draftTotal)}</p>
          </div>

          <Textarea
            label="Ghi chú"
            rows={2}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </form>
      </Modal>

      <Modal
        open={detailId !== null}
        onClose={() => setDetailId(null)}
        title={detail ? `Đơn ${detail.poCode}` : 'Đơn đặt hàng'}
        footer={
          <Button variant="secondary" onClick={() => setDetailId(null)}>
            Đóng
          </Button>
        }
      >
        {detail && (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted">Nhà cung cấp</dt>
              <dd>{detail.supplier?.name ?? '—'}</dd>
              <dt className="text-muted">Chi nhánh</dt>
              <dd>{detail.branch?.branchName ?? '—'}</dd>
              <dt className="text-muted">Ngày đặt</dt>
              <dd>{formatDate(detail.orderDate)}</dd>
              <dt className="text-muted">Hẹn giao</dt>
              <dd>{detail.expectedDate ? formatDate(detail.expectedDate) : '—'}</dd>
              <dt className="text-muted">Trạng thái</dt>
              <dd>
                <Badge variant={STATUS_VARIANT[detail.status]}>
                  {PURCHASE_ORDER_STATUS_LABEL_VI[detail.status]}
                </Badge>
              </dd>
              <dt className="text-muted">Ghi chú</dt>
              <dd>{detail.note ?? '—'}</dd>
            </dl>

            <Table
              columns={[
                { key: 'code', header: 'Mã', render: (row) => row.item.code },
                { key: 'itemName', header: 'Mặt hàng', render: (row) => row.item.itemName },
                { key: 'quantity', header: 'Đặt', render: (row) => row.quantity },
                {
                  key: 'receivedQuantity',
                  header: 'Đã nhận',
                  render: (row) => (
                    <span
                      className={
                        row.receivedQuantity >= row.quantity ? 'text-success' : 'text-warning'
                      }
                    >
                      {row.receivedQuantity}
                    </span>
                  ),
                },
                { key: 'unitCost', header: 'Giá nhập', render: (row) => formatCurrency(row.unitCost) },
                {
                  key: 'lineTotal',
                  header: 'Thành tiền',
                  render: (row) => formatCurrency(row.quantity * row.unitCost),
                },
              ]}
              data={detail.items ?? []}
              getRowId={(row) => row.id}
              emptyMessage="Đơn không có dòng nào."
            />
            <p className="text-right font-medium">
              Tổng tiền đặt: {formatCurrency(detail.totalAmount)}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
