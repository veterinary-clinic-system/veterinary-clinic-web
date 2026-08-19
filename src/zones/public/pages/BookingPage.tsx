import { Button, PageHeader } from '@/components/basic';
import { BookingStepper } from '../booking/BookingStepper';
import { BookingSuccess } from '../booking/BookingSuccess';
import { StepBranch } from '../booking/steps/StepBranch';
import { StepConfirm } from '../booking/steps/StepConfirm';
import { StepDoctor } from '../booking/steps/StepDoctor';
import { StepOwnerPet } from '../booking/steps/StepOwnerPet';
import { StepSchedule } from '../booking/steps/StepSchedule';
import { StepService } from '../booking/steps/StepService';
import { StepSymptoms } from '../booking/steps/StepSymptoms';
import { Step } from '../booking/types';
import { useBookingForm } from '../booking/use-booking-form';

const LAST_STEP: Step = 7;

/**
 * Biểu mẫu đặt lịch bảy bước: chi nhánh -> dịch vụ -> bác sĩ -> ngày giờ -> thông tin
 * -> triệu chứng -> xác nhận.
 *
 * Trang này chỉ LẮP RÁP: toàn bộ trạng thái và truy vấn nằm ở `useBookingForm`, mỗi
 * bước là một component thuần trình bày trong `../booking/steps/`. Trước đây tất cả
 * nằm chung một file 1123 dòng, và mỗi lần sửa một bước là phải cuộn qua sáu bước kia.
 */
export function BookingPage() {
  const form = useBookingForm();
  const { step, setStep, canProceed, result } = form;

  if (result.booking) {
    return (
      <BookingSuccess
        appointment={result.booking}
        branchName={form.branch.selected?.branchName}
        serviceName={form.service.selected?.item.itemName}
        doctorName={form.doctor.selected?.fullName}
        isLoggedIn={!!form.user}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader title="Đặt lịch khám" />

      <div className="mt-6">
        {/*
          Quay lại bước đã hoàn thành không làm mất dữ liệu: `useBookingForm` giữ toàn
          bộ trạng thái ở một chỗ và chỉ xoá những lựa chọn phía sau khi chúng thật sự
          không còn hợp lệ (đổi chi nhánh thì bác sĩ và khung giờ mới bị xoá).
        */}
        <BookingStepper current={step} onGoToStep={setStep} />
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface p-6">
        {step === 1 && <StepBranch branch={form.branch} />}
        {step === 2 && <StepService service={form.service} />}
        {step === 3 && (
          <StepDoctor doctor={form.doctor} branchName={form.branch.selected?.branchName} />
        )}
        {step === 4 && <StepSchedule schedule={form.schedule} service={form.service} />}
        {step === 5 && <StepOwnerPet owner={form.owner} pet={form.pet} />}
        {step === 6 && <StepSymptoms symptoms={form.symptoms} />}
        {step === LAST_STEP && <StepConfirm form={form} />}
      </div>

      <div className="mt-8 flex justify-between">
        {step > 1 ? (
          <Button variant="secondary" onClick={() => setStep((step - 1) as Step)}>
            Quay lại
          </Button>
        ) : (
          <span />
        )}

        {step < LAST_STEP ? (
          <Button disabled={!canProceed} onClick={() => setStep((step + 1) as Step)}>
            Tiếp theo
          </Button>
        ) : (
          <Button loading={result.isSubmitting} onClick={result.submit}>
            {result.isSubmitting ? 'Đang đặt lịch...' : 'Xác nhận đặt lịch'}
          </Button>
        )}
      </div>
    </div>
  );
}
