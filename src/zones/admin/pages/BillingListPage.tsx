import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { billingApi, sepayApi } from '@/api/billing.api';
import { Button, DataTable, Icon, PageHeader, Select, StatusBadge } from '@/components/basic';
import type { DataColumn } from '@/components/basic';
import { useAuth } from '@/context/AuthContext';
import { Invoice } from '@/types/models';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { getErrorMessage } from '@/utils/errors';
import {
  INVOICE_SOURCE_LABEL_VI,
  INVOICE_STATUS_LABEL_VI,
  INVOICE_STATUS_VARIANT,
  PAYMENT_METHOD_LABEL_VI,
} from '@/utils/labels';

const LIMIT = 20;

export function BillingListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [branchId, setBranchId] = useState(user?.branchId ?? '');
  const [paid, setPaid] = useState<'' | 'true' | 'false'>('');
  const [page, setPage] = useState(1);
  const [reconcileCodes, setReconcileCodes] = useState<Record<string, string>>({});

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });

  const listQuery = useQuery({
    queryKey: ['invoices', branchId, paid, page],
    queryFn: () =>
      billingApi.list({
        page,
        limit: LIMIT,
        branchId: branchId || undefined,
        paid: paid === '' ? undefined : paid === 'true',
      }),
    placeholderData: (prev) => prev,
  });

  const reconciliationQuery = useQuery({
    queryKey: ['sepay-reconciliation'],
    queryFn: sepayApi.pendingReconciliations,
    refetchInterval: 15_000,
  });

  const reconcileMutation = useMutation({
    mutationFn: ({ id, invoiceCode }: { id: string; invoiceCode: string }) =>
      sepayApi.reconcile(id, invoiceCode),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sepay-reconciliation'] });
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const columns: DataColumn<Invoice>[] = [
    {
      key: 'invoiceCode',
      header: 'Mã hoá đơn',
      render: (invoice) => (
        <Link
          to={`/staff/billing/${invoice.id}`}
          onClick={(event) => event.stopPropagation()}
          className="font-mono text-xs text-primary hover:underline"
        >
          {invoice.invoiceCode}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: 'Khách hàng',
      render: (invoice) => invoice.customer?.fullName ?? 'Khách vãng lai',
    },
    {
      key: 'source',
      header: 'Nguồn',
      hideBelow: 'md',
      render: (invoice) => INVOICE_SOURCE_LABEL_VI[invoice.source],
    },
    {
      key: 'paidAt',
      header: 'Thanh toán lúc',
      hideBelow: 'lg',
      render: (invoice) => (invoice.paidAt ? formatDateTime(invoice.paidAt) : '—'),
    },
    {
      key: 'totalAmount',
      header: 'Thành tiền',
      align: 'right',
      render: (invoice) => (
        <span className="tabular-nums">{formatCurrency(invoice.totalAmount)}</span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Phương thức',
      hideBelow: 'md',
      render: (invoice) =>
        invoice.paymentMethod ? PAYMENT_METHOD_LABEL_VI[invoice.paymentMethod] : '—',
    },
    {
      key: 'status',
      header: 'Trạng thái',

      render: (invoice) => (
        <StatusBadge variant={INVOICE_STATUS_VARIANT[invoice.status]}>
          {INVOICE_STATUS_LABEL_VI[invoice.status]}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-stack">
      <PageHeader
        title="Hoá đơn"
        description="Hoá đơn đã lập tại quầy và từ phiếu khám, lọc theo chi nhánh và tình trạng thanh toán."
        actions={
          <Link to="/staff/pos">
            <Button>
              <Icon name="cart" className="h-4 w-4" />
              Bán hàng tại quầy
            </Button>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={listQuery.data?.data ?? []}
        getRowId={(invoice) => invoice.id}
        loading={listQuery.isLoading}
        error={listQuery.isError}
        onRetry={() => void listQuery.refetch()}
        page={listQuery.data?.page}
        limit={listQuery.data?.limit}
        total={listQuery.data?.total}
        onPageChange={setPage}
        onRowClick={(invoice) => navigate(`/staff/billing/${invoice.id}`)}
        emptyTitle="Không có hoá đơn nào khớp bộ lọc"
        emptyDescription="Thử bỏ bớt điều kiện lọc, hoặc lập hoá đơn mới từ màn hình bán hàng."
        emptyAction={
          <Link to="/staff/pos">
            <Button variant="secondary">Mở màn hình bán hàng</Button>
          </Link>
        }
        toolbar={
          <>
            <Select
              label="Chi nhánh"
              value={branchId}
              onChange={(value) => {
                setBranchId(value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'Tất cả chi nhánh' },
                ...(branchesQuery.data ?? []).map((branch) => ({
                  value: branch.id,
                  label: branch.branchName,
                })),
              ]}
            />
            <Select
              label="Thanh toán"
              value={paid}
              onChange={(value) => {
                setPaid(value as '' | 'true' | 'false');
                setPage(1);
              }}
              options={[
                { value: '', label: 'Tất cả' },
                { value: 'true', label: 'Đã thanh toán' },
                { value: 'false', label: 'Chưa thanh toán' },
              ]}
            />
          </>
        }
      />

      {(reconciliationQuery.data?.length ?? 0) > 0 && (
        <section className="rounded-xl border border-warning/40 bg-surface p-4">
          <h2 className="text-base font-semibold text-foreground">Giao dịch SePay chờ đối soát</h2>
          <p className="mt-1 text-sm text-muted">
            Chỉ ghép thủ công khi mã hóa đơn và số tiền còn phải thu đã được kiểm tra.
          </p>
          <div className="mt-4 space-y-3">
            {reconciliationQuery.data!.map((transaction) => (
              <div key={transaction.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">{formatCurrency(transaction.transferAmount)}</span>
                  <span className="text-muted">
                    {formatDateTime(transaction.transactionDate ?? transaction.receivedAt)}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-foreground">
                  {transaction.content || 'Không có nội dung'}
                </p>
                <p className="mt-1 text-xs text-destructive">Lý do: {transaction.reviewReason}</p>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <label className="text-xs text-muted">
                    Mã hóa đơn
                    <input
                      value={reconcileCodes[transaction.id] ?? ''}
                      onChange={(event) =>
                        setReconcileCodes((current) => ({
                          ...current,
                          [transaction.id]: event.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="HD000123"
                      className="mt-1 block rounded border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground"
                    />
                  </label>
                  <Button
                    size="sm"
                    disabled={!/^HD\d+$/i.test(reconcileCodes[transaction.id] ?? '')}
                    loading={
                      reconcileMutation.isPending &&
                      reconcileMutation.variables?.id === transaction.id
                    }
                    onClick={() =>
                      reconcileMutation.mutate({
                        id: transaction.id,
                        invoiceCode: reconcileCodes[transaction.id],
                      })
                    }
                  >
                    Ghép giao dịch
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {reconcileMutation.isError && (
            <p className="mt-3 text-sm text-destructive">
              {getErrorMessage(reconcileMutation.error)}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
