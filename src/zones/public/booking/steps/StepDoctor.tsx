import { EmptyState, Skeleton } from '@/components/basic';
import { getInitial, specializationLabel } from '@/utils/display';
import { ANY_DOCTOR } from '../types';
import { BookingForm } from '../use-booking-form';
import { DoctorProfileDetails } from '../../components/DoctorProfileDetails';

export function StepDoctor({
  doctor,
  branchName,
}: {
  doctor: BookingForm['doctor'];
  branchName?: string;
}) {
  return (
    <section aria-labelledby="buoc-bac-si">
      <h2 id="buoc-bac-si" className="text-lg font-semibold text-foreground">
        Chọn bác sĩ
      </h2>
      <p className="mt-1 text-sm text-muted">Bác sĩ đang công tác tại {branchName}.</p>

      {}
      <button
        type="button"
        aria-pressed={doctor.id === ANY_DOCTOR}
        onClick={() => doctor.select(ANY_DOCTOR)}
        className={
          'mt-4 flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ' +
          (doctor.id === ANY_DOCTOR
            ? 'border-primary bg-primary/5'
            : 'border-border bg-surface hover:border-primary/50')
        }
      >
        <span
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl"
        >
          ✨
        </span>
        <span>
          <span className="block font-semibold text-foreground">Để phòng khám sắp xếp</span>
          <span className="block text-sm text-muted">
            Hệ thống tự chọn một bác sĩ đang trống vào khung giờ bạn chọn.
          </span>
        </span>
      </button>

      {doctor.isLoading && (
        <div
          role="status"
          aria-busy="true"
          aria-label="Đang tải danh sách bác sĩ"
          className="mt-4 grid gap-4 sm:grid-cols-2"
        >
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex gap-3 rounded-xl border border-border p-4">
              <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {doctor.list?.map((item) => (
          <div
            key={item.id}
            className={`booking-doctor-choice${doctor.id === item.id ? 'is-selected' : ''}`}
          >
            <button
              type="button"
              key={item.id}
              aria-pressed={doctor.id === item.id}
              onClick={() => doctor.select(item.id)}
              className={
                'flex w-full gap-3 rounded-xl border p-4 text-left transition-colors ' +
                (doctor.id === item.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-surface hover:border-primary/50')
              }
            >
              {item.avatarUrl ? (
                <img
                  src={item.avatarUrl}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary"
                >
                  {getInitial(item.fullName)}
                </span>
              )}
              <span className="min-w-0">
                <span className="block font-semibold text-foreground">{item.fullName}</span>
                {item.yearOfStart && (
                  <span className="block text-xs text-muted">
                    Hành nghề từ năm {item.yearOfStart}
                  </span>
                )}
                {item.specialization.length > 0 && (
                  <span className="mt-1 block text-xs text-muted">
                    {item.specialization.map((s) => specializationLabel(s)).join(', ')}
                  </span>
                )}
                <span className="mt-2 block text-xs font-semibold text-primary">
                  {doctor.id === item.id ? '✓ Đã chọn bác sĩ' : 'Chọn bác sĩ này →'}
                </span>
              </span>
            </button>
            <DoctorProfileDetails doctor={item} />
          </div>
        ))}
      </div>

      {doctor.list && doctor.list.length === 0 && (
        <EmptyState
          className="mt-4"
          icon="👩‍⚕️"
          title="Chi nhánh này chưa có bác sĩ"
          description='Bạn vẫn đặt lịch được bằng lựa chọn "Để phòng khám sắp xếp" ở trên, hoặc quay lại chọn chi nhánh khác.'
        />
      )}
    </section>
  );
}
