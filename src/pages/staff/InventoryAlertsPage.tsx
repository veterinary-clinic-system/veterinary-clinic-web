import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { inventoryApi } from '@/api/inventory.api';
import { Badge, Button, Select, Table } from '@/components/basic';
import type { Column } from '@/components/basic';
import { InventoryAlertRow } from '@/types/models';
import { formatDate } from '@/utils/format';
import { EXPIRING_SOON_DAYS, EXPIRY_BADGE_VARIANT, expiryLabel, expiryLevel } from '@/utils/inventory';

interface AlertGroup {
  key: string;
  title: string;
  hint: string;
  rows: InventoryAlertRow[];
  /** Nhóm về hạn dùng hiện thêm cột lô + HSD; nhóm về số lượng thì không. */
  showBatch: boolean;
}

/** SRS FR-18-04 — bốn nhóm cảnh báo tồn kho. */
export function InventoryAlertsPage() {
  const navigate = useNavigate();
  const [branchId, setBranchId] = useState('');

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });

  useEffect(() => {
    if (!branchId && branchesQuery.data?.length) {
      setBranchId(branchesQuery.data[0].id);
    }
  }, [branchId, branchesQuery.data]);

  const alertsQuery = useQuery({
    queryKey: ['inventory-alerts', branchId],
    queryFn: () => inventoryApi.alerts(branchId || undefined),
    enabled: Boolean(branchId),
  });

  const alerts = alertsQuery.data;

  const groups: AlertGroup[] = [
    {
      key: 'outOfStock',
      title: 'Hết hàng',
      hint: 'Tồn bằng 0 — không bán và không cấp phát được.',
      rows: alerts?.outOfStock ?? [],
      showBatch: false,
    },
    {
      key: 'expired',
      title: 'Đã hết hạn',
      hint: 'Còn nằm trong kho nhưng không được bán (BR-11). Cần lập phiếu xuất hủy.',
      rows: alerts?.expired ?? [],
      showBatch: true,
    },
    {
      key: 'lowStock',
      title: 'Sắp hết hàng',
      hint: 'Tồn đã chạm ngưỡng tối thiểu của mặt hàng.',
      rows: alerts?.lowStock ?? [],
      showBatch: false,
    },
    {
      key: 'expiringSoon',
      title: 'Sắp hết hạn',
      hint: `Còn hạn nhưng dưới ${EXPIRING_SOON_DAYS} ngày.`,
      rows: alerts?.expiringSoon ?? [],
      showBatch: true,
    },
  ];

  function columnsFor(group: AlertGroup): Column<InventoryAlertRow>[] {
    const base: Column<InventoryAlertRow>[] = [
      {
        key: 'itemCode',
        header: 'Mã hàng',
        render: (row) => <span className="font-mono text-xs text-muted">{row.itemCode}</span>,
      },
      {
        key: 'itemName',
        header: 'Mặt hàng',
        render: (row) => (
          <button
            type="button"
            // Bấm vào đi thẳng tới hàng liên quan trên màn hình kho — yêu cầu P6-T9.
            onClick={() => navigate(`/staff/inventory?item=${row.itemId}&branch=${row.branchId}`)}
            className="font-medium text-primary hover:underline"
          >
            {row.itemName}
          </button>
        ),
      },
      { key: 'quantity', header: 'Số lượng', render: (row) => row.quantity },
    ];

    if (!group.showBatch) {
      base.push({
        key: 'minimumStock',
        header: 'Ngưỡng tối thiểu',
        render: (row) => (row.minimumStock > 0 ? row.minimumStock : '—'),
      });
      return base;
    }

    base.push(
      {
        key: 'batchNo',
        header: 'Lô',
        render: (row) => <span className="font-mono">{row.batchNo ?? '—'}</span>,
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
    );
    return base;
  }

  const totalAlerts = groups.reduce((sum, group) => sum + group.rows.length, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cảnh báo tồn kho</h1>
        <Button variant="secondary" onClick={() => navigate('/staff/inventory')}>
          Về trang tồn kho
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded border border-border bg-surface p-4">
        <Select
          label="Chi nhánh"
          value={branchId}
          onChange={setBranchId}
          options={(branchesQuery.data ?? []).map((b) => ({ value: b.id, label: b.branchName }))}
        />
        <p className="text-sm text-muted">
          {alertsQuery.isLoading
            ? 'Đang tải…'
            : `${totalAlerts} cảnh báo. Hệ thống cũng tự quét mỗi sáng và đẩy thông báo cho người phụ trách kho.`}
        </p>
      </div>

      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-2">
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg font-medium">{group.title}</h2>
            <Badge variant={group.rows.length > 0 ? 'warning' : 'outline'}>
              {group.rows.length}
            </Badge>
          </div>
          <p className="text-sm text-muted">{group.hint}</p>
          <Table
            columns={columnsFor(group)}
            data={group.rows}
            getRowId={(row) => `${group.key}:${row.batchId ?? row.inventoryItemId}`}
            loading={alertsQuery.isLoading}
            emptyMessage="Không có cảnh báo nào ở nhóm này."
          />
        </section>
      ))}
    </div>
  );
}
