import { Icon } from '@/components/basic';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { BookingForm } from './use-booking-form';

export function BookingSummary({ form }: { form: BookingForm }) {
  const rows = [
    ['Chi nhánh', form.branch.selected?.branchName],
    ['Dịch vụ', form.service.selected?.item.itemName],
    [
      'Bác sĩ',
      form.doctor.selected?.fullName ?? (form.doctor.id === '' ? 'Phòng khám sắp xếp' : undefined),
    ],
    [
      'Thời gian',
      form.schedule.selectedSlot ? formatDateTime(form.schedule.selectedSlot.startAt) : undefined,
    ],
    [
      'Thú cưng',
      form.pet.mode === 'existing' ? form.pet.selectedExisting?.name : form.pet.newPet.name,
    ],
  ];
  return (
    <aside className="booking-summary" aria-label="Tóm tắt lịch khám">
      <div className="booking-summary-photo">
        <img src="/images/pets-photoreal-v1.png" alt="" width="1254" height="1254" />
        <span>
          Một cuộc hẹn.
          <br />
          <strong>Thêm nhiều an tâm.</strong>
        </span>
      </div>
      <div className="booking-summary-body">
        <h2>
          <Icon name="calendar" className="h-5 w-5" /> Lịch khám của bé
        </h2>
        <dl>
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd className={value ? '' : 'booking-unselected'}>{value || 'Chưa chọn'}</dd>
            </div>
          ))}
        </dl>
        <div className="booking-estimate">
          <span>Giá dịch vụ tham khảo</span>
          <strong>
            {form.service.selected ? formatCurrency(form.service.selected.item.unitPrice) : '—'}
          </strong>
        </div>
        <p className="text-xs leading-relaxed text-muted">
          Chi phí phát sinh, nếu có, được trao đổi trước khi thực hiện.
        </p>
        <div className="booking-assurance">
          <Icon name="paw" className="h-5 w-5 shrink-0" />
          <span>Thông tin bạn cung cấp giúp bác sĩ chuẩn bị tốt hơn cho buổi khám.</span>
        </div>
      </div>
    </aside>
  );
}
