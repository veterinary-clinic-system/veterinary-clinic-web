import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { petsApi } from '@/api/pets.api';
import { Badge, ClientPagedTable } from '@/components/basic';
import type { Column } from '@/components/basic';
import type { PetInvoice } from '@/types/models';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import { PAYMENT_METHOD_LABEL_VI } from '@/utils/labels';

/** Khối 8 - Invoice. */
export function InvoicesTab({ petId }: { petId: string }) {
  const query = useQuery({
    queryKey: ['pet-invoices', petId],
    queryFn: () => petsApi.invoices(petId),
  });

  const columns: Column<PetInvoice>[] = [
    { key: 'visitedAt', header: 'Ngày khám', render: (row) => formatDateTime(row.visitedAt) },
    {
      key: 'totalAmount',
      header: 'Số tiền',
      render: (row) => <span className="tabular-nums">{formatCurrency(row.totalAmount)}</span>,
    },
    {
      key: 'paid',
      header: 'Thanh toán',
      render: (row) =>
        row.paid ? (
          <div className="flex flex-col gap-0.5">
            <Badge variant="success">
              {row.paymentMethod ? PAYMENT_METHOD_LABEL_VI[row.paymentMethod] : 'Đã thanh toán'}
            </Badge>
            {row.paidAt && <span className="text-xs text-muted">{formatDate(row.paidAt)}</span>}
          </div>
        ) : (
          <Badge variant="destructive">Chưa thanh toán</Badge>
        ),
    },
    {
      key: 'link',
      header: '',
      render: (row) => (
        <Link to={`/staff/billing/${row.invoiceId}`} className="text-sm text-primary hover:underline">
          Xem hóa đơn
        </Link>
      ),
    },
  ];

  return (
    <ClientPagedTable
      columns={columns}
      data={query.data ?? []}
      getRowId={(row) => row.invoiceId}
      loading={query.isLoading}
      emptyMessage="Thú cưng chưa có hóa đơn nào."
    />
  );
}
