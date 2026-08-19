import { Link } from 'react-router-dom';
import { Alert, Avatar, Badge, Button, Icon } from '@/components/basic';
import { Pet } from '@/types/models';
import { GENDER_LABEL_VI } from '@/utils/display';
import { petAgeLabel } from '@/zones/owner/components/pet-display';

/**
 * Phần đầu hồ sơ bệnh nhân, phía lâm sàng.
 *
 * Khác bản của chủ nuôi ở chỗ nó là một **thanh nhận dạng bệnh nhân**: mọi thứ bác sĩ
 * cần xác nhận trước khi chạm vào con vật đều nằm trên một dòng - tên, mã, loài/giống,
 * tuổi, giới tính, cân nặng, chủ nuôi và số điện thoại. Cân nặng đặc biệt quan trọng:
 * gần như mọi liều thuốc thú y đều tính theo kg, nên nó không được nằm sau một tab.
 *
 * Cảnh báo y tế nằm NGOÀI hệ thống tab và luôn hiển thị: bác sĩ phải thấy nó dù đang mở
 * tab nào. Đây là chỗ duy nhất trong ứng dụng mà một dòng chữ có thể ngăn một tai nạn.
 */
export function PatientHeader({ pet }: { pet: Pet }) {
  const age = petAgeLabel(pet.birthDate);

  const identity = [
    pet.breed?.species?.speciesName,
    pet.breed?.breedName,
    age,
    GENDER_LABEL_VI[pet.gender],
    pet.weight != null ? `${pet.weight} kg` : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={pet.name} src={pet.avatarUrl} size="lg" />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{pet.name}</h1>
              <span className="rounded bg-surface-muted px-2 py-0.5 font-mono text-sm text-muted">
                {pet.petCode}
              </span>
            </div>

            <p className="mt-0.5 text-data text-muted">{identity.join(' · ')}</p>

            {pet.owner && (
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-data">
                <Link
                  to={`/staff/customers/${pet.owner.id}`}
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  <Icon name="user" className="h-4 w-4" />
                  {pet.owner.fullName}
                </Link>
                <a
                  href={`tel:${pet.owner.phone.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-1.5 text-muted hover:text-foreground"
                >
                  <Icon name="phone" className="h-4 w-4" />
                  {pet.owner.phone}
                </a>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/staff/queue">
            <Button variant="secondary" size="sm">
              <Icon name="queue" className="h-4 w-4" />
              Tiếp nhận
            </Button>
          </Link>
          <Link to="/staff/appointments">
            <Button size="sm">
              <Icon name="calendar" className="h-4 w-4" />
              Đặt lịch khám
            </Button>
          </Link>
        </div>
      </div>

      {pet.allergies.length > 0 && (
        <Alert tone="danger" title="Dị ứng">
          <ul className="flex flex-wrap gap-1.5">
            {pet.allergies.map((item) => (
              <li key={item}>
                <Badge variant="destructive">{item}</Badge>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {pet.chronicConditions.length > 0 && (
        <Alert tone="warning" title="Bệnh mãn tính">
          <ul className="flex flex-wrap gap-1.5">
            {pet.chronicConditions.map((item) => (
              <li key={item}>
                <Badge variant="warning">{item}</Badge>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {pet.notes && (
        <Alert tone="info" title="Ghi chú của bác sĩ">
          {pet.notes}
        </Alert>
      )}
    </div>
  );
}
