import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { petsApi } from '@/api/pets.api';
import { Badge, ErrorState, SkeletonText } from '@/components/basic';
import { VACCINATION_DUE_STATUS_LABEL_VI } from '@/types/enums';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import {
  INVOICE_STATUS_LABEL_VI,
  INVOICE_STATUS_VARIANT,
  LAB_TEST_STATUS_LABEL_VI,
  PAYMENT_METHOD_LABEL_VI,
  vaccinationDueClasses,
} from '@/utils/labels';

export function HealthRecordTab({ petId }: { petId: string }) {
  const query = useQuery({
    queryKey: ['pets', petId, 'owner-health-record'],
    queryFn: () => petsApi.ownerHealthRecord(petId),
  });

  if (query.isLoading) return <SkeletonText lines={8} />;

  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Không tải được hồ sơ sức khỏe"
        description="Vui lòng thử lại. Dữ liệu chỉ được hiển thị cho chủ sở hữu thú cưng."
        onRetry={() => void query.refetch()}
      />
    );
  }

  const { vaccinations, prescriptions, labTests, invoices } = query.data;

  return (
    <div className="flex flex-col gap-6">
      <HealthSection title="Sổ tiêm chủng" empty={vaccinations.length === 0}>
        {vaccinations.map(({ vaccination, dueStatus }) => (
          <article key={vaccination.id} className="rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {vaccination.vaccine?.item.itemName ?? 'Vaccine'} · Mũi {vaccination.doseNumber}
                  {vaccination.vaccine ? `/${vaccination.vaccine.doseCount}` : ''}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Tiêm ngày {formatDate(vaccination.vaccinatedAt)}
                  {vaccination.doctor?.fullName ? ` · BS. ${vaccination.doctor.fullName}` : ''}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${vaccinationDueClasses(dueStatus)}`}
              >
                {vaccination.nextDueDate
                  ? `${VACCINATION_DUE_STATUS_LABEL_VI[dueStatus]} ${formatDate(vaccination.nextDueDate)}`
                  : VACCINATION_DUE_STATUS_LABEL_VI.NONE}
              </span>
            </div>
            {vaccination.vaccine?.diseasePrevented && (
              <p className="mt-2 text-sm">Phòng bệnh: {vaccination.vaccine.diseasePrevented}</p>
            )}
            {vaccination.notes && <p className="mt-1 text-sm text-muted">{vaccination.notes}</p>}
          </article>
        ))}
      </HealthSection>

      <HealthSection title="Đơn thuốc" empty={prescriptions.length === 0}>
        {prescriptions.map((prescription) => (
          <article
            key={prescription.prescriptionId}
            className="rounded-lg border border-border p-4"
          >
            <p className="font-medium">{formatDateTime(prescription.examinedAt)}</p>
            <p className="text-sm text-muted">BS. {prescription.doctorName ?? 'Chưa cập nhật'}</p>
            <ul className="mt-3 divide-y divide-border text-sm">
              {prescription.items.map((item) => (
                <li key={item.id} className="py-2 first:pt-0 last:pb-0">
                  <span className="font-medium">{item.medicationName}</span>
                  <span className="text-muted">
                    {' '}
                    · {item.dosage}
                    {item.unit ? ` (${item.unit})` : ''} · {item.durationDays} ngày
                  </span>
                  {item.instructions && <p className="mt-0.5 text-muted">{item.instructions}</p>}
                </li>
              ))}
            </ul>
            {prescription.notes && (
              <p className="mt-3 text-sm text-muted">Ghi chú: {prescription.notes}</p>
            )}
          </article>
        ))}
      </HealthSection>

      <HealthSection title="Kết quả xét nghiệm" empty={labTests.length === 0}>
        {labTests.map((test) => (
          <article key={test.labTestId} className="rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{test.testName}</p>
                <p className="text-sm text-muted">Chỉ định {formatDateTime(test.orderedAt)}</p>
              </div>
              <Badge>{LAB_TEST_STATUS_LABEL_VI[test.status]}</Badge>
            </div>
            {test.resultText ? (
              <p className="mt-3 whitespace-pre-wrap text-sm">{test.resultText}</p>
            ) : (
              <p className="mt-3 text-sm text-muted">Chưa có kết quả dạng văn bản.</p>
            )}
            {test.resultFileUrls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-3">
                {test.resultFileUrls.map((url, index) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Xem tệp kết quả {index + 1}
                  </a>
                ))}
              </div>
            )}
          </article>
        ))}
      </HealthSection>

      <HealthSection title="Hóa đơn khám bệnh" empty={invoices.length === 0}>
        {invoices.map((invoice) => (
          <article
            key={invoice.invoiceId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
          >
            <div>
              <p className="font-medium">{formatCurrency(invoice.totalAmount)}</p>
              <p className="text-sm text-muted">
                Ngày khám {formatDateTime(invoice.visitedAt)}
                {invoice.paymentMethod
                  ? ` · ${PAYMENT_METHOD_LABEL_VI[invoice.paymentMethod]}`
                  : ''}
              </p>
            </div>
            <Badge variant={INVOICE_STATUS_VARIANT[invoice.status]}>
              {INVOICE_STATUS_LABEL_VI[invoice.status]}
            </Badge>
          </article>
        ))}
      </HealthSection>
    </div>
  );
}

function HealthSection({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {empty ? (
        <p className="mt-3 text-sm text-muted">Chưa có dữ liệu.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">{children}</div>
      )}
    </section>
  );
}
