import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '@/api/customers.api';
import {
  Badge,
  ClientPagedTable,
  Skeleton,
  SkeletonText,
} from '@/components/basic';
import { QueryErrorState } from '@/components/QueryErrorState';
import type { Column } from '@/components/basic';
import {
  CustomerAppointment,
  CustomerMedicalHistory,
  CustomerPurchase,
  CustomerTransaction,
  Pet,
} from '@/types/models';
import { MedicalRecordStatus, PRIORITY_COLOR_LABEL_VI } from '@/types/enums';
import {
  APPOINTMENT_STATUS_LABEL_VI,
  INVOICE_STATUS_LABEL_VI,
  INVOICE_STATUS_VARIANT,
  MEDICAL_RECORD_STATUS_LABEL_VI,
  PAYMENT_METHOD_LABEL_VI,
  triageColorClasses,
} from '@/utils/labels';
import { GENDER_LABEL_VI } from '@/utils/display';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';

type Tab = 'info' | 'pets' | 'appointments' | 'medical' | 'invoices' | 'purchases';

export function CustomerDetailPage() {
  const { id = '' } = useParams();
  const [tab, setTab] = useState<Tab>('info');

  const customerQuery = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getOne(id),
    enabled: Boolean(id),
  });

  const customer = customerQuery.data;

  if (customerQuery.isLoading) {
    return (
      <div className="flex flex-col gap-stack">
        <Skeleton className="h-16 w-full rounded-xl" />
        <SkeletonText lines={5} />
      </div>
    );
  }

  if (!customer) {
    return (
      <QueryErrorState
        error={customerQuery.error}
        title="Không tìm thấy khách hàng"
        description="Hồ sơ có thể đã bị xoá, hoặc mã trong đường dẫn không đúng."
        onRetry={() => void customerQuery.refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/staff/customers" className="text-sm text-primary hover:underline">
          ← Danh sách khách hàng
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <img src={customer.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{customer.fullName}</h1>
          {customer.customerCode && (
            <span className="rounded bg-surface-muted px-2 py-0.5 font-mono text-sm text-muted">
              {customer.customerCode}
            </span>
          )}
          <Badge variant={customer.active ? 'success' : 'destructive'}>
            {customer.active ? 'Hoạt động' : 'Đã ngưng'}
          </Badge>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Thú cưng" value={String(customer.petCount)} />
        <Stat label="Lượt hẹn" value={String(customer.appointmentCount)} />
        <Stat label="Đã hoàn tất" value={String(customer.completedAppointmentCount)} />
        <Stat label="Đã chi tiêu" value={formatCurrency(customer.totalPaid)} />
        <Stat
          label="Còn nợ"
          value={formatCurrency(customer.totalUnpaid)}
          emphasis={customer.totalUnpaid > 0}
        />
      </section>

      <div className="flex flex-wrap gap-2 border-b border-border">
        <TabButton active={tab === 'info'} onClick={() => setTab('info')}>
          Thông tin
        </TabButton>
        <TabButton active={tab === 'pets'} onClick={() => setTab('pets')}>
          Thú cưng ({customer.petCount})
        </TabButton>
        <TabButton active={tab === 'appointments'} onClick={() => setTab('appointments')}>
          Lịch hẹn ({customer.appointmentCount})
        </TabButton>
        <TabButton active={tab === 'medical'} onClick={() => setTab('medical')}>
          Lịch sử khám
        </TabButton>
        <TabButton active={tab === 'invoices'} onClick={() => setTab('invoices')}>
          Hóa đơn ({customer.invoiceCount})
        </TabButton>
        <TabButton active={tab === 'purchases'} onClick={() => setTab('purchases')}>
          Lịch sử mua hàng ({customer.purchaseCount})
        </TabButton>
      </div>

      {}
      {tab === 'info' && (
        <section className="grid grid-cols-1 gap-4 rounded border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Mã khách hàng" value={customer.customerCode ?? '—'} />
          <Field label="Số điện thoại" value={customer.phone} />
          <Field label="Email" value={customer.email ?? '—'} />
          <Field
            label="Ngày sinh"
            value={customer.dateOfBirth ? formatDate(customer.dateOfBirth) : '—'}
          />
          <Field label="Địa chỉ" value={customer.address ?? '—'} />
          <Field label="Ngày tạo hồ sơ" value={formatDate(customer.createdAt)} />
          <Field
            label="Lần khám gần nhất"
            value={customer.lastVisitAt ? formatDate(customer.lastVisitAt) : 'Chưa có'}
          />
          <Field label="Ghi chú nội bộ" value={customer.note ?? '—'} />
        </section>
      )}
      {tab === 'pets' && <PetsTab customerId={id} />}
      {tab === 'appointments' && <AppointmentsTab customerId={id} />}
      {tab === 'medical' && <MedicalHistoryTab customerId={id} />}
      {tab === 'invoices' && <TransactionsTab customerId={id} />}
      {tab === 'purchases' && <PurchasesTab customerId={id} />}
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
      key: 'petCode',
      header: 'Mã',
      render: (row) => <span className="font-mono text-xs text-muted">{row.petCode}</span>,
    },
    {
      key: 'name',
      header: 'Tên',
      render: (row) => (
        <Link to={`/staff/patients/${row.id}`} className="font-medium text-primary hover:underline">
          <span className="flex items-center gap-2"><img src={row.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />{row.name}</span>
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
    <ClientPagedTable
      columns={columns}
      data={query.data ?? []}
      getRowId={(row) => row.id}
      loading={query.isLoading}
      error={query.isError}
      errorTitle="Không tải được danh sách thú cưng"
      onRetry={() => void query.refetch()}
      emptyMessage="Khách hàng chưa có thú cưng nào."
    />
  );
}

function AppointmentsTab({ customerId }: { customerId: string }) {
  const query = useQuery({
    queryKey: ['customer-appointments', customerId],
    queryFn: () => customersApi.appointments(customerId),
  });

  const columns: Column<CustomerAppointment>[] = [
    { key: 'startAt', header: 'Thời gian', render: (row) => formatDateTime(row.startAt) },
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
      key: 'priorityColor',
      header: 'Mức ưu tiên',
      render: (row) =>
        row.priorityColor ? (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${triageColorClasses(row.priorityColor)}`}
          >
            {PRIORITY_COLOR_LABEL_VI[row.priorityColor]}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => APPOINTMENT_STATUS_LABEL_VI[row.status],
    },
    {
      key: 'link',
      header: '',
      render: (row) => (
        <Link
          to={`/staff/appointments/${row.appointmentId}`}
          className="text-sm text-primary hover:underline"
        >
          Xem lịch hẹn
        </Link>
      ),
    },
  ];

  return (
    <ClientPagedTable
      columns={columns}
      data={query.data ?? []}
      getRowId={(row) => row.appointmentId}
      loading={query.isLoading}
      error={query.isError}
      errorTitle="Không tải được lịch hẹn của khách hàng"
      onRetry={() => void query.refetch()}
      emptyMessage="Khách hàng chưa có lịch hẹn nào."
    />
  );
}

function MedicalHistoryTab({ customerId }: { customerId: string }) {
  const query = useQuery({
    queryKey: ['customer-medical-history', customerId],
    queryFn: () => customersApi.medicalHistory(customerId),
  });

  const columns: Column<CustomerMedicalHistory>[] = [
    { key: 'examinedAt', header: 'Ngày khám', render: (row) => formatDateTime(row.examinedAt) },
    {
      key: 'petName',
      header: 'Thú cưng',
      render: (row) => (
        <Link to={`/staff/patients/${row.petId}`} className="text-primary hover:underline">
          {row.petName}
        </Link>
      ),
    },
    { key: 'doctorName', header: 'Bác sĩ', render: (row) => row.doctorName ?? '—' },
    { key: 'branchName', header: 'Chi nhánh', render: (row) => row.branchName ?? '—' },
    { key: 'visitReason', header: 'Lý do khám', render: (row) => row.visitReason ?? '—' },
    {
      key: 'diagnoses',
      header: 'Chẩn đoán',
      
      render: (row) =>
        row.diagnoses.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.diagnoses.map((diagnosis) => (
              <Badge key={diagnosis.id} variant={diagnosis.isPrimary ? 'default' : 'outline'}>
                {diagnosis.diseaseName ?? diagnosis.diagnosisText}
              </Badge>
            ))}
          </div>
        ) : (
          '—'
        ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => (
        <Badge variant={row.status === MedicalRecordStatus.COMPLETED ? 'success' : 'warning'}>
          {MEDICAL_RECORD_STATUS_LABEL_VI[row.status]}
        </Badge>
      ),
    },
    {
      key: 'link',
      header: '',
      render: (row) => (
        <Link
          to={`/staff/appointments/${row.appointmentId}`}
          className="text-sm text-primary hover:underline"
        >
          Xem hồ sơ khám
        </Link>
      ),
    },
  ];

  return (
    <ClientPagedTable
      columns={columns}
      data={query.data ?? []}
      getRowId={(row) => row.medicalRecordId}
      loading={query.isLoading}
      error={query.isError}
      errorTitle="Không tải được lịch sử khám"
      onRetry={() => void query.refetch()}
      emptyMessage="Khách hàng chưa có lần khám nào được ghi hồ sơ."
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
      <ClientPagedTable
        columns={columns}
        data={query.data ?? []}
        getRowId={(row) => row.invoiceId}
        loading={query.isLoading}
        error={query.isError}
        errorTitle="Không tải được lịch sử giao dịch"
        onRetry={() => void query.refetch()}
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

function PurchasesTab({ customerId }: { customerId: string }) {
  const query = useQuery({
    queryKey: ['customer-purchases', customerId],
    queryFn: () => customersApi.purchases(customerId),
  });

  const columns: Column<CustomerPurchase>[] = [
    {
      key: 'invoiceCode',
      header: 'Mã hóa đơn',
      render: (row) => (
        <Link
          to={`/staff/billing/${row.invoiceId}`}
          className="font-mono text-xs text-primary hover:underline"
        >
          {row.invoiceCode}
        </Link>
      ),
    },
    { key: 'purchasedAt', header: 'Thời gian', render: (row) => formatDateTime(row.purchasedAt) },
    { key: 'branchName', header: 'Chi nhánh', render: (row) => row.branchName ?? '—' },
    {
      key: 'itemSummary',
      header: 'Mặt hàng',
      render: (row) => (
        <span className="block max-w-xs truncate" title={row.itemSummary}>
          {row.itemSummary || '—'}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Số tiền',
      render: (row) => <span className="tabular-nums">{formatCurrency(row.totalAmount)}</span>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <Badge variant={INVOICE_STATUS_VARIANT[row.status]}>
            {INVOICE_STATUS_LABEL_VI[row.status]}
          </Badge>
          {row.paymentMethod && (
            <span className="text-xs text-muted">{PAYMENT_METHOD_LABEL_VI[row.paymentMethod]}</span>
          )}
        </div>
      ),
    },
  ];

  const total = (query.data ?? []).reduce((sum, row) => sum + row.totalAmount, 0);

  return (
    <div className="flex flex-col gap-3">
      <ClientPagedTable
        columns={columns}
        data={query.data ?? []}
        getRowId={(row) => row.invoiceId}
        loading={query.isLoading}
        error={query.isError}
        errorTitle="Không tải được lịch sử mua hàng"
        onRetry={() => void query.refetch()}
        emptyMessage="Khách hàng chưa mua hàng lẻ tại quầy lần nào."
      />
      {(query.data?.length ?? 0) > 0 && (
        <p className="text-right text-sm text-muted">
          Tổng giá trị {query.data?.length} lần mua:{' '}
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
