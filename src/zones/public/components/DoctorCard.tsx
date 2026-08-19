import { useNavigate } from 'react-router-dom';
import { DoctorPublic } from '@/api/doctors.api';
import { Avatar, Badge, Button, Icon } from '@/components/basic';
import { specializationLabel } from '@/utils/display';

/** Số năm hành nghề, tính từ năm bắt đầu. Chưa có dữ liệu thì không bịa ra. */
function experienceLabel(yearOfStart: number | null): string | null {
  if (!yearOfStart) return null;
  const years = new Date().getFullYear() - yearOfStart;
  if (years < 1) return 'Mới vào nghề';
  return `${years} năm kinh nghiệm`;
}

/**
 * Thẻ bác sĩ - dùng chung ở trang chủ và trang đội ngũ.
 *
 * Bố cục ngang (ảnh bên trái, thông tin bên phải) chứ không phải thẻ dọc căn giữa: thẻ
 * dọc buộc mọi dòng chữ phải ngắn bằng nhau và đẩy chuyên khoa xuống dưới ảnh, trong
 * khi chuyên khoa mới là thứ khách dùng để chọn bác sĩ.
 *
 * Nút đặt lịch mang theo CẢ `doctorId` lẫn `branchId`: bác sĩ nào cũng gắn với một chi
 * nhánh, nên chọn bác sĩ là đã ngầm chọn chi nhánh - bắt khách chọn lại là hỏi một câu
 * đã có câu trả lời.
 */
export function DoctorCard({ doctor }: { doctor: DoctorPublic }) {
  const navigate = useNavigate();
  const experience = experienceLabel(doctor.yearOfStart);

  return (
    <article className="flex gap-4 rounded-xl border border-border bg-surface p-5">
      <Avatar name={doctor.fullName} src={doctor.avatarUrl} size="lg" />

      <div className="min-w-0 flex-1">
        {/*
          Không tự thêm tiền tố "BS." - dữ liệu nhân sự đã chứa học hàm trong `fullName`
          ("BS. Lê Văn An"), nên thêm ở tầng hiển thị sẽ ra "BS. BS. Lê Văn An".
        */}
        <h3 className="text-base font-semibold text-foreground">{doctor.fullName}</h3>

        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
          <Icon name="building" className="h-4 w-4" />
          <span className="truncate">{doctor.branch.branchName}</span>
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

        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() =>
            navigate('/booking', { state: { doctorId: doctor.id, branchId: doctor.branch.id } })
          }
        >
          Đặt lịch với bác sĩ này
        </Button>
      </div>
    </article>
  );
}
