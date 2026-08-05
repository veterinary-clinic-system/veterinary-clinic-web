import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '@/api/billing.api';
import { Badge } from '@/components/basic';
import { InvoiceStatus, PaymentMethod, PaymentStatus } from '@/types/enums';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { getErrorMessage } from '@/utils/errors';
import {
  INVOICE_SOURCE_LABEL_VI,
  INVOICE_STATUS_LABEL_VI,
  INVOICE_STATUS_VARIANT,
  PAYMENT_METHOD_LABEL_VI,
  PAYMENT_STATUS_LABEL_VI,
} from '@/utils/labels';

/**
 * Một hoá đơn: các dòng, ba dòng tổng, lịch sử thanh toán và form thu tiền.
 *
 * Từ P8-T2 một hoá đơn trả được **nhiều lần**: ô "Số tiền" để trống nghĩa là trả hết
 * phần còn lại, điền số nhỏ hơn là trả một phần. Số còn phải thu tính từ lịch sử thanh
 * toán chứ không từ `totalAmount` — hoá đơn trả một phần thì hai số đó khác nhau.
 */
export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amount, setAmount] = useState('');
  const [referenceCode, setReferenceCode] = useState('');

  const invoiceQuery = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => billingApi.getOne(id!),
    enabled: !!id,
  });

  const paymentsQuery = useQuery({
    queryKey: ['invoice-payments', id],
    queryFn: () => billingApi.payments(id!),
    enabled: !!id,
  });

  const payMutation = useMutation({
    mutationFn: () =>
      billingApi.pay(id!, {
        paymentMethod,
        amount: amount.trim() === '' ? undefined : Number(amount),
        referenceCode: referenceCode.trim() || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['invoice', id], updated);
      queryClient.invalidateQueries({ queryKey: ['invoice-payments', id] });
      setAmount('');
      setReferenceCode('');
    },
  });

  if (invoiceQuery.isLoading) {
    return <p className="text-muted">Đang tải hóa đơn…</p>;
  }
  const invoice = invoiceQuery.data;
  if (!invoice) {
    return <p className="text-destructive">Không tìm thấy hóa đơn.</p>;
  }

  // Số đã thu cộng từ lịch sử thanh toán (dòng hoàn tiền mang số âm nên tự trừ ra) —
  // cùng cách backend tính, để hai bên không bao giờ hiện hai con số khác nhau.
  const paidAmount = (paymentsQuery.data ?? [])
    .filter((p) => p.status === PaymentStatus.SUCCESS || p.status === PaymentStatus.REFUNDED)
    .reduce((sum, p) => sum + p.amount, 0);
  const outstanding = Math.max(0, invoice.totalAmount - paidAmount);
  const canPay =
    outstanding > 0 &&
    invoice.status !== InvoiceStatus.CANCELLED &&
    invoice.status !== InvoiceStatus.REFUNDED;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">Hóa đơn {invoice.invoiceCode}</h1>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-muted">
            {INVOICE_SOURCE_LABEL_VI[invoice.source]}
          </span>
        </div>
        {/* Hoá đơn POS không có lịch hẹn (P8-T1) - hiện khách hàng thay cho liên kết. */}
        {invoice.appointmentId ? (
          <Link to={`/staff/appointments/${invoice.appointmentId}`} className="text-sm text-primary hover:underline">
            Xem lịch hẹn liên quan
          </Link>
        ) : (
          <p className="text-sm text-muted">
            Bán lẻ tại quầy — {invoice.customer ? invoice.customer.fullName : 'khách vãng lai'}
          </p>
        )}
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
          {/* Ba dòng tổng đọc thẳng số backend đã chốt, không cộng lại từ `items`. */}
          <tfoot>
            <tr className="border-t border-border">
              <td colSpan={3} className="px-3 py-2 text-right text-muted">
                Tạm tính
              </td>
              <td className="px-3 py-2 text-right">{formatCurrency(invoice.subtotal)}</td>
            </tr>
            {invoice.discountAmount > 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-2 text-right text-muted">
                  Giảm giá
                </td>
                <td className="px-3 py-2 text-right">-{formatCurrency(invoice.discountAmount)}</td>
              </tr>
            )}
            {invoice.taxAmount > 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-2 text-right text-muted">
                  Thuế
                </td>
                <td className="px-3 py-2 text-right">{formatCurrency(invoice.taxAmount)}</td>
              </tr>
            )}
            <tr className="border-t border-border font-medium">
              <td colSpan={3} className="px-3 py-2 text-right">
                Tổng cộng
              </td>
              <td className="px-3 py-2 text-right">{formatCurrency(invoice.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="rounded border border-border bg-surface p-4">
        <h2 className="mb-3 font-medium">Thanh toán</h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-muted">Trạng thái</dt>
          <dd>
            <Badge variant={INVOICE_STATUS_VARIANT[invoice.status]}>
              {INVOICE_STATUS_LABEL_VI[invoice.status]}
            </Badge>
          </dd>
          <dt className="text-muted">Đã thu</dt>
          <dd className="tabular-nums">{formatCurrency(paidAmount)}</dd>
          <dt className="text-muted">Còn phải thu</dt>
          <dd className={`tabular-nums ${outstanding > 0 ? 'text-destructive' : ''}`}>
            {formatCurrency(outstanding)}
          </dd>
          <dt className="text-muted">Phương thức gần nhất</dt>
          <dd>{invoice.paymentMethod ? PAYMENT_METHOD_LABEL_VI[invoice.paymentMethod] : '—'}</dd>
          <dt className="text-muted">Ngày thanh toán</dt>
          <dd>{invoice.paidAt ? formatDateTime(invoice.paidAt) : '—'}</dd>
        </dl>

        {(paymentsQuery.data?.length ?? 0) > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium text-muted">Lịch sử thanh toán</h3>
            <ul className="flex flex-col gap-2">
              {paymentsQuery.data?.map((payment) => (
                <li
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Badge
                      variant={payment.status === PaymentStatus.SUCCESS ? 'success' : 'warning'}
                    >
                      {PAYMENT_STATUS_LABEL_VI[payment.status]}
                    </Badge>
                    <span>{PAYMENT_METHOD_LABEL_VI[payment.method]}</span>
                    {payment.referenceCode && (
                      <span className="font-mono text-xs text-muted">{payment.referenceCode}</span>
                    )}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-muted">
                      {formatDateTime(payment.paidAt ?? payment.createdAt)}
                    </span>
                    <span className="tabular-nums font-medium">{formatCurrency(payment.amount)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {canPay && (
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
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Số tiền (bỏ trống = trả hết)</span>
              <input
                type="number"
                min={1}
                max={outstanding}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={String(outstanding)}
                className="w-40 rounded border border-border bg-surface px-3 py-2 text-sm tabular-nums"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Mã giao dịch</span>
              <input
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                placeholder="UNC / mã VNPay"
                className="w-48 rounded border border-border bg-surface px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={payMutation.isPending}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {payMutation.isPending ? 'Đang xử lý…' : 'Xác nhận thanh toán'}
            </button>
            {payMutation.isError && (
              <span className="text-sm text-destructive">{getErrorMessage(payMutation.error)}</span>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
