import { Textarea } from '@/components/basic';
import { COMMON_SYMPTOM_LABEL_VI, CommonSymptom } from '@/types/enums';
import { BookingForm } from '../use-booking-form';

/** Bước 6 - triệu chứng, ảnh đính kèm. Toàn bộ bước này không bắt buộc. */
export function StepSymptoms({ symptoms }: { symptoms: BookingForm['symptoms'] }) {
  return (
    <section aria-labelledby="buoc-trieu-chung">
      <h2 id="buoc-trieu-chung" className="text-lg font-semibold text-foreground">
        Triệu chứng
      </h2>
      <p className="mt-1 text-sm text-muted">
        Thông tin này giúp bác sĩ chuẩn bị tốt hơn trước buổi khám (không bắt buộc).
      </p>

      <fieldset className="mt-4">
        <legend className="sr-only">Các triệu chứng thường gặp</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.values(CommonSymptom).map((symptom) => (
            <label
              key={symptom}
              className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-sm text-foreground"
            >
              <input
                type="checkbox"
                checked={symptoms.common.includes(symptom)}
                onChange={() => symptoms.toggle(symptom)}
              />
              {COMMON_SYMPTOM_LABEL_VI[symptom]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4">
        {/*
          FR-05-01 gọi trường này là `Reason`; xem ghi chú ánh xạ trong
          appointment.entity.ts về việc vì sao không có cột `reason` riêng.
        */}
        <Textarea
          label="Lý do khám / triệu chứng"
          value={symptoms.other}
          onChange={(e) => symptoms.setOther(e.target.value)}
          rows={3}
          className="w-full"
          placeholder="Mô tả thêm về tình trạng của thú cưng..."
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor="anh-trieu-chung"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Hình ảnh đính kèm (không bắt buộc)
        </label>
        <input
          id="anh-trieu-chung"
          type="file"
          multiple
          accept="image/*"
          onChange={symptoms.onFilesSelected}
          className="text-sm text-muted"
        />

        {symptoms.photos.length > 0 && (
          /* `aria-live` để người dùng bàn phím biết ảnh đã tải lên xong hay hỏng. */
          <ul aria-live="polite" className="mt-2 space-y-1 text-sm">
            {symptoms.photos.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-surface-muted px-3 py-1.5"
              >
                <span className="truncate text-foreground">{item.name}</span>
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <span
                    className={
                      item.status === 'done'
                        ? 'text-primary'
                        : item.status === 'error'
                          ? 'text-destructive'
                          : 'text-muted'
                    }
                  >
                    {item.status === 'uploading' && 'Đang tải lên...'}
                    {item.status === 'done' && '✓ Xong'}
                    {item.status === 'error' && '⚠ Lỗi tải lên'}
                  </span>
                  <button
                    type="button"
                    onClick={() => symptoms.removePhoto(item.id)}
                    aria-label={`Xóa ảnh ${item.name}`}
                    className="text-muted underline"
                  >
                    Xóa
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
