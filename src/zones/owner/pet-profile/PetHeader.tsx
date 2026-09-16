import { Link } from 'react-router-dom';
import { Alert, Avatar, Icon } from '@/components/basic';
import { Pet } from '@/types/models';
import { GENDER_LABEL_VI } from '@/utils/display';
import { petAgeLabel, petAlerts, petBreedLabel } from '../components/pet-display';

export function PetHeader({ pet }: { pet: Pet }) {
  const age = petAgeLabel(pet.birthDate);
  const alerts = petAlerts(pet);

  return (
    <div className="garden-pet-profile-header rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={pet.name} src={pet.avatarUrl} size="xl" />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{pet.name}</h1>
            <p className="mt-0.5 text-muted">{petBreedLabel(pet)}</p>
            <p className="mt-1 text-sm text-muted">
              {[age, GENDER_LABEL_VI[pet.gender], pet.weight != null ? `${pet.weight} kg` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <p className="mt-1 font-mono text-xs text-muted">{pet.petCode}</p>
          </div>
        </div>

        <Link
          to="/booking"
          state={{ petId: pet.id }}
          className="inline-flex min-h-touch items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Icon name="calendar" className="h-4 w-4" />
          Đặt lịch cho {pet.name}
        </Link>
      </div>

      {alerts.length > 0 && (
        <div className="mt-5 flex flex-col gap-2">
          {alerts.map((alert) => (
            <Alert key={alert.label} tone={alert.tone}>
              {alert.label}
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}
