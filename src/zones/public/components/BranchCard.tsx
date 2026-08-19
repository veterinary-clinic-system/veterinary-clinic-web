import { useNavigate } from 'react-router-dom';
import { Button, Icon } from '@/components/basic';
import { Branch, OperatingHour } from '@/types/models';
import { WEEKDAY_LABELS_VI, formatTimeHHmm } from '@/utils/display';

/**
 * Gộp giờ mở cửa thành ít dòng nhất đọc được.
 *
 * Hai lần gộp, theo đúng thứ tự:
 *
 * 1. **Theo ngày.** Một ngày có thể có nhiều ca (nghỉ trưa), backend trả về mỗi ca một
 *    bản ghi - gộp lại thành "07:00 - 11:30, 13:00 - 17:30".
 * 2. **Theo dải ngày liên tiếp cùng giờ.** Năm dòng giống hệt nhau thành
 *    "Thứ Hai - Thứ Sáu".
 *
 * Bỏ bước 1 thì hai bản ghi của cùng một ngày sinh ra hai dòng có cùng nhãn - đúng lỗi
 * trùng khoá React đã gặp với dữ liệu thật.
 */
function groupOpeningHours(hours: OperatingHour[]): { days: string; time: string }[] {
  const byDay = new Map<number, string[]>();
  [...hours]
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.openTime.localeCompare(b.openTime))
    .forEach((hour) => {
      const range = `${formatTimeHHmm(hour.openTime)} - ${formatTimeHHmm(hour.closeTime)}`;
      byDay.set(hour.dayOfWeek, [...(byDay.get(hour.dayOfWeek) ?? []), range]);
    });

  const groups: { from: number; to: number; time: string }[] = [];
  [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .forEach(([day, ranges]) => {
      const time = ranges.join(', ');
      const last = groups[groups.length - 1];
      if (last && last.time === time && day === last.to + 1) {
        last.to = day;
      } else {
        groups.push({ from: day, to: day, time });
      }
    });

  return groups.map((group) => ({
    days:
      group.from === group.to
        ? WEEKDAY_LABELS_VI[group.from]
        : `${WEEKDAY_LABELS_VI[group.from]} - ${WEEKDAY_LABELS_VI[group.to]}`,
    time: group.time,
  }));
}

/**
 * Thẻ chi nhánh.
 *
 * Số điện thoại là `tel:` chứ không phải chữ trơn: người xem trang này trên điện thoại
 * và cần gọi phòng khám thì một cú chạm là xong, không phải chép tay từng số.
 */
export function BranchCard({ branch }: { branch: Branch }) {
  const navigate = useNavigate();
  const hours = groupOpeningHours(branch.openingHours ?? []);

  return (
    <article className="flex flex-col rounded-xl border border-border bg-surface p-5">
      <h3 className="text-base font-semibold text-foreground">{branch.branchName}</h3>
      {branch.description && <p className="mt-1.5 text-sm text-muted">{branch.description}</p>}

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex gap-2">
          <dt className="sr-only">Địa chỉ</dt>
          <Icon name="map-pin" className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
          <dd className="text-foreground">{branch.address}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="sr-only">Điện thoại</dt>
          <Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
          <dd>
            <a href={`tel:${branch.phone.replace(/\s/g, '')}`} className="text-primary hover:underline">
              {branch.phone}
            </a>
          </dd>
        </div>
        {hours.length > 0 && (
          <div className="flex gap-2">
            <dt className="sr-only">Giờ mở cửa</dt>
            <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            <dd className="space-y-0.5 text-foreground">
              {hours.map((group) => (
                <p key={group.days}>
                  {group.days}: <span className="tabular-nums">{group.time}</span>
                </p>
              ))}
            </dd>
          </div>
        )}
      </dl>

      <Button
        variant="secondary"
        size="sm"
        className="mt-5 self-start"
        onClick={() => navigate('/booking', { state: { branchId: branch.id } })}
      >
        Đặt lịch tại chi nhánh này
      </Button>
    </article>
  );
}
