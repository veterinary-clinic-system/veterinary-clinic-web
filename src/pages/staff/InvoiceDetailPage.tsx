import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '@/api/billing.api';
import { PaymentMethod } from '@/types/enums';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { PAYMENT_METHOD_LABEL_VI } from '@/utils/labels';

/** Single invoice: line items, grand total, and a payment-confirmation form when unpaid. */
export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);

  const invoiceQuery = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => billingApi.getOne(id!),
    enabled: !!id,
  });

  const payMutation = useMutation({
    mutationFn: () => billingApi.pay(id!, paymentMethod),
    onSuccess: (updated) => queryClient.setQueryData(['invoice', id], updated),
  });

  if (invoiceQuery.isLoading) {
    return <p className="text-muted">Đang tải hóa đơn…</p>;
  }
  const invoice = invoiceQuery.data;
  if (!invoice) {
    return <p className="text-destructive">Không tìm thấy hóa đơn.</p>;
  }

  const total = invoice.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Hóa đơn #{invoice.id.slice(0, 8)}</h1>
        <Link to={`/staff/appointments/${invoice.appointmentId}`} className="text-sm text-primary hover:underline">
          Xem lịch hẹn liên quan
        </Link>
      </div>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full min-w-[600px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-muted text-left">
              <th className="px-3 py-2">Mục</th>
              <th className="px-3 py-2 text-right">Đơn giá</th>
              <th className="px-3 py-2 text-right">Số lượng</th>
              <th className="px-3 py-2 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted">
                  Chưa có mục nào trong hóa đơn.
                </td>
              </tr>
            ) : (
              invoice.items.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-3 py-2">{item.item.itemName}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(item.price)}</td>
                  <td className="px-3 py-2 text-right">{item.quantity}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(item.price * item.quantity)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-border font-medium">
              <td colSpan={3} className="px-3 py-2 text-right">
                Tổng cộng
              </td>
              <td className="px-3 py-2 text-right">{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="rounded border border-border bg-surface p-4">
        <h2 className="mb-3 font-medium">Thanh toán</h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-muted">Trạng thái</dt>
          <dd>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${invoice.paid ? 'bg-triage-green/10 text-triage-green' : 'bg-triage-yellow/10 text-triage-yellow'}`}
            >
              {invoice.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </span>
          </dd>
          <dt className="text-muted">Phương thức</dt>
          <dd>{invoice.paymentMethod ? PAYMENT_METHOD_LABEL_VI[invoice.paymentMethod] : '—'}</dd>
          <dt className="text-muted">Ngày thanh toán</dt>
          <dd>{invoice.paidAt ? formatDateTime(invoice.paidAt) : '—'}</dd>
        </dl>

        {!invoice.paid && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              payMutation.mutate();
            }}
            className="mt-4 flex flex-wrap items-end gap-3"
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Phương thức thanh toán</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="rounded border border-border bg-surface px-3 py-2 text-sm"
              >
                {Object.values(PaymentMethod).map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABEL_VI[m]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={payMutation.isPending}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {payMutation.isPending ? 'Đang xử lý…' : 'Xác nhận thanh toán'}
            </button>
            {payMutation.isError && <span className="text-sm text-destructive">Thanh toán thất bại.</span>}
          </form>
        )}
      </div>
    </div>
  );
}
