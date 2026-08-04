import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '@/api/customers.api';
import { Badge, Table } from '@/components/basic';
import type { Column } from '@/components/basic';
import { CustomerTransaction, Pet } from '@/types/models';
import { APPOINTMENT_STATUS_LABEL_VI, PAYMENT_METHOD_LABEL_VI } from '@/utils/labels';
import { GENDER_LABEL_VI } from '@/utils/display';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';

type Tab = 'pets' | 'transactions';

/** Hồ sơ một khách hàng: thông tin, danh sách thú cưng, lịch sử giao dịch. */
export function CustomerDetailPage() {
  const { id = '' } = useParams();
  const [tab, setTab] = useState<Tab>('pets');

  const customerQuery = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getOne(id),
    enabled: Boolean(id),
  });

  const customer = customerQuery.data;

  if (customerQuery.isLoading) {
    return <p className="text-muted">Đang tải…</p>;
  }
  if (!customer) {
    return <p className="text-muted">Không tìm thấy khách hàng.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/staff/customers" className="text-sm text-primary hover:underline">
          ← Danh sách khách hàng
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{customer.fullName}</h1>
          <Badge variant={customer.active ? 'success' : 'destructive'}>
            {customer.active ? 'Hoạt động' : 'Đã ngưng'}
          </Badge>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 rounded border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Số điện thoại" value={customer.phone} />
        <Field label="Email" value={customer.email ?? '—'} />
        <Field label="Địa chỉ" value={customer.address ?? '—'} />
        <Field label="Ngày tạo hồ sơ" value={formatDate(customer.createdAt)} />
        <Field
          label="Lần khám gần nhất"
          value={customer.lastVisitAt ? formatDate(customer.lastVisitAt) : 'Chưa có'}
        />
        <Field label="Ghi chú nội bộ" value={customer.note ?? '—'} />
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Thú cưng" value={String(customer.petCount)} />
        <Stat label="Lượt hẹn" value={String(customer.appointmentCount)} />
        <Stat label="Đã hoàn tất" value={String(customer.completedAppointmentCount)} />
        <Stat label="Đã thanh toán" value={formatCurrency(customer.totalPaid)} />
        <Stat
          label="Còn nợ"
          value={formatCurrency(customer.totalUnpaid)}
          emphasis={customer.totalUnpaid > 0}
        />
      </section>

      <div className="flex gap-2 border-b border-border">
        <TabButton active={tab === 'pets'} onClick={() => setTab('pets')}>
          Thú cưng ({customer.petCount})
        </TabButton>
        <TabButton active={tab === 'transactions'} onClick={() => setTab('transactions')}>
          Lịch sử giao dịch ({customer.invoiceCount})
        </TabButton>
      </div>

      {tab === 'pets' ? <PetsTab customerId={id} /> : <TransactionsTab customerId={id} />}
    </div>
  );
}

function PetsTab({ customerId }: { customerId: string }) {
  const query = useQuery({
    queryKey: ['customer-pets', customerId],
    queryFn: () => customersApi.pets(customerId),
  });

  const columns: Column<Pet>[] = [
    {
      key: 'name',
      header: 'Tên',
      render: (row) => (
        <Link to={`/staff/patients/${row.id}`} className="font-medium text-primary hover:underline">
          {row.name}
        </Link>
      ),
    },
    {
      key: 'breed',
      header: 'Giống loài',
      render: (row) =>
        row.breed
          ? `${row.breed.breedName}${row.breed.species ? ` (${row.breed.species.speciesName})` : ''}`
          : '—',
    },
    { key: 'gender', header: 'Giới tính', render: (row) => GENDER_LABEL_VI[row.gender] },
    { key: 'weight', header: 'Cân nặng', render: (row) => (row.weight ? `${row.weight} kg` : '—') },
    {
      key: 'birthDate',
      header: 'Ngày sinh',
      render: (row) => (row.birthDate ? formatDate(row.birthDate) : '—'),
    },
    {
      key: 'flags',
      header: 'Lưu ý',
      render: (row) => {
        const flags = [...row.allergies, ...row.chronicConditions];
        return flags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {flags.map((flag) => (
              <Badge key={flag} variant="warning">
                {flag}
              </Badge>
            ))}
          </div>
        ) : (
          '—'
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      data={query.data ?? []}
      getRowId={(row) => row.id}
      loading={query.isLoading}
      emptyMessage="Khách hàng chưa có thú cưng nào."
    />
  );
}

function TransactionsTab({ customerId }: { customerId: string }) {
  const query = useQuery({
    queryKey: ['customer-transactions', customerId],
    queryFn: () => customersApi.transactions(customerId),
  });

  const columns: Column<CustomerTransaction>[] = [
    { key: 'visitedAt', header: 'Ngày khám', render: (row) => formatDateTime(row.visitedAt) },
    {
      key: 'petName',
      header: 'Thú cưng',
      render: (row) => (
        <Link to={`/staff/patients/${row.petId}`} className="text-primary hover:underline">
          {row.petName}
        </Link>
      ),
    },
    { key: 'serviceName', header: 'Dịch vụ', render: (row) => row.serviceName ?? '—' },
    { key: 'doctorName', header: 'Bác sĩ', render: (row) => row.doctorName ?? '—' },
    { key: 'branchName', header: 'Chi nhánh', render: (row) => row.branchName ?? '—' },
    {
      key: 'appointmentStatus',
      header: 'Lượt hẹn',
      render: (row) => APPOINTMENT_STATUS_LABEL_VI[row.appointmentStatus],
    },
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
      key: 'invoice',
      header: '',
      render: (row) => (
        <Link to={`/staff/billing/${row.invoiceId}`} className="text-sm text-primary hover:underline">
          Xem hóa đơn
        </Link>
      ),
    },
  ];

  const total = (query.data ?? []).reduce((sum, row) => sum + row.totalAmount, 0);

  return (
    <div className="flex flex-col gap-3">
      <Table
        columns={columns}
        data={query.data ?? []}
        getRowId={(row) => row.invoiceId}
        loading={query.isLoading}
        emptyMessage="Khách hàng chưa có giao dịch nào."
      />
      {(query.data?.length ?? 0) > 0 && (
        <p className="text-right text-sm text-muted">
          Tổng giá trị {query.data?.length} giao dịch:{' '}
          <strong className="text-foreground">{formatCurrency(total)}</strong>
        </p>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function Stat({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="rounded border border-border bg-surface p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${emphasis ? 'text-destructive' : ''}`}>
        {value}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium ${
        active ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}
