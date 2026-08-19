import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { petsApi } from '@/api/pets.api';
import {
  Alert,
  Avatar,
  Badge,
  Card,
  CardBody,
  DescriptionList,
  Icon,
  Skeleton,
  TriageBadge,
} from '@/components/basic';
import { Appointment } from '@/types/models';
import { COMMON_SYMPTOM_LABEL_VI } from '@/types/enums';
import { GENDER_LABEL_VI } from '@/utils/display';
import { petAgeLabel } from '@/zones/owner/components/pet-display';

/**
 * Cột trái của màn hình khám: bệnh nhân là AI, và họ tới vì chuyện gì.
 *
 * Tách khỏi cột bệnh sử (cột phải) vì hai thứ này được đọc ở hai thời điểm khác nhau:
 * cột này đọc MỘT LẦN lúc bắt đầu ca khám để xác nhận đúng con vật và đúng lý do; cột
 * bệnh sử thì mở ra đóng vào suốt buổi khám.
 *
 * `sticky` để nó không trôi mất khi bác sĩ cuộn xuống phần kê đơn - đó lại chính là lúc
 * cân nặng và danh sách dị ứng cần được nhìn thấy nhất.
 */
export function PatientSummaryPanel({ appointment }: { appointment: Appointment }) {
  const petQuery = useQuery({
    queryKey: ['pet', appointment.petId],
    queryFn: () => petsApi.getOne(appointment.petId),
    enabled: Boolean(appointment.petId),
  });

  const pet = petQuery.data;

  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-20">
      <Card as="section">
        <CardBody className="p-card">
          {petQuery.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : pet ? (
            <>
              <div className="flex items-center gap-3">
                <Avatar name={pet.name} src={pet.avatarUrl} size="md" />
                <div className="min-w-0">
                  <Link
                    to={`/staff/patients/${pet.id}`}
                    className="block truncate font-semibold text-foreground hover:text-primary"
                  >
                    {pet.name}
                  </Link>
                  <p className="font-mono text-xs text-muted">{pet.petCode}</p>
                </div>
              </div>

              <DescriptionList
                className="mt-4"
                columns={2}
                items={[
                  { label: 'Loài / giống', value: pet.breed?.breedName, wide: true },
                  { label: 'Tuổi', value: petAgeLabel(pet.birthDate) },
                  { label: 'Giới tính', value: GENDER_LABEL_VI[pet.gender] },
                  {
                    label: 'Cân nặng',
                    value: pet.weight != null ? `${pet.weight} kg` : null,
                  },
                  { label: 'Chủ nuôi', value: pet.owner?.fullName },
                ]}
              />

              {pet.owner?.phone && (
                <a
                  href={`tel:${pet.owner.phone.replace(/\s/g, '')}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-data text-primary hover:underline"
                >
                  <Icon name="phone" className="h-4 w-4" />
                  {pet.owner.phone}
                </a>
              )}
            </>
          ) : (
            <p className="text-data text-muted">Không tải được hồ sơ thú cưng.</p>
          )}
        </CardBody>
      </Card>

      {/*
        Dị ứng đứng riêng thành một khối cảnh báo, không gộp vào bảng thông tin ở trên:
        đây là dòng có thể ngăn một phản ứng thuốc, và nó phải khác hẳn về hình thức với
        "màu lông: vàng".
      */}
      {pet && pet.allergies.length > 0 && (
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

      {pet && pet.chronicConditions.length > 0 && (
        <Alert tone="warning" title="Bệnh mãn tính">
          {pet.chronicConditions.join(', ')}
        </Alert>
      )}

      <Card as="section">
        <CardBody className="p-card">
          <h2 className="text-sm font-semibold text-foreground">Lý do tới khám</h2>

          {appointment.priorityColor && (
            <div className="mt-2">
              <TriageBadge color={appointment.priorityColor} />
            </div>
          )}

          {appointment.commonSymptoms.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {appointment.commonSymptoms.map((symptom) => (
                <li key={symptom}>
                  <Badge variant="outline">{COMMON_SYMPTOM_LABEL_VI[symptom]}</Badge>
                </li>
              ))}
            </ul>
          )}

          {appointment.otherSymptoms ? (
            <p className="mt-3 whitespace-pre-line text-data text-foreground">
              {appointment.otherSymptoms}
            </p>
          ) : (
            appointment.commonSymptoms.length === 0 && (
              <p className="mt-2 text-data text-muted">Chủ nuôi không mô tả triệu chứng.</p>
            )
          )}

          {appointment.photoUrls.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {appointment.photoUrls.map((url, index) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={url}
                      alt={`Ảnh triệu chứng ${index + 1} do chủ nuôi gửi`}
                      loading="lazy"
                      className="h-16 w-16 rounded-lg border border-border object-cover"
                    />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
