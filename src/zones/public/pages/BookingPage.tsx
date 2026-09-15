import { Button } from '@/components/basic';
import { useEffect, useRef } from 'react';
import { BookingSummary } from '../booking/BookingSummary';
import { BookingStepper } from '../booking/BookingStepper';
import { BookingSuccess } from '../booking/BookingSuccess';
import { StepBranch } from '../booking/steps/StepBranch';
import { StepConfirm } from '../booking/steps/StepConfirm';
import { StepDoctor } from '../booking/steps/StepDoctor';
import { StepOwnerPet } from '../booking/steps/StepOwnerPet';
import { StepSchedule } from '../booking/steps/StepSchedule';
import { StepService } from '../booking/steps/StepService';
import { StepSymptoms } from '../booking/steps/StepSymptoms';
import { STEP_LABELS, Step } from '../booking/types';
import { useBookingForm } from '../booking/use-booking-form';

const LAST_STEP: Step = 7;

export function BookingPage() {
  const form = useBookingForm();
  const { step, setStep, canProceed, result } = form;
  const nextStepLabel = step < LAST_STEP ? STEP_LABELS[step as 1 | 2 | 3 | 4 | 5 | 6] : '';
  const stepHeading = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (step > 1) stepHeading.current?.focus({ preventScroll: true });
  }, [step]);

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
    <div className="booking-experience mx-auto max-w-6xl px-4 py-10">
      <header className="booking-intro">
        <span className="care-eyebrow">MỘT CUỘC HẸN CHO NGƯỜI BẠN NHỎ</span>
        <h1>
          Chọn một lịch hẹn.
          <br />
          <span>Gửi trọn sự an tâm.</span>
        </h1>
        <p>Bạn chọn thời gian phù hợp. Chúng tôi chuẩn bị cho bé một buổi khám chu đáo.</p>
      </header>

      <div className="mt-6">
        {}
        <BookingStepper current={step} onGoToStep={setStep} />
      </div>

      <div className="booking-workspace">
        <div className="booking-form-panel">
          <div
            ref={stepHeading}
            tabIndex={-1}
            className="booking-step-caption"
            aria-label={`Bước ${step}: ${STEP_LABELS[step - 1]}`}
          >
            <span>BƯỚC {String(step).padStart(2, '0')} / 07</span>
            <span>{STEP_LABELS[step - 1]}</span>
          </div>
          <div className="booking-step-progress" aria-hidden="true">
            <span style={{ width: `${(step / 7) * 100}%` }} />
          </div>
          <div key={step} className="booking-step-content">
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

          <div className="booking-actions flex justify-between">
            {step > 1 ? (
              <Button variant="secondary" onClick={() => setStep((step - 1) as Step)}>
                Quay lại
              </Button>
            ) : (
              <span />
            )}

            {step < LAST_STEP ? (
              <Button disabled={!canProceed} onClick={() => setStep((step + 1) as Step)}>
                Tiếp theo: {nextStepLabel} →
              </Button>
            ) : (
              <Button loading={result.isSubmitting} onClick={result.submit}>
                {result.isSubmitting ? 'Đang đặt lịch...' : 'Xác nhận đặt lịch'}
              </Button>
            )}
          </div>
        </div>
        <BookingSummary form={form} />
      </div>
    </div>
  );
}
