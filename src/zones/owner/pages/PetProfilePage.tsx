import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { petsApi } from '@/api/pets.api';
import { AppointmentStatus, PRIORITY_COLOR_LABEL_VI, PriorityColor } from '@/types/enums';
import { APPOINTMENT_STATUS_LABEL_VI, triageColorClasses } from '@/utils/labels';
import { GENDER_LABEL_VI, getInitial } from '@/utils/display';

export function PetProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: pet,
    isLoading: petLoading,
    isError: petError,
  } = useQuery({
    queryKey: ['pets', id],
    queryFn: () => petsApi.getOne(id as string),
    enabled: !!id,
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['pets', id, 'timeline'],
    queryFn: () => petsApi.timeline(id as string),
    enabled: !!id,
  });

  // BookingPage đọc `location.state.petId` và chọn sẵn thú cưng này ở bước "Thông tin"
  // (xem `BookingHandoffState`).
  const goToBooking = () => {
    navigate('/booking', { state: { petId: id } });
  };

  if (petLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-muted">Đang tải hồ sơ thú cưng...</div>;
  }

  if (petError || !pet) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-destructive">Không thể tải hồ sơ thú cưng.</p>
        <Link to="/my/pets" className="mt-4 inline-block text-primary">
          ← Quay lại danh sách thú cưng
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/my/pets" className="text-sm text-primary">
        ← Quay lại danh sách thú cưng
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded border border-border bg-surface p-6">
        <div className="flex items-center gap-4">
          {pet.avatarUrl ? (
            <img src={pet.avatarUrl} alt={pet.name} className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
              {getInitial(pet.name)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{pet.name}</h1>
            <p className="text-muted">
              {pet.breed?.breedName ?? 'Chưa rõ giống'}
              {pet.breed?.species ? ` · ${pet.breed.species.speciesName}` : ''}
            </p>
          </div>
        </div>
        <button
          onClick={goToBooking}
          className="rounded bg-primary px-4 py-2 font-medium text-primary-foreground"
        >
          Đặt lịch khám cho {pet.name}
        </button>
      </div>

      <div className="mt-6 grid gap-4 rounded border border-border bg-surface p-6 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted">Giới tính</p>
          <p className="text-foreground">{GENDER_LABEL_VI[pet.gender]}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Cân nặng</p>
          <p className="text-foreground">{pet.weight != null ? `${pet.weight} kg` : 'Chưa cập nhật'}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Ngày sinh</p>
          <p className="text-foreground">
            {pet.birthDate ? format(parseISO(pet.birthDate), 'dd/MM/yyyy', { locale: vi }) : 'Chưa cập nhật'}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted">Dị ứng</p>
          <p className="text-foreground">{pet.allergies.length > 0 ? pet.allergies.join(', ') : 'Không có'}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-sm text-muted">Bệnh mãn tính</p>
          <p className="text-foreground">
            {pet.chronicConditions.length > 0 ? pet.chronicConditions.join(', ') : 'Không có'}
          </p>
        </div>
        {pet.notes && (
          <div className="sm:col-span-2">
            <p className="text-sm text-muted">Ghi chú</p>
            <p className="text-foreground">{pet.notes}</p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-foreground">Lịch sử khám</h2>

        {timelineLoading && <p className="mt-3 text-muted">Đang tải lịch sử khám...</p>}

        {!timelineLoading && timeline && timeline.length === 0 && (
          <p className="mt-3 text-muted">Chưa có lịch sử khám nào.</p>
        )}

        <div className="mt-3 space-y-3">
          {timeline?.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  to={`/my/appointments/${entry.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {format(parseISO(entry.startAt), 'HH:mm dd/MM/yyyy', { locale: vi })}
                </Link>
                <div className="flex items-center gap-2">
                  {entry.priorityColor && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${triageColorClasses(entry.priorityColor)}`}>
                      {PRIORITY_COLOR_LABEL_VI[entry.priorityColor as PriorityColor] ?? entry.priorityColor}
                    </span>
                  )}
                  <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-muted">
                    {APPOINTMENT_STATUS_LABEL_VI[entry.status as AppointmentStatus] ?? entry.status}
                  </span>
                </div>
              </div>
              {entry.doctor?.fullName && (
                <p className="mt-1 text-sm text-muted">Bác sĩ: {entry.doctor.fullName}</p>
              )}
              {entry.examination && (
                <div className="mt-2 border-t border-border pt-2 text-sm">
                  {entry.examination.diagnosisText && (
                    <p className="text-foreground">
                      <span className="text-muted">Chẩn đoán: </span>
                      {entry.examination.diagnosisText}
                    </p>
                  )}
                  {entry.examination.notes && (
                    <p className="mt-1 text-foreground">
                      <span className="text-muted">Ghi chú: </span>
                      {entry.examination.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
