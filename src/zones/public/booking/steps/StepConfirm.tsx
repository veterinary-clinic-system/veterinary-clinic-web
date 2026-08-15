import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { COMMON_SYMPTOM_LABEL_VI } from '@/types/enums';
import { formatCurrency } from '@/utils/format';
import { SummaryRow } from '../SummaryRow';
import { BookingForm } from '../use-booking-form';

/** Bước 7 - soát lại toàn bộ thông tin trước khi gửi. */
export function StepConfirm({ form }: { form: BookingForm }) {
  const { branch, service, doctor, schedule, owner, pet, symptoms, result } = form;

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

      {/*
        `role="alert"` chứ không phải một dòng chữ đỏ: khách vừa bấm "Xác nhận đặt lịch"
        và cần biết ngay là nó hỏng, kể cả khi đang dùng trình đọc màn hình.
      */}
      {result.submitError && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {result.submitError}
        </p>
      )}
    </section>
  );
}
