import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { branchesApi } from '@/api/branches.api';
import { billingApi } from '@/api/billing.api';
import { INVOICE_SOURCE_LABEL_VI, PAYMENT_METHOD_LABEL_VI } from '@/utils/labels';
import { formatCurrency } from '@/utils/format';

const LIMIT = 20;

/**
 * Danh sách hoá đơn có phân trang.
 *
 * Từ P8-T1 cột "Thành tiền" đọc `totalAmount` — con số backend đã chốt lúc lập hoá đơn,
 * có mặt trên mọi dòng của danh sách. Trước đó trang này cố tình bỏ trống cột tổng vì
 * chỉ cộng được từ `items`, mà quan hệ đó không chắc được nạp trong danh sách.
 */
export function BillingListPage() {
  const { user } = useAuth();
  const [branchId, setBranchId] = useState(user?.branchId ?? '');
  const [paid, setPaid] = useState<'' | 'true' | 'false'>('');
  const [page, setPage] = useState(1);

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

  const data = listQuery.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Hóa đơn</h1>

      <div className="flex flex-wrap items-end gap-4 rounded border border-border bg-surface p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Chi nhánh</span>
          <select
            value={branchId}
            onChange={(e) => {
              setBranchId(e.target.value);
              setPage(1);
            }}
            className="rounded border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">Tất cả chi nhánh</option>
            {(branchesQuery.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.branchName}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Trạng thái thanh toán</span>
          <select
            value={paid}
            onChange={(e) => {
              setPaid(e.target.value as '' | 'true' | 'false');
              setPage(1);
            }}
            className="rounded border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">Tất cả</option>
            <option value="true">Đã thanh toán</option>
            <option value="false">Chưa thanh toán</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-muted text-left">
              <th className="px-3 py-2">Mã hóa đơn</th>
              <th className="px-3 py-2">Nguồn</th>
              <th className="px-3 py-2">Khách hàng</th>
              <th className="px-3 py-2 text-right">Thành tiền</th>
              <th className="px-3 py-2">Phương thức</th>
              <th className="px-3 py-2">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isLoading && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted">
                  Đang tải…
                </td>
              </tr>
            )}
            {!listQuery.isLoading && (data?.data.length ?? 0) === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted">
                  Không có hóa đơn nào.
                </td>
              </tr>
            )}
            {data?.data.map((inv) => (
              <tr key={inv.id} className="border-t border-border hover:bg-surface-muted">
                <td className="px-3 py-2">
                  <Link to={`/staff/billing/${inv.id}`} className="font-mono text-xs text-primary hover:underline">
                    {inv.invoiceCode}
                  </Link>
                </td>
                <td className="px-3 py-2">{INVOICE_SOURCE_LABEL_VI[inv.source]}</td>
                <td className="px-3 py-2">{inv.customer?.fullName ?? 'Khách vãng lai'}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(inv.totalAmount)}</td>
                <td className="px-3 py-2">{inv.paymentMethod ? PAYMENT_METHOD_LABEL_VI[inv.paymentMethod] : '—'}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${inv.paid ? 'bg-triage-green/10 text-triage-green' : 'bg-triage-yellow/10 text-triage-yellow'}`}
                  >
                    {inv.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            Trang {data.page} / {totalPages} — tổng {data.total} hóa đơn
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-border px-3 py-1 hover:bg-surface-muted disabled:opacity-50"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded border border-border px-3 py-1 hover:bg-surface-muted disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
