import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { COMMON_SYMPTOM_LABEL_VI } from '@/types/enums';
import { formatCurrency } from '@/utils/format';
import { SummaryRow } from '../SummaryRow';
import { BookingForm } from '../use-booking-form';

export function StepConfirm({ form }: { form: BookingForm }) {
  const { branch, service, doctor, schedule, owner, pet, symptoms, payment, result } = form;

  return (
    <section aria-labelledby="buoc-xac-nhan">
      <h2 id="buoc-xac-nhan" className="text-lg font-semibold text-foreground">
        Xác nhận thông tin đặt lịch
      </h2>

      <dl className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm">
        <SummaryRow label="Chi nhánh" value={branch.selected?.branchName} />
        <SummaryRow
          label="Dịch vụ"
          value={
            service.selected
              ? `${service.selected.item.itemName} (${formatCurrency(service.selected.item.unitPrice)})`
              : undefined
          }
        />
        <SummaryRow
          label="Bác sĩ"
          value={doctor.id ? doctor.selected?.fullName : 'Để phòng khám sắp xếp'}
        />
        <SummaryRow
          label="Thời gian"
          value={
            schedule.selectedSlot
              ? format(parseISO(schedule.selectedSlot.startAt), 'HH:mm, EEEE dd/MM/yyyy', {
                  locale: vi,
                })
              : undefined
          }
        />
        <SummaryRow
          label="Người đặt"
          value={`${owner.fullName} - ${owner.phone}${owner.email ? ` - ${owner.email}` : ''}`}
        />
        <SummaryRow
          label="Thú cưng"
          value={
            pet.mode === 'existing'
              ? pet.selectedExisting?.name
              : pet.newPet.name
                ? `${pet.newPet.name} (thú cưng mới)`
                : undefined
          }
        />
        <SummaryRow
          label="Triệu chứng"
          value={
            symptoms.common.length > 0
              ? symptoms.common.map((s) => COMMON_SYMPTOM_LABEL_VI[s]).join(', ')
              : 'Không có'
          }
        />
        {symptoms.other && <SummaryRow label="Lý do khám" value={symptoms.other} />}
        <SummaryRow
          label="Ảnh đính kèm"
          value={`${symptoms.photos.filter((p) => p.status === 'done').length} ảnh`}
        />
      </dl>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-foreground">Hình thức thanh toán</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label
            className={`cursor-pointer rounded-xl border p-4 ${payment.option === 'AT_CLINIC' ? 'border-primary bg-primary/5' : 'border-border'}`}
          >
            <input
              type="radio"
              name="booking-payment"
              value="AT_CLINIC"
              checked={payment.option === 'AT_CLINIC'}
              onChange={() => payment.setOption('AT_CLINIC')}
              className="mr-2"
            />
            <span className="font-medium text-foreground">Thanh toán tại phòng khám</span>
            <span className="mt-1 block pl-6 text-xs text-muted">
              Thanh toán sau khi hoàn tất buổi khám.
            </span>
          </label>
          <label
            className={`cursor-pointer rounded-xl border p-4 ${payment.option === 'SEPAY_QR' ? 'border-primary bg-primary/5' : 'border-border'}`}
          >
            <input
              type="radio"
              name="booking-payment"
              value="SEPAY_QR"
              checked={payment.option === 'SEPAY_QR'}
              onChange={() => payment.setOption('SEPAY_QR')}
              className="mr-2"
            />
            <span className="font-medium text-foreground">Thanh toán ngay bằng QR</span>
            <span className="mt-1 block pl-6 text-xs text-muted">
              Thanh toán trước phí dịch vụ; chi phí phát sinh thanh toán sau.
            </span>
          </label>
        </div>
      </fieldset>

      {}
      {result.submitError && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {result.submitError}
        </p>
      )}
    </section>
  );
}
