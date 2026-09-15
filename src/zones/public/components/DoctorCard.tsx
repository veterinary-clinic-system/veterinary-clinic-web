import { useNavigate } from 'react-router-dom';
import { DoctorPublic } from '@/api/doctors.api';
import { Avatar, Badge, Button, Icon } from '@/components/basic';
import { specializationLabel } from '@/utils/display';
import { DoctorProfileDetails } from './DoctorProfileDetails';

function experienceLabel(yearOfStart: number | null): string | null {
  if (!yearOfStart) return null;
  const years = new Date().getFullYear() - yearOfStart;
  if (years < 1) return 'Mới vào nghề';
  return `${years} năm kinh nghiệm`;
}

export function DoctorCard({ doctor }: { doctor: DoctorPublic }) {
  const navigate = useNavigate();
  const experience = experienceLabel(doctor.yearOfStart);

  return (
    <article className="doctor-editorial-card flex gap-4 rounded-xl border border-border bg-surface p-5">
      <Avatar name={doctor.fullName} src={doctor.avatarUrl} size="lg" />

      <div className="min-w-0 flex-1">
        {}
        <h3 className="text-base font-semibold text-foreground">{doctor.fullName}</h3>

        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
          <Icon name="building" className="h-4 w-4" />
          <span className="truncate">{doctor.branch?.branchName ?? 'Chi nhánh đang cập nhật'}</span>
        </p>
        {experience && (
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
            <Icon name="clock" className="h-4 w-4" />
            {experience}
          </p>
        )}

        {doctor.specialization.length > 0 && (
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {doctor.specialization.map((spec) => (
              <li key={spec}>
                <Badge>{specializationLabel(spec)}</Badge>
              </li>
            ))}
          </ul>
        )}

        <DoctorProfileDetails doctor={doctor} />
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() =>
            navigate('/booking', { state: { doctorId: doctor.id, branchId: doctor.branch?.id } })
          }
        >
          Đặt lịch với bác sĩ này
        </Button>
      </div>
    </article>
  );
}
