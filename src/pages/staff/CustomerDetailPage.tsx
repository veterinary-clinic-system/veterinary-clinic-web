import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '@/api/customers.api';
import { Badge, Table } from '@/components/basic';
import type { Column } from '@/components/basic';
import {
  CustomerAppointment,
  CustomerMedicalHistory,
  CustomerTransaction,
  Pet,
} from '@/types/models';
import { MedicalRecordStatus, PRIORITY_COLOR_LABEL_VI } from '@/types/enums';
import {
  APPOINTMENT_STATUS_LABEL_VI,
  MEDICAL_RECORD_STATUS_LABEL_VI,
  PAYMENT_METHOD_LABEL_VI,
  triageColorClasses,
} from '@/utils/labels';
import { GENDER_LABEL_VI } from '@/utils/display';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';

/**
 * Hồ sơ một khách hàng - sáu khối theo sơ đồ FR-03-04 của SRS:
 * Thông tin → Thú cưng → Lịch hẹn → Lịch sử khám → Hóa đơn → Lịch sử mua hàng.
 *
 * "Hóa đơn" ở đây chính là lịch sử giao dịch khám (mỗi hóa đơn = một lần khám đã lập
 * hóa đơn); "Lịch sử mua hàng" là bán lẻ tại quầy - POS chưa tồn tại nên tab đó nói
 * thẳng là chưa có, không dựng dữ liệu giả.
 */
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
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{customer.fullName}</h1>
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
        <Stat label="Đã thanh toán" value={formatCurrency(customer.totalPaid)} />
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
          Lịch sử mua hàng
        </TabButton>
      </div>

      {/* Khối 1 - Thông tin khách hàng (FR-03-01) */}
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
      {tab === 'purchases' && <PurchasesTab />}
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

/** Khối 3 - Lịch hẹn (FR-03-04). Mới nhất trước, kèm trạng thái + bác sĩ + chi nhánh. */
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
    <Table
      columns={columns}
      data={query.data ?? []}
      getRowId={(row) => row.appointmentId}
      loading={query.isLoading}
      emptyMessage="Khách hàng chưa có lịch hẹn nào."
    />
  );
}

/**
 * Khối 4 - Lịch sử khám. Liên kết sang phiếu khám qua trang lịch hẹn; sau Phase 4 chỗ
 * này trỏ thẳng vào `MedicalRecord`.
 */
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
      // Từ P4, một hồ sơ có nhiều chẩn đoán; backend đã xếp chẩn đoán chính lên đầu.
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
    <Table
      columns={columns}
      data={query.data ?? []}
      getRowId={(row) => row.medicalRecordId}
      loading={query.isLoading}
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

/**
 * Khối 6 - Lịch sử mua hàng (bán lẻ tại quầy). Chưa có module POS nên tab này nói
 * thẳng là chưa có dữ liệu thay vì hiển thị số liệu bịa.
 */
function PurchasesTab() {
  return (
    <div className="rounded border border-dashed border-border bg-surface p-8 text-center">
      <p className="font-medium">Chưa có dữ liệu mua hàng</p>
      <p className="mt-1 text-sm text-muted">
        Bán lẻ tại quầy (POS) sẽ có ở Phase 8. Hóa đơn khám bệnh nằm ở tab “Hóa đơn”.
      </p>
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
