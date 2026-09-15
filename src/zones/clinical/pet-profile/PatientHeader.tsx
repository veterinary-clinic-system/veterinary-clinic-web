import { Link } from 'react-router-dom';
import { Alert, Avatar, Badge, Button, Icon } from '@/components/basic';
import { Pet } from '@/types/models';
import { GENDER_LABEL_VI } from '@/utils/display';
import { petAgeLabel } from '@/zones/owner/components/pet-display';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImageUpload } from '@/components/ImageUpload';
import { petsApi } from '@/api/pets.api';

export function PatientHeader({ pet }: { pet: Pet }) {
  const queryClient = useQueryClient();
  const updateAvatar = useMutation({
    mutationFn: (avatarUrl: string) => petsApi.update(pet.id, { avatarUrl }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pets', pet.id] });
      void queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });
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

      <ImageUpload
        label="Ảnh thú cưng"
        category="pet-avatars"
        value={pet.avatarUrl}
        onChange={(avatarUrl) => updateAvatar.mutate(avatarUrl)}
        required
      />

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
