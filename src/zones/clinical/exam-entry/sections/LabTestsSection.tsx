import { useState, type Dispatch, type SetStateAction } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { examinationsApi } from '@/api/examinations.api';
import { laboratoriesApi } from '@/api/laboratories.api';
import { Button, Input, Select, Textarea, useToast } from '@/components/basic';
import { LabTestOrder, MedicalRecord } from '@/types/models';
import { LAB_RESULT_FLAG_LABEL_VI, LabResultFlag } from '@/types/enums';
import { formatDateTime } from '@/utils/format';
import { LAB_TEST_STATUS_LABEL_VI, labResultFlagClasses } from '@/utils/labels';
import { extractApiMessage } from '../api-utils';
import { Section } from '../Section';

/**
 * Khối xét nghiệm. Chỉ định phải đi qua `POST /examinations/:id/lab-tests`, nên phải có
 * phiếu sinh hiệu trước - đó là lý do khối này nhắc bác sĩ lưu sinh hiệu khi chưa có.
 *
 * `readOnly` chỉ khoá việc CHỈ ĐỊNH THÊM, không khoá việc nhập kết quả - xem ghi chú ở
 * `LabTestRow` về ngoại lệ có chủ đích của BR-08 (P9-T7).
 */
export function LabTestsSection({ record, readOnly }: { record: MedicalRecord; readOnly: boolean }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const examination = record.examination ?? null;
  const labTests = record.labTestOrders ?? [];
  const [testName, setTestName] = useState('');

  const addMutation = useMutation({
    mutationFn: () => examinationsApi.addLabTest(examination!.id, testName),
    onSuccess: () => {
      setTestName('');
      toast.show('Đã chỉ định xét nghiệm - yêu cầu đã vào hàng chờ xét nghiệm', 'success');
      void queryClient.invalidateQueries({ queryKey: ['medical-record'] });
    },
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Thêm thất bại', 'error'),
  });

  return (
    <Section title="Xét nghiệm">
      {labTests.length === 0 ? (
        <p className="text-sm text-muted">Chưa chỉ định xét nghiệm nào.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {labTests.map((test) => (
            <LabTestRow key={test.id} test={test} />
          ))}
        </div>
      )}

      {readOnly && labTests.length > 0 && (
        <p className="mt-3 text-xs text-muted">
          Hồ sơ đã hoàn tất nhưng kết quả xét nghiệm vẫn nhập được — kết quả về muộn là
          chuyện bình thường, và ghi một con số đo được không sửa kết luận chuyên môn nào
          (ngoại lệ có chủ đích của BR-08).
        </p>
      )}

      {!readOnly &&
        (examination ? (
          <form
            className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (testName.trim()) addMutation.mutate();
            }}
          >
            <Input
              label="Tên xét nghiệm"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
            />
            <Button type="submit" loading={addMutation.isPending} disabled={!testName.trim()}>
              Chỉ định xét nghiệm
            </Button>
          </form>
        ) : (
          <p className="mt-4 border-t border-border pt-4 text-sm text-muted">
            Cần lưu sinh hiệu trước khi chỉ định xét nghiệm.
          </p>
        ))}
    </Section>
  );
}

/**
 * Một yêu cầu xét nghiệm kèm bảng chỉ số — P9-T5, P9-T7.
 *
 * `readOnly` (hồ sơ đã COMPLETED) **không** khoá phần nhập kết quả, khác mọi khối khác
 * trên màn hình này. Đây là ngoại lệ có chủ đích của BR-08: kết quả xét nghiệm về muộn
 * là chuyện bình thường, và bắt hồ sơ mở chờ kết quả thì hoặc hồ sơ bị treo hàng loạt,
 * hoặc kết quả về rồi không có chỗ ghi vào. Ghi một con số đo được không sửa kết luận
 * chuyên môn nào — chẩn đoán, điều trị, đơn thuốc vẫn khoá cứng. Xem `LaboratoriesService`
 * ở backend, nơi cùng quyết định này được ghi lại đầy đủ.
 */
