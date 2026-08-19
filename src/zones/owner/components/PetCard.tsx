import { Link } from 'react-router-dom';
import { Avatar, Badge, Icon } from '@/components/basic';
import { Appointment, Pet } from '@/types/models';
import { formatDateTime } from '@/utils/format';
import { petAgeLabel, petAlerts, petBreedLabel } from './pet-display';

export interface PetCardProps {
  pet: Pet;
  /** Lịch hẹn sắp tới gần nhất của bé này, nếu có. */
  nextAppointment?: Appointment;
}

/**
 * Thẻ thú cưng - màn hình quan trọng nhất của chủ nuôi được xây từ những thẻ này.
 *
 * Thông tin xếp theo thứ tự người nuôi hỏi khi nhìn vào tên một bé: **bé nào** (ảnh,
 * tên, giống, tuổi), **có gì cần lưu ý** (dị ứng, bệnh mãn tính), **sắp tới có hẹn
 * không**. Cân nặng và giới tính để trong hồ sơ - chúng không đổi cách hành xử của
 * người đọc ở màn hình danh sách.
 *
 * Cả thẻ là một liên kết tới hồ sơ, và nút "Đặt lịch" nằm ngoài liên kết đó: lồng một
 * nút trong một liên kết là HTML không hợp lệ và làm bàn phím đi qua hai lần.
 */
export function PetCard({ pet, nextAppointment }: PetCardProps) {
  const age = petAgeLabel(pet.birthDate);
  const alerts = petAlerts(pet);

  return (
    <article className="flex flex-col rounded-xl border border-border bg-surface p-5">
      <Link
        to={`/my/pets/${pet.id}`}
        className="flex items-start gap-3.5 rounded-lg focus-visible:outline-none"
      >
        <Avatar name={pet.name} src={pet.avatarUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-foreground">{pet.name}</h3>
          <p className="truncate text-sm text-muted">{petBreedLabel(pet)}</p>
          <p className="mt-0.5 text-sm text-muted">
            {age ?? 'Chưa rõ tuổi'}
            {pet.weight != null && ` · ${pet.weight} kg`}
          </p>
        </div>
      </Link>

      {alerts.length > 0 && (
        <ul className="mt-3.5 flex flex-wrap gap-1.5">
          {alerts.map((alert) => (
            <li key={alert.label}>
              <Badge variant={alert.tone === 'danger' ? 'destructive' : 'warning'}>
                <Icon name="alert" className="h-3.5 w-3.5" />
                {alert.label}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex-1 rounded-lg bg-surface-muted px-3.5 py-2.5 text-sm">
        {nextAppointment ? (
          <>
            <p className="text-xs text-muted">Lịch hẹn sắp tới</p>
            <p className="mt-0.5 font-medium text-foreground">
              {formatDateTime(nextAppointment.startAt)}
            </p>
            {nextAppointment.service?.item.itemName && (
              <p className="text-muted">{nextAppointment.service.item.itemName}</p>
            )}
          </>
        ) : (
          <p className="text-muted">Chưa có lịch hẹn nào sắp tới</p>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          to={`/my/pets/${pet.id}`}
          className="flex min-h-touch flex-1 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
        >
          Xem hồ sơ
        </Link>
        {/*
          BookingPage đọc `location.state.petId` và chọn sẵn thú cưng này ở bước
          "Thông tin" (xem `BookingHandoffState`) - chủ nuôi bỏ qua được cả phần khai
          báo thông tin bé lẫn thông tin của chính mình.
        */}
        <Link
          to="/booking"
          state={{ petId: pet.id }}
          className="flex min-h-touch flex-1 items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Đặt lịch
        </Link>
      </div>
    </article>
  );
}
