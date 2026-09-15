import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingApi, sepayApi, SepayQrTicket } from '@/api/billing.api';
import { Badge, Button, Icon, Skeleton, SkeletonText } from '@/components/basic';
import { QueryErrorState } from '@/components/QueryErrorState';
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

const PAYMENT_OPTIONS = [
  { value: PaymentMethod.CASH, icon: '💵', title: 'Tiền mặt', detail: 'Thu trực tiếp tại quầy' },
  {
    value: PaymentMethod.BANK_TRANSFER,
    icon: '🏦',
    title: 'Chuyển khoản',
    detail: 'VietQR · xác nhận tự động',
  },
  {
    value: PaymentMethod.QR,
    icon: '▦',
    title: 'Quét mã QR',
    detail: 'Quét bằng ứng dụng ngân hàng',
  },
  { value: PaymentMethod.CREDIT_CARD, icon: '💳', title: 'Thẻ', detail: 'Ghi nhận tại quầy' },
  { value: PaymentMethod.E_WALLET, icon: '📱', title: 'Ví điện tử', detail: 'Ghi nhận tại quầy' },
] as const;

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

  const receiptMutation = useMutation({
    mutationFn: () => billingApi.downloadReceipt(id!),
  });

  if (invoiceQuery.isLoading) {
    return (
      <div className="flex flex-col gap-stack">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <SkeletonText lines={6} />
      </div>
    );
  }

  const invoice = invoiceQuery.data;
  if (!invoice) {
    return (
      <QueryErrorState
        error={invoiceQuery.error}
        title="Không tìm thấy hoá đơn"
        description="Hoá đơn có thể đã bị huỷ, hoặc mã trong đường dẫn không đúng."
        onRetry={() => void invoiceQuery.refetch()}
      />
    );
  }

  const paidAmount = (paymentsQuery.data ?? [])
    .filter((p) => p.status === PaymentStatus.SUCCESS || p.status === PaymentStatus.REFUNDED)
    .reduce((sum, p) => sum + p.amount, 0);
  const outstanding = Math.max(0, invoice.totalAmount - paidAmount);
  const canPay =
    outstanding > 0 &&
    invoice.status !== InvoiceStatus.CANCELLED &&
    invoice.status !== InvoiceStatus.REFUNDED;
  const usesSepay =
    paymentMethod === PaymentMethod.BANK_TRANSFER || paymentMethod === PaymentMethod.QR;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Hóa đơn {invoice.invoiceCode}
            </h1>
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-muted">
              {INVOICE_SOURCE_LABEL_VI[invoice.source]}
            </span>
          </div>
          {}
          {invoice.appointmentId ? (
            <Link
              to={`/staff/appointments/${invoice.appointmentId}`}
              className="text-sm text-primary hover:underline"
            >
              Xem lịch hẹn liên quan
            </Link>
          ) : (
            <p className="text-sm text-muted">
              Bán lẻ tại quầy — {invoice.customer ? invoice.customer.fullName : 'khách vãng lai'}
            </p>
          )}
        </div>
        {invoice.status === InvoiceStatus.PAID && (
          <Button
            variant="secondary"
            loading={receiptMutation.isPending}
            onClick={() => receiptMutation.mutate()}
          >
            Xuất biên lai PDF
          </Button>
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
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(item.price * item.quantity)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {}
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
                    <span className="font-medium tabular-nums">
                      {formatCurrency(payment.amount)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {canPay && (
          <div className="payment-method-grid">
            {PAYMENT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={paymentMethod === option.value}
                onClick={() => setPaymentMethod(option.value)}
                className={paymentMethod === option.value ? 'is-selected' : ''}
              >
                <span className="payment-method-icon" aria-hidden="true">
                  {option.icon}
                </span>
                <span>
                  <strong>{option.title}</strong>
                  <small>{option.detail}</small>
                </span>
                <span className="payment-method-check" aria-hidden="true">
                  ✓
                </span>
              </button>
            ))}
          </div>
        )}

        {canPay && !usesSepay && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              payMutation.mutate();
            }}
            className="manual-payment-form mt-4 flex flex-wrap items-end gap-3"
          >
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
            <Button type="submit" loading={payMutation.isPending}>
              <Icon name="check" className="h-4 w-4" />
              Xác nhận đã thu {PAYMENT_METHOD_LABEL_VI[paymentMethod].toLowerCase()}
            </Button>
            {payMutation.isError && (
              <span className="text-sm text-destructive">{getErrorMessage(payMutation.error)}</span>
            )}
          </form>
        )}

        {canPay && usesSepay && <SepayPanel invoiceId={invoice.id} outstanding={outstanding} />}
      </div>
    </div>
  );
}

