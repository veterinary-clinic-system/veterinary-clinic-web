import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { examinationsApi } from '@/api/examinations.api';
import { filesApi } from '@/api/files.api';
import { Button, Input, Textarea, useToast } from '@/components/basic';
import { MedicalRecord } from '@/types/models';
import { extractApiMessage } from '../api-utils';
import { DownloadPdfButton } from '../DownloadPdfButton';
import { Section } from '../Section';

interface VitalsFormState {
  temperatureCelsius: string;
  weightKg: string;
  heartRateBpm: string;
  respiratoryRateBpm: string;
  notes: string;
}

function toOptionalNumber(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

export function VitalsSection({ record, readOnly }: { record: MedicalRecord; readOnly: boolean }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const examination = record.examination ?? null;

  const [form, setForm] = useState<VitalsFormState>({
    temperatureCelsius: examination?.temperatureCelsius?.toString() ?? '',
    weightKg: examination?.weightKg?.toString() ?? '',
    heartRateBpm: examination?.heartRateBpm?.toString() ?? '',
    respiratoryRateBpm: examination?.respiratoryRateBpm?.toString() ?? '',
    notes: examination?.notes ?? '',
  });
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>(examination?.attachmentUrls ?? []);
  const [uploading, setUploading] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        temperatureCelsius: toOptionalNumber(form.temperatureCelsius),
        weightKg: toOptionalNumber(form.weightKg),
        heartRateBpm: toOptionalNumber(form.heartRateBpm),
        respiratoryRateBpm: toOptionalNumber(form.respiratoryRateBpm),
        notes: form.notes || undefined,
        attachmentUrls,
      };
      return examination
        ? examinationsApi.update(examination.id, payload)
        : examinationsApi.create({ appointmentId: record.appointmentId, ...payload });
    },
    onSuccess: () => {
      toast.show('Đã lưu sinh hiệu', 'success');
      void queryClient.invalidateQueries({ queryKey: ['medical-record'] });
    },
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Lưu thất bại', 'error'),
  });

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const res = await filesApi.upload('exam-attachments', file);
        uploaded.push(res.url);
      }
      setAttachmentUrls((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
    }
  }

  function set<K extends keyof VitalsFormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    const temp = toOptionalNumber(form.temperatureCelsius);
    const weight = toOptionalNumber(form.weightKg);
    const hr = toOptionalNumber(form.heartRateBpm);
    const rr = toOptionalNumber(form.respiratoryRateBpm);

    if (temp !== undefined && (temp < 30 || temp > 45)) {
      toast.show('Nhiệt độ phải nằm trong khoảng 30°C – 45°C.', 'error');
      return;
    }
    if (weight !== undefined && (weight < 0.05 || weight > 200)) {
      toast.show('Cân nặng phải nằm trong khoảng 0.05 kg – 200 kg.', 'error');
      return;
    }
    if (hr !== undefined && (hr < 10 || hr > 400)) {
      toast.show('Nhịp tim phải nằm trong khoảng 10 – 400 nhịp/phút.', 'error');
      return;
    }
    if (rr !== undefined && (rr < 5 || rr > 200)) {
      toast.show('Nhịp thở phải nằm trong khoảng 5 – 200 lần/phút.', 'error');
      return;
    }
    saveMutation.mutate();
  }

  return (
    <Section
      title="Sinh hiệu & triệu chứng"
      action={
        examination && !readOnly ? <DownloadPdfButton examinationId={examination.id} /> : undefined
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Nhiệt độ (°C)"
          type="number"
          step="0.1"
          min={30}
          max={45}
          disabled={readOnly}
          value={form.temperatureCelsius}
          onChange={(e) => set('temperatureCelsius', e.target.value)}
        />
        <Input
          label="Cân nặng (kg)"
          type="number"
          step="0.01"
          min={0.05}
          max={200}
          disabled={readOnly}
          value={form.weightKg}
          onChange={(e) => set('weightKg', e.target.value)}
        />
        <Input
          label="Nhịp tim (lần/phút)"
          type="number"
          min={10}
          max={400}
          disabled={readOnly}
          value={form.heartRateBpm}
          onChange={(e) => set('heartRateBpm', e.target.value)}
        />
        <Input
          label="Nhịp thở (lần/phút)"
          type="number"
          min={5}
          max={200}
          disabled={readOnly}
          value={form.respiratoryRateBpm}
          onChange={(e) => set('respiratoryRateBpm', e.target.value)}
        />
      </div>

      <div className="mt-3">
        <Textarea
          label="Triệu chứng ghi nhận"
          rows={3}
          disabled={readOnly}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </div>

      {!readOnly && (
        <label className="mt-3 flex flex-col gap-1 text-sm">
          <span className="text-muted">Ảnh/tệp đính kèm</span>
          <input
            type="file"
            multiple
            onChange={(e) => void handleFilesSelected(e.target.files)}
            className="text-sm"
          />
          {uploading && <span className="text-muted">Đang tải lên…</span>}
        </label>
      )}
      {attachmentUrls.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {attachmentUrls.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer">
              <img src={url} alt="Tệp đính kèm" className="h-16 w-16 rounded object-cover" />
            </a>
          ))}
        </div>
      )}

      {!readOnly && (
        <Button
          type="button"
          className="mt-3 w-fit"
          loading={saveMutation.isPending}
          onClick={handleSave}
        >
          {examination ? 'Cập nhật sinh hiệu' : 'Lưu sinh hiệu'}
        </Button>
      )}
      {readOnly && examination && (
        <div className="mt-3">
          <DownloadPdfButton examinationId={examination.id} />
        </div>
      )}
    </Section>
  );
}
