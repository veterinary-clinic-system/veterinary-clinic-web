import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { petsApi } from '@/api/pets.api';
import { PRIORITY_COLOR_LABEL_VI } from '@/types/enums';
import { formatDate, formatDateTime } from '@/utils/format';
import { APPOINTMENT_STATUS_LABEL_VI, GENDER_LABEL_VI, triageColorClasses } from '@/utils/labels';

/** Full staff view of one pet: profile details, owner contact, and exam/appointment timeline. */
export function StaffPetProfilePage() {
  const { id } = useParams<{ id: string }>();

  const petQuery = useQuery({
    queryKey: ['pet', id],
    queryFn: () => petsApi.getOne(id!),
    enabled: !!id,
  });

  const timelineQuery = useQuery({
    queryKey: ['pet-timeline', id],
    queryFn: () => petsApi.timeline(id!),
    enabled: !!id,
  });

  const pet = petQuery.data;

  if (petQuery.isLoading) {
    return <p className="text-muted">Đang tải hồ sơ…</p>;
  }

  if (!pet) {
    return <p className="text-destructive">Không tìm thấy hồ sơ thú cưng.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {pet.avatarUrl ? (
            <img src={pet.avatarUrl} alt={pet.name} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-xl">
              🐾
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold">{pet.name}</h1>
            <p className="text-muted">
              {pet.breed?.breedName ?? '—'}
              {pet.breed?.species ? ` · ${pet.breed.species.speciesName}` : ''}
            </p>
          </div>
        </div>
        <Link
          to="/staff/appointments"
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Đặt lịch khám
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded border border-border bg-surface p-4">
          <h2 className="mb-3 font-medium">Thông tin thú cưng</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted">Giới tính</dt>
            <dd>{GENDER_LABEL_VI[pet.gender]}</dd>
            <dt className="text-muted">Cân nặng</dt>
            <dd>{pet.weight != null ? `${pet.weight} kg` : '—'}</dd>
            <dt className="text-muted">Ngày sinh</dt>
            <dd>{pet.birthDate ? formatDate(pet.birthDate) : '—'}</dd>
            <dt className="text-muted">Ghi chú</dt>
            <dd>{pet.notes ?? '—'}</dd>
            <dt className="text-muted">Dị ứng</dt>
            <dd>{pet.allergies.length > 0 ? pet.allergies.join(', ') : 'Không có'}</dd>
            <dt className="text-muted">Bệnh mãn tính</dt>
            <dd>{pet.chronicConditions.length > 0 ? pet.chronicConditions.join(', ') : 'Không có'}</dd>
          </dl>
        </section>

        <section className="rounded border border-border bg-surface p-4">
          <h2 className="mb-3 font-medium">Chủ nuôi</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted">Họ tên</dt>
            <dd>{pet.owner?.fullName ?? '—'}</dd>
            <dt className="text-muted">Số điện thoại</dt>
            <dd>{pet.owner?.phone ?? '—'}</dd>
          </dl>
        </section>
      </div>

      <section className="rounded border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-medium">Lịch sử khám</h2>
        </div>
        {timelineQuery.isLoading ? (
          <p className="p-4 text-muted">Đang tải lịch sử…</p>
        ) : (timelineQuery.data?.length ?? 0) === 0 ? (
          <p className="p-4 text-muted">Chưa có lịch sử khám.</p>
        ) : (
          <ul className="divide-y divide-border">
            {timelineQuery.data!.map((entry) => (
              <li key={entry.id}>
                <Link to={`/staff/appointments/${entry.id}`} className="block px-4 py-3 hover:bg-surface-muted">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{formatDateTime(entry.startAt)}</p>
                    <div className="flex items-center gap-2">
                      {entry.priorityColor && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${triageColorClasses(entry.priorityColor)}`}
                        >
                          {PRIORITY_COLOR_LABEL_VI[entry.priorityColor as keyof typeof PRIORITY_COLOR_LABEL_VI]}
                        </span>
                      )}
                      <span className="text-xs text-muted">
                        {APPOINTMENT_STATUS_LABEL_VI[
                          entry.status as keyof typeof APPOINTMENT_STATUS_LABEL_VI
                        ] ?? entry.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted">BS. {entry.doctor?.fullName ?? '—'}</p>
                  {entry.examination && (
                    <p className="mt-1 text-sm">
                      Chẩn đoán: {entry.examination.diagnosisText ?? '—'}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
