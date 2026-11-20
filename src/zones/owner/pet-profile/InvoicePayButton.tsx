import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sepayApi } from '@/api/billing.api';
import { Button } from '@/components/basic';
import { PaymentStatus } from '@/types/enums';
import { getErrorMessage } from '@/utils/errors';
import { formatCurrency } from '@/utils/format';

/**
 * Chủ nuôi tự thanh toán hoá đơn "Chưa thanh toán" bằng mã VietQR. Trước đây danh sách chỉ là
 * chữ tĩnh và API tạo QR chỉ mở cho thu ngân (403).
 */
export function InvoicePayButton({ invoiceId, petId }: { invoiceId: string; petId: string }) {
  const queryClient = useQueryClient();
  const ticketMutation = useMutation({ mutationFn: () => sepayApi.createQrForOwner(invoiceId) });
  const ticket = ticketMutation.data;

  const statusQuery = useQuery({
    queryKey: ['owner-sepay-ticket', ticket?.paymentId],
    queryFn: () => sepayApi.publicTicket(ticket!.paymentId),
    enabled: !!ticket,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return !status || status === PaymentStatus.PENDING ? 3_000 : false;
    },
  });
  const paid = statusQuery.data?.status === PaymentStatus.SUCCESS;

  // Làm mới hồ sơ sức khoẻ MỘT lần khi vừa thanh toán xong - không gọi trong lúc render.
  useEffect(() => {
    if (paid) void queryClient.invalidateQueries({ queryKey: ['pets', petId, 'owner-health-record'] });
  }, [paid, petId, queryClient]);

  if (paid) {
    return <p className="text-sm font-semibold text-success">Đã thanh toán, cảm ơn bạn!</p>;
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          size="sm"
          onClick={() => ticketMutation.mutate()}
          loading={ticketMutation.isPending}
          disabled={ticketMutation.isPending}
        >
          Thanh toán
        </Button>
        {ticketMutation.isError && (
          <p className="max-w-[240px] text-right text-xs text-danger">
            {getErrorMessage(ticketMutation.error, 'Chưa tạo được mã thanh toán, vui lòng thử lại.')}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg border border-border bg-surface-muted p-4 text-center sm:w-auto">
      <p className="text-sm font-semibold text-foreground">
        Quét mã để thanh toán {formatCurrency(ticket.amount)}
      </p>
      <img
        src={ticket.qrImageUrl}
        alt={`Mã QR thanh toán hóa đơn ${ticket.invoiceCode}`}
        className="mx-auto mt-3 w-full max-w-56 rounded-lg"
      />
      <p className="mt-2 text-xs text-muted">Nội dung chuyển khoản</p>
      <p className="select-all font-mono text-sm font-semibold">{ticket.transferContent}</p>
      <p className="mt-2 text-xs text-muted">Hệ thống tự xác nhận khi nhận được tiền.</p>
    </div>
  );
}