function SepayPanel({ invoiceId, outstanding }: { invoiceId: string; outstanding: number }) {
  const queryClient = useQueryClient();
  const [ticket, setTicket] = useState<SepayQrTicket | null>(null);

  const createMutation = useMutation({
    mutationFn: () => sepayApi.createQr(invoiceId),
    onSuccess: setTicket,
  });

  const cancelMutation = useMutation({
    mutationFn: () => sepayApi.cancelTicket(ticket!.paymentId),
    onSuccess: () => setTicket(null),
  });

  const receiptMutation = useMutation({
    mutationFn: () => billingApi.downloadReceipt(invoiceId),
  });

  const statusQuery = useQuery({
    queryKey: ['sepay-ticket', ticket?.paymentId],
    queryFn: () => sepayApi.ticket(ticket!.paymentId),
    enabled: !!ticket,

    refetchInterval: (query) =>
      query.state.data?.status === PaymentStatus.PENDING ? 5_000 : false,
  });

  const settled = statusQuery.data?.status === PaymentStatus.SUCCESS;
  const failed = statusQuery.data?.status === PaymentStatus.FAILED;
  const currentStep = !ticket ? 2 : settled ? 4 : 3;

  useEffect(() => {
    if (!ticket || settled) return;
    const controller = new AbortController();
    void sepayApi
      .subscribeTicket(
        ticket.paymentId,
        (status) => queryClient.setQueryData(['sepay-ticket', ticket.paymentId], status),
        controller.signal,
      )
      .catch(() => undefined);
    return () => controller.abort();
  }, [ticket, settled, queryClient]);

  useEffect(() => {
    if (!settled) return;
    void queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
    void queryClient.invalidateQueries({ queryKey: ['invoice-payments', invoiceId] });
  }, [settled, invoiceId, queryClient]);

  return (
    <div className="sepay-checkout mt-6">
      <ol className="payment-progress" aria-label="Tiến trình chuyển khoản">
        {['Chọn phương thức', 'Tạo mã VietQR', 'Quét và chuyển khoản', 'Hoàn tất'].map(
          (label, index) => (
            <li
              key={label}
              className={
                index + 1 < currentStep ? 'is-done' : index + 1 === currentStep ? 'is-current' : ''
              }
            >
              <span>{index + 1 < currentStep ? '✓' : index + 1}</span>
              <small>{label}</small>
            </li>
          ),
        )}
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">Thanh toán an toàn qua VietQR</p>
          <p className="text-sm text-muted">
            Khách quét mã bằng ứng dụng ngân hàng; hệ thống tự ghi nhận khi tiền về.
          </p>
        </div>
        {!ticket && (
          <button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-50"
          >
            {createMutation.isPending
              ? 'Đang tạo mã…'
              : `Tiếp tục · ${formatCurrency(outstanding)} →`}
          </button>
        )}
      </div>

      {createMutation.isError && (
        <p className="mt-2 text-sm text-destructive">{getErrorMessage(createMutation.error)}</p>
      )}

      {ticket && (
        <div className="sepay-ticket mt-4 flex flex-wrap items-start gap-5">
          <img
            src={ticket.qrImageUrl}
            alt="Mã QR chuyển khoản SePay"
            className="h-52 w-52 rounded-lg border border-border bg-white object-contain p-2"
          />
          <dl className="flex-1 space-y-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Số tài khoản</dt>
              <dd className="font-mono text-foreground">{ticket.accountNumber}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Ngân hàng</dt>
              <dd className="text-foreground">{ticket.bankCode}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Số tiền</dt>
              <dd className="font-medium tabular-nums text-foreground">
                {formatCurrency(ticket.amount)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Nội dung</dt>
              <dd className="font-mono text-foreground">{ticket.transferContent}</dd>
            </div>
            <button
              type="button"
              className="sepay-copy"
              onClick={() => void navigator.clipboard.writeText(ticket.transferContent)}
            >
              Sao chép nội dung chuyển khoản
            </button>
            <p className="pt-2 text-xs text-muted">
              Giữ nguyên nội dung chuyển khoản — hệ thống đối chiếu hóa đơn bằng đúng chuỗi này.
            </p>

            <div className="pt-3">
              {settled ? (
                <div className="sepay-success">
                  <span className="sepay-success-icon">✓</span>
                  <div>
                    <strong>Thanh toán thành công</strong>
                    <p>Hóa đơn đã được đối soát tự động.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={receiptMutation.isPending}
                    onClick={() => receiptMutation.mutate()}
                  >
                    Xuất biên lai
                  </Button>
                </div>
              ) : failed ? (
                <Badge variant="destructive">Phiên thanh toán đã kết thúc</Badge>
              ) : (
                <div className="sepay-waiting">
                  <span />
                  <div>
                    <strong>Đang chờ ngân hàng xác nhận</strong>
                    <p>Giữ nguyên màn hình này. Trạng thái sẽ tự cập nhật khi tiền về.</p>
                  </div>
                </div>
              )}
            </div>
            {!settled && !failed && (
              <Button
                size="sm"
                variant="ghost"
                loading={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate()}
              >
                Hủy mã QR này
              </Button>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
