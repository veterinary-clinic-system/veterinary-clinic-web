import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { Alert, Button, Icon, Input, Modal, useToast } from '@/components/basic';
import { Branch } from '@/types/models';
import { WEEKDAY_LABELS_VI } from '@/utils/display';
import { getErrorMessage } from '@/utils/errors';
import { CLINIC_WEEKDAYS } from '@/utils/opening-hours';
import {
  WeekSchedule,
  addBlock,
  removeBlock,
  toOpeningHoursPayload,
  toWeekSchedule,
  updateBlock,
  validateWeekSchedule,
} from './week-schedule';

export interface OpeningHoursModalProps {
  open: boolean;
  onClose: () => void;
  branch: Branch | null;
}

/**
 * Giờ mở cửa của một chi nhánh - cả tuần, mỗi ngày nhiều ca.
 *
 * Ba thay đổi so với bản trước, tất cả đều bắt nguồn từ việc một ngày có NHIỀU ca:
 *
 * 1. Bản trước chỉ đọc ca đầu tiên của mỗi ngày rồi gửi lại đúng năm dòng đó. Vì máy chủ
 *    thay cả tuần, mở ra bấm Lưu là xoá sạch ca chiều - xem `week-schedule.ts`.
 * 2. Ô giờ là `type="time"` chứ không phải ô chữ gợi ý "HH:mm": có bộ chọn, có kiểm tra,
 *    và trên điện thoại hiện bàn phím số.
 * 3. Lưu hỏng thì nói ra. Bản trước không có nhánh lỗi nào - bấm Lưu, không có gì xảy
 *    ra, và không ai biết vì sao.
 *
 * Hộp thoại chứ không phải khối mở rộng trong danh sách: sửa lịch tuần là việc cần nhìn
 * cả năm ngày cùng lúc, còn khối mở rộng thì đẩy các chi nhánh khác xuống dưới màn hình.
 */
export function OpeningHoursModal({ open, onClose, branch }: OpeningHoursModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [schedule, setSchedule] = useState<WeekSchedule>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !branch) return;
    setSchedule(toWeekSchedule(branch.openingHours));
    setErrors({});
  }, [open, branch]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!branch) throw new Error('Chưa chọn chi nhánh');
      return branchesApi.setOpeningHours(branch.id, toOpeningHoursPayload(schedule));
    },
    onSuccess: () => {
      toast.show('Đã lưu giờ mở cửa.', 'success');
      void queryClient.invalidateQueries({ queryKey: ['branches-admin'] });
      void queryClient.invalidateQueries({ queryKey: ['branches'] });
      onClose();
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateWeekSchedule(schedule);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    mutation.mutate();
  }

  const totalBlocks = CLINIC_WEEKDAYS.reduce((sum, day) => sum + (schedule[day]?.length ?? 0), 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={branch ? `Giờ mở cửa · ${branch.branchName}` : 'Giờ mở cửa'}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" form="opening-hours-form" loading={mutation.isPending}>
            Lưu giờ mở cửa
          </Button>
        </>
      }
    >
      <form id="opening-hours-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          Khung giờ khách đặt lịch được sinh ra từ chính bảng này, giao với ca làm việc của bác sĩ.
          Chỉ Thứ Hai đến Thứ Sáu - phòng khám đóng cửa cuối tuần.
        </p>

        <div className="flex flex-col gap-3">
          {CLINIC_WEEKDAYS.map((day) => {
            const blocks = schedule[day] ?? [];

            return (
              <div key={day} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium text-foreground">{WEEKDAY_LABELS_VI[day]}</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSchedule((prev) => addBlock(prev, day))}
                  >
                    <Icon name="plus" className="h-4 w-4" />
                    Thêm ca
                  </Button>
                </div>

                {blocks.length === 0 ? (
                  <p className="mt-1 text-sm text-muted">
                    Đóng cửa cả ngày - khách không đặt được lịch vào thứ này.
                  </p>
                ) : (
                  <ul className="mt-2 flex flex-col gap-3">
                    {blocks.map((block, index) => {
                      const error = errors[block.id];
                      const errorId = error ? `${block.id}-error` : undefined;

                      return (
                        <li key={block.id} className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-end gap-3">
                            <Input
                              label={`Ca ${index + 1} · mở cửa`}
                              type="time"
                              required
                              className="w-32"
                              value={block.openTime}
                              aria-invalid={error ? true : undefined}
                              aria-describedby={errorId}
                              onChange={(event) =>
                                setSchedule((prev) =>
                                  updateBlock(prev, day, block.id, {
                                    openTime: event.target.value,
                                  }),
                                )
                              }
                            />
                            <Input
                              label={`Ca ${index + 1} · đóng cửa`}
                              type="time"
                              required
                              className="w-32"
                              value={block.closeTime}
                              aria-invalid={error ? true : undefined}
                              aria-describedby={errorId}
                              onChange={(event) =>
                                setSchedule((prev) =>
                                  updateBlock(prev, day, block.id, {
                                    closeTime: event.target.value,
                                  }),
                                )
                              }
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="mb-0.5"
                              onClick={() => setSchedule((prev) => removeBlock(prev, day, block.id))}
                            >
                              <Icon name="trash" className="h-4 w-4" />
                              <span className="sr-only">
                                Xoá ca {index + 1} {WEEKDAY_LABELS_VI[day]}
                              </span>
                            </Button>
                          </div>

                          {error && (
                            <p id={errorId} className="text-xs text-destructive">
                              {error}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/*
          Cả tuần trống là hợp lệ với máy chủ nhưng gần như luôn là nhầm lẫn: chi nhánh
          sẽ không nhận được một lịch hẹn nào. Cảnh báo, không chặn.
        */}
        {totalBlocks === 0 && (
          <Alert tone="warning" title="Chi nhánh này sẽ đóng cửa cả tuần">
            Không còn ca nào. Khách sẽ không đặt được lịch tới chi nhánh này cho tới khi có ca mới.
          </Alert>
        )}

        {Object.keys(errors).length > 0 && (
          <Alert tone="danger" title="Kiểm tra lại các ca được đánh dấu">
            Giờ mở phải sớm hơn giờ đóng, và hai ca trong cùng một ngày không được trùng giờ.
          </Alert>
        )}

        {mutation.isError && (
          <Alert tone="danger" title="Không lưu được giờ mở cửa">
            {getErrorMessage(mutation.error)}
          </Alert>
        )}
      </form>
    </Modal>
  );
}
