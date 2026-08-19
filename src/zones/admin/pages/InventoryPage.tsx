import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { InventoryListParams, inventoryApi, inventoryTransactionsApi } from '@/api/inventory.api';
import { Badge, Button, Input, Modal, Select, Table, Textarea, useToast } from '@/components/basic';
import type { Column, SortOrder } from '@/components/basic';
import { useAuth } from '@/context/AuthContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  INVENTORY_TRANSACTION_TYPE_LABEL_VI,
  InventoryBatch,
  InventoryItem,
  InventoryTransaction,
  InventoryTransactionType,
  MANUAL_ISSUE_TYPES,
  Role,
} from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import {
  EXPIRY_BADGE_VARIANT,
  STOCK_LEVEL_BADGE_VARIANT,
  STOCK_LEVEL_LABEL_VI,
  expiryLabel,
  expiryLevel,
  stockLevelOf,
} from '@/utils/inventory';

const LIMIT = 20;

/**
 * Ba vai trò có `INVENTORY_EXPORT` trong ma trận quyền — chỉ họ mới thấy nút xuất kho
 * và điều chỉnh. Đây chỉ là chuyện giao diện: backend vẫn là hàng rào thật, ẩn nút chỉ
 * để người không có quyền khỏi bấm vào rồi nhận 403.
 */
const CAN_WRITE_ROLES = [Role.ADMIN, Role.MANAGER, Role.PHARMACIST];

