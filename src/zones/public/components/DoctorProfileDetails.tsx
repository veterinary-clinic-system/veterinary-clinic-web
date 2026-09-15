import { DoctorPublic } from '@/api/doctors.api';
import { specializationLabel } from '@/utils/display';

export function DoctorProfileDetails({ doctor }: { doctor: DoctorPublic }) {
  const years = doctor.yearOfStart
    ? Math.max(0, new Date().getFullYear() - doctor.yearOfStart)
    : null;
  return (
    <details className="doctor-profile-details">
      <summary>
        Tìm hiểu về bác sĩ <span aria-hidden="true">+</span>
      </summary>
      <div className="doctor-profile-expanded">
        <span className="care-eyebrow">HỒ SƠ CHUYÊN MÔN</span>
        <h4>{doctor.fullName}</h4>
        <dl>
          <div>
            <dt>Kinh nghiệm</dt>
            <dd>
              {years !== null
                ? `${years < 1 ? 'Dưới 1' : years} năm · Hành nghề từ ${doctor.yearOfStart}`
                : 'Đang cập nhật'}
            </dd>
          </div>
          <div>
            <dt>Nơi công tác</dt>
            <dd>{doctor.branch?.branchName ?? 'Đang cập nhật'}</dd>
          </div>
          <div>
            <dt>Chuyên khoa</dt>
            <dd>
              {doctor.specialization.length
                ? doctor.specialization.map(specializationLabel).join(' · ')
                : 'Đang cập nhật'}
            </dd>
          </div>
        </dl>
        <div className="doctor-visit-note">
          <strong>Chuẩn bị cho buổi khám</strong>
          <p>
            Bạn có thể mô tả dấu hiệu của bé và gửi ảnh ở bước triệu chứng để bác sĩ có thêm thông
            tin.
          </p>
        </div>
      </div>
    </details>
  );
}