function LabTestRow({ test }: { test: LabTestOrder }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState<LabResultLine[]>([]);
  const [resultText, setResultText] = useState(test.resultText ?? '');

  const results = test.results ?? [];

  const saveMutation = useMutation({
    mutationFn: () =>
      laboratoriesApi.saveResults(test.id, {
        resultText: resultText || undefined,
        results: rows
          .filter((row) => row.parameter.trim() && row.value.trim())
          .map((row) => ({
            parameter: row.parameter.trim(),
            value: Number(row.value),
            unit: row.unit || undefined,
            referenceMin: row.referenceMin === '' ? null : Number(row.referenceMin),
            referenceMax: row.referenceMax === '' ? null : Number(row.referenceMax),
            // Bỏ trống = để backend tự tính từ khoảng tham chiếu. Chỉ gửi `flag` khi kỹ
            // thuật viên chủ động chọn - gửi kèm mọi lần lưu sẽ biến mọi kết quả thành
            // "đã ghi đè" và cờ tự động không bao giờ chạy nữa.
            flag: row.flag === '' ? undefined : (row.flag as LabResultFlag),
          })),
      }),
    onSuccess: () => {
      toast.show('Đã lưu kết quả xét nghiệm', 'success');
      setEditing(false);
      void queryClient.invalidateQueries({ queryKey: ['medical-record'] });
    },
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Lưu kết quả thất bại', 'error'),
  });

  function startEditing() {
    setRows(
      results.length > 0
        ? results.map((result) => ({
            parameter: result.parameter,
            value: String(result.value),
            unit: result.unit ?? '',
            referenceMin: result.referenceMin === null ? '' : String(result.referenceMin),
            referenceMax: result.referenceMax === null ? '' : String(result.referenceMax),
            flag: result.flagOverridden ? result.flag : '',
          }))
        : [{ ...EMPTY_RESULT_LINE }],
    );
    setResultText(test.resultText ?? '');
    setEditing(true);
  }

  return (
    <div className="rounded border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{test.testName}</p>
          <p className="text-xs text-muted">
            {LAB_TEST_STATUS_LABEL_VI[test.status]}
            {test.resultDate ? ` · Có kết quả ${formatDateTime(test.resultDate)}` : ''}
            {test.technician ? ` · KTV ${test.technician.fullName}` : ''}
          </p>
        </div>
        {!editing && (
          <Button type="button" variant="secondary" size="sm" onClick={startEditing}>
            {results.length > 0 ? 'Sửa kết quả' : 'Nhập kết quả'}
          </Button>
        )}
      </div>

      {!editing && results.length > 0 && (
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-1 pr-3 font-medium">Chỉ số</th>
              <th className="py-1 pr-3 text-right font-medium">Giá trị</th>
              <th className="py-1 pr-3 font-medium">Đơn vị</th>
              <th className="py-1 pr-3 font-medium">Tham chiếu</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.id} className="border-b border-border/60">
                <td className="py-1 pr-3">{result.parameter}</td>
                <td className="py-1 pr-3 text-right tabular-nums">
                  <span className={`rounded px-1.5 py-0.5 ${labResultFlagClasses(result.flag)}`}>
                    {result.value}
                  </span>
                </td>
                <td className="py-1 pr-3 text-muted">{result.unit ?? '—'}</td>
                <td className="py-1 pr-3 text-xs text-muted">
                  {result.referenceMin ?? '—'} – {result.referenceMax ?? '—'}
                  {result.flagOverridden ? ' · KTV ghi đè' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!editing && test.resultText && <p className="mt-2 text-sm">{test.resultText}</p>}
      {!editing && results.length === 0 && !test.resultText && (
        <p className="mt-2 text-sm text-muted">Chưa có kết quả.</p>
      )}

      {editing && (
        <form
          className="mt-3 flex flex-col gap-2 border-t border-border pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
        >
          {rows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr_auto]"
            >
              <Input
                placeholder="Chỉ số (WBC)"
                value={row.parameter}
                onChange={(e) => updateRow(setRows, index, { parameter: e.target.value })}
              />
              <Input
                type="number"
                step="any"
                placeholder="Giá trị"
                value={row.value}
                onChange={(e) => updateRow(setRows, index, { value: e.target.value })}
              />
              <Input
                placeholder="Đơn vị"
                value={row.unit}
                onChange={(e) => updateRow(setRows, index, { unit: e.target.value })}
              />
              <Input
                type="number"
                step="any"
                placeholder="Cận dưới"
                value={row.referenceMin}
                onChange={(e) => updateRow(setRows, index, { referenceMin: e.target.value })}
              />
              <Input
                type="number"
                step="any"
                placeholder="Cận trên"
                value={row.referenceMax}
                onChange={(e) => updateRow(setRows, index, { referenceMax: e.target.value })}
              />
              <Select
                value={row.flag}
                onChange={(value) => updateRow(setRows, index, { flag: value })}
                options={[
                  { value: '', label: 'Cờ: tự tính' },
                  ...Object.values(LabResultFlag).map((flag) => ({
                    value: flag,
                    label: LAB_RESULT_FLAG_LABEL_VI[flag],
                  })),
                ]}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
              >
                Xoá
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-fit"
            onClick={() => setRows((prev) => [...prev, { ...EMPTY_RESULT_LINE }])}
          >
            + Thêm chỉ số
          </Button>

          <Textarea
            label="Kết quả dạng chữ / diễn giải (tuỳ chọn)"
            value={resultText}
            onChange={(e) => setResultText(e.target.value)}
            rows={2}
          />

          <div className="flex gap-2">
            <Button type="submit" loading={saveMutation.isPending}>
              Lưu kết quả
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              Huỷ
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

interface LabResultLine {
  parameter: string;
  value: string;
  unit: string;
  referenceMin: string;
  referenceMax: string;
  /** Chuỗi rỗng = để backend tự tính cờ từ khoảng tham chiếu. */
  flag: string;
}

const EMPTY_RESULT_LINE: LabResultLine = {
  parameter: '',
  value: '',
  unit: '',
  referenceMin: '',
  referenceMax: '',
  flag: '',
};

function updateRow(
  setRows: Dispatch<SetStateAction<LabResultLine[]>>,
  index: number,
  patch: Partial<LabResultLine>,
) {
  setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
}