/** SRS FR-18 — tồn kho theo chi nhánh, xem theo lô, xuất/điều chỉnh có ghi sổ cái. */
export function InventoryPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const canWrite = user !== null && CAN_WRITE_ROLES.includes(user.role);

  // Trang cảnh báo điều hướng sang đây kèm `?item=&branch=` để mở đúng hàng liên quan.
  const [searchParams, setSearchParams] = useSearchParams();
  const focusedItemId = searchParams.get('item');

  const [branchId, setBranchId] = useState(searchParams.get('branch') ?? '');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('inventoryQuantity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('ASC');

  const [batchesOf, setBatchesOf] = useState<InventoryItem | null>(null);
  const [issueTarget, setIssueTarget] = useState<InventoryItem | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null);
  const [ledgerOf, setLedgerOf] = useState<InventoryItem | null>(null);

  const [issueForm, setIssueForm] = useState({
    quantity: '1',
    type: InventoryTransactionType.DAMAGED as InventoryTransactionType,
    note: '',
  });
  const [adjustForm, setAdjustForm] = useState({ countedQuantity: '', note: '' });

  const debouncedSearch = useDebouncedValue(search, 300);
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });

  // Chi nhánh đầu tiên được chọn sẵn — cùng cách QueuePage làm, để mở trang là thấy số.
  useEffect(() => {
    if (!branchId && branchesQuery.data?.length) {
      setBranchId(branchesQuery.data[0].id);
    }
  }, [branchId, branchesQuery.data]);

  const params: InventoryListParams = {
    page,
    limit: LIMIT,
    sortBy,
    sortOrder,
    branchId: branchId || undefined,
    itemId: focusedItemId ?? undefined,
    search: debouncedSearch || undefined,
    lowStock: lowStockOnly || undefined,
  };

  const listQuery = useQuery({
    queryKey: ['inventory', params],
    queryFn: () => inventoryApi.list(params),
    enabled: Boolean(branchId),
    placeholderData: (prev) => prev,
  });

  const batchesQuery = useQuery({
    queryKey: ['inventory-batches', batchesOf?.id],
    queryFn: () => inventoryApi.batches(batchesOf!.id),
    enabled: batchesOf !== null,
  });

  const ledgerQuery = useQuery({
    queryKey: ['inventory-transactions', ledgerOf?.id],
    queryFn: () => inventoryTransactionsApi.list({ inventoryItemId: ledgerOf!.id, limit: 50 }),
    enabled: ledgerOf !== null,
  });

  function refreshStock() {
    void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    void queryClient.invalidateQueries({ queryKey: ['inventory-batches'] });
    void queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
    void queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
  }

  const issueMutation = useMutation({
    mutationFn: () =>
      inventoryApi.issue({
        itemId: issueTarget!.itemId,
        branchId: issueTarget!.branchId,
        quantity: Number(issueForm.quantity),
        type: issueForm.type,
        note: issueForm.note,
      }),
    onSuccess: (allocations) => {
      // Người dùng không chọn lô (FEFO là quyết định của kho) nên phải nói rõ đã trừ
      // vào lô nào — nếu không, số tồn của một lô cụ thể sẽ đổi mà không rõ vì sao.
      toast.show(
        `Đã xuất kho: ${allocations.map((a) => `${a.batchNo} (${a.quantity})`).join(', ')}`,
        'success',
      );
      setIssueTarget(null);
      refreshStock();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const adjustMutation = useMutation({
    mutationFn: () =>
      inventoryApi.adjust(adjustTarget!.id, {
        inventoryQuantity: Number(adjustForm.countedQuantity),
        note: adjustForm.note || undefined,
      }),
    onSuccess: () => {
      toast.show('Đã điều chỉnh tồn kho.', 'success');
      setAdjustTarget(null);
      refreshStock();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  function openIssue(row: InventoryItem) {
    setIssueForm({ quantity: '1', type: InventoryTransactionType.DAMAGED, note: '' });
    setIssueTarget(row);
  }

  function openAdjust(row: InventoryItem) {
    setAdjustForm({ countedQuantity: String(row.inventoryQuantity), note: '' });
    setAdjustTarget(row);
  }

  const columns: Column<InventoryItem>[] = [
    {
      key: 'code',
      header: 'Mã hàng',
      render: (row) => <span className="font-mono text-xs text-muted">{row.item?.code ?? '—'}</span>,
    },
    {
      key: 'itemName',
      header: 'Mặt hàng',
      render: (row) => (
        <button
          type="button"
          onClick={() => setBatchesOf(row)}
          className="font-medium text-primary hover:underline"
        >
          {row.item?.itemName ?? '—'}
        </button>
      ),
    },
    {
      key: 'inventoryQuantity',
      header: 'Tồn',
      sortable: true,
      /*
        Số lượng đi kèm NHÃN CHỮ, không chỉ tô đỏ khi bằng 0: người không phân biệt được
        màu vẫn phải đọc ra "hết hàng" (mục 30 của đặc tả giao diện). Màu đỏ trần trên
        một chữ số cũng dễ bị đọc nhầm thành "số âm".
      */
      render: (row) => {
        const level = stockLevelOf(row.inventoryQuantity);
        return (
          <span className="flex items-center gap-2">
            <span className="font-semibold tabular-nums">{row.inventoryQuantity}</span>
            {level === 'out' && (
              <Badge variant={STOCK_LEVEL_BADGE_VARIANT[level]}>{STOCK_LEVEL_LABEL_VI[level]}</Badge>
            )}
          </span>
        );
      },
    },
    {
      key: 'active',
      header: 'Trạng thái',
      render: (row) => (
        <Badge variant={row.active ? 'success' : 'outline'}>
          {row.active ? 'Đang kinh doanh' : 'Ngưng tại chi nhánh'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setBatchesOf(row)}>
            Xem lô
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setLedgerOf(row)}>
            Sổ cái
          </Button>
          {canWrite && (
            <>
              <Button size="sm" variant="secondary" onClick={() => openAdjust(row)}>
                Điều chỉnh
              </Button>
              <Button size="sm" variant="destructive" onClick={() => openIssue(row)}>
                Xuất kho
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const batchColumns: Column<InventoryBatch>[] = [
    { key: 'batchNo', header: 'Mã lô', render: (row) => <span className="font-mono">{row.batchNo}</span> },
    {
      key: 'expiryDate',
      header: 'Hạn dùng',
      // Cột được tô màu theo mức độ gần hạn — yêu cầu của P6-T9.
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
    { key: 'costPrice', header: 'Giá vốn', render: (row) => formatCurrency(row.costPrice) },
    { key: 'receivedAt', header: 'Ngày nhập', render: (row) => formatDate(row.receivedAt) },
  ];

  const ledgerColumns: Column<InventoryTransaction>[] = [
    { key: 'createdAt', header: 'Thời điểm', render: (row) => formatDateTime(row.createdAt) },
    {
      key: 'type',
      header: 'Loại',
      render: (row) => <Badge>{INVENTORY_TRANSACTION_TYPE_LABEL_VI[row.type]}</Badge>,
    },
    {
      key: 'quantityChange',
      header: 'Thay đổi',
      // Dấu +/- mới là thứ mang nghĩa; màu chỉ giúp quét cột nhanh hơn.
      render: (row) => (
        <span className={row.quantityChange < 0 ? 'text-danger' : 'text-success'}>
          {row.quantityChange > 0 ? `+${row.quantityChange}` : row.quantityChange}
        </span>
      ),
    },
    { key: 'quantityAfter', header: 'Tồn sau', render: (row) => row.quantityAfter },
    { key: 'batch', header: 'Lô', render: (row) => row.batch?.batchNo ?? '—' },
    { key: 'note', header: 'Ghi chú', render: (row) => row.note ?? '—' },
  ];

  const data = listQuery.data;
  const batches = batchesQuery.data ?? [];
  const usableQuantity = batches
    .filter((b) => expiryLevel(b.expiryDate) !== 'expired')
    .reduce((sum, b) => sum + b.quantity, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tồn kho</h1>
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
        <Input
          label="Tìm kiếm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Tên hoặc mã mặt hàng…"
          className="w-72"
        />
        <Select
          label="Lọc"
          value={lowStockOnly ? 'low' : ''}
          onChange={(value) => {
            setLowStockOnly(value === 'low');
            setPage(1);
          }}
          options={[
            { value: '', label: 'Tất cả' },
            { value: 'low', label: 'Đã chạm ngưỡng tối thiểu' },
          ]}
        />
        <Button
          variant="ghost"
          onClick={() => {
            setSearch('');
            setLowStockOnly(false);
            setSearchParams({});
            setPage(1);
          }}
        >
          Xóa bộ lọc
        </Button>
        {focusedItemId && (
          <p className="text-sm text-muted">
            Đang xem một mặt hàng cụ thể (mở từ trang cảnh báo). Bấm “Xóa bộ lọc” để xem cả kho.
          </p>
        )}
      </div>

      <Table
        columns={columns}
        data={data?.data ?? []}
        getRowId={(row) => row.id}
        loading={listQuery.isLoading}
        emptyMessage={branchId ? 'Chi nhánh chưa có mặt hàng nào.' : 'Chọn một chi nhánh.'}
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
        open={batchesOf !== null}
        onClose={() => setBatchesOf(null)}
        title={batchesOf ? `Lô hàng — ${batchesOf.item?.itemName ?? ''}` : ''}
        footer={
          <Button variant="secondary" onClick={() => setBatchesOf(null)}>
            Đóng
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Tồn tổng <strong>{batchesOf?.inventoryQuantity ?? 0}</strong>, trong đó dùng được{' '}
            <strong>{usableQuantity}</strong>. Chênh lệch là hàng đã hết hạn — vẫn nằm trong kho
            nhưng không bán và không cấp phát được (BR-11).
          </p>
          <Table
            columns={batchColumns}
            data={batches}
            getRowId={(row) => row.id}
            loading={batchesQuery.isLoading}
            emptyMessage="Mặt hàng này chưa có lô nào."
          />
        </div>
      </Modal>

      <Modal
        open={ledgerOf !== null}
        onClose={() => setLedgerOf(null)}
        title={ledgerOf ? `Sổ cái — ${ledgerOf.item?.itemName ?? ''}` : ''}
        footer={
          <Button variant="secondary" onClick={() => setLedgerOf(null)}>
            Đóng
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            50 giao dịch gần nhất. Sổ cái là bản ghi bất biến: ghi sai thì lập một điều chỉnh
            ngược, không sửa dòng cũ.
          </p>
          <Table
            columns={ledgerColumns}
            data={ledgerQuery.data?.data ?? []}
            getRowId={(row) => row.id}
            loading={ledgerQuery.isLoading}
            emptyMessage="Chưa có giao dịch nào."
          />
        </div>
      </Modal>

      <Modal
        open={issueTarget !== null}
        onClose={() => setIssueTarget(null)}
        title={issueTarget ? `Xuất kho — ${issueTarget.item?.itemName ?? ''}` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIssueTarget(null)}>
              Hủy
            </Button>
            <Button type="submit" form="issue-form" loading={issueMutation.isPending}>
              Xuất kho
            </Button>
          </>
        }
      >
        <form
          id="issue-form"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            issueMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <p className="text-sm text-muted">
            Hệ thống tự chọn lô theo FEFO (hết hạn sớm nhất trước) và bỏ qua lô đã hết hạn.
            Bán lẻ và cấp thuốc theo đơn không đi qua đây.
          </p>
          <Input
            label="Số lượng"
            type="number"
            min={1}
            required
            value={issueForm.quantity}
            onChange={(e) => setIssueForm({ ...issueForm, quantity: e.target.value })}
            hint={`Tồn hiện tại: ${issueTarget?.inventoryQuantity ?? 0}`}
          />
          <Select
            label="Lý do"
            value={issueForm.type}
            onChange={(value) =>
              setIssueForm({ ...issueForm, type: value as InventoryTransactionType })
            }
            options={MANUAL_ISSUE_TYPES.map((type) => ({
              value: type,
              label: INVENTORY_TRANSACTION_TYPE_LABEL_VI[type],
            }))}
          />
          <Textarea
            label="Ghi chú"
            rows={2}
            required
            value={issueForm.note}
            onChange={(e) => setIssueForm({ ...issueForm, note: e.target.value })}
            hint="Bắt buộc — một lần xuất không lý do là không đối soát được."
          />
        </form>
      </Modal>

      <Modal
        open={adjustTarget !== null}
        onClose={() => setAdjustTarget(null)}
        title={adjustTarget ? `Điều chỉnh tồn — ${adjustTarget.item?.itemName ?? ''}` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdjustTarget(null)}>
              Hủy
            </Button>
            <Button type="submit" form="adjust-form" loading={adjustMutation.isPending}>
              Lưu điều chỉnh
            </Button>
          </>
        }
      >
        <form
          id="adjust-form"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            adjustMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <p className="text-sm text-muted">
            Điều chỉnh lẻ một mặt hàng. Kiểm kê cả chi nhánh thì dùng trang{' '}
            <strong>Kiểm kê</strong> — ở đó có chụp số hệ thống và đối chiếu từng dòng.
          </p>
          <Input
            label="Số thực tế"
            type="number"
            min={0}
            required
            value={adjustForm.countedQuantity}
            onChange={(e) => setAdjustForm({ ...adjustForm, countedQuantity: e.target.value })}
            hint={`Hệ thống đang ghi: ${adjustTarget?.inventoryQuantity ?? 0}`}
          />
          <Textarea
            label="Lý do"
            rows={2}
            value={adjustForm.note}
            onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}
