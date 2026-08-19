import { useQuery } from '@tanstack/react-query';
import { ErrorState, SkeletonText } from '@/components/basic';
import { petsApi } from '@/api/pets.api';
import type { PetPrescription } from '@/types/models';
import { formatDateTime } from '@/utils/format';
import { EmptyState } from '../shared';

/** Khối 6 - Prescription. */
export function PrescriptionsTab({ petId }: { petId: string }) {
  const query = useQuery({
    queryKey: ['pet-prescriptions', petId],
    queryFn: () => petsApi.prescriptions(petId),
  });

  if (query.isLoading) {
    return <SkeletonText lines={4} />;
  }

  if (query.isError) {
    return <ErrorState title="Không tải được đơn thuốc" onRetry={() => void query.refetch()} />;
  }

  const prescriptions: PetPrescription[] = query.data ?? [];
  if (prescriptions.length === 0) {
    return <EmptyState title="Thú cưng chưa có đơn thuốc nào." />;
  }

  return (
    <div className="flex flex-col gap-4">
      {prescriptions.map((prescription) => (
        <section key={prescription.prescriptionId} className="rounded border border-border bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div>
              <p className="font-medium">{formatDateTime(prescription.examinedAt)}</p>
              <p className="text-sm text-muted">BS. {prescription.doctorName ?? '—'}</p>
            </div>
            <span className="text-sm text-muted">{prescription.items.length} loại thuốc</span>
          </div>
          <ul className="divide-y divide-border">
            {prescription.items.map((item) => (
              <li key={item.id} className="px-4 py-3 text-sm">
                <p className="font-medium">{item.medicationName}</p>
                <p className="text-muted">
                  {item.dosage}
                  {item.unit ? ` (${item.unit})` : ''} · {item.durationDays} ngày
                </p>
                {item.instructions && <p className="mt-1 text-muted">{item.instructions}</p>}
              </li>
            ))}
          </ul>
          {prescription.notes && (
            <p className="border-t border-border px-4 py-3 text-sm text-muted">
              Ghi chú: {prescription.notes}
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
