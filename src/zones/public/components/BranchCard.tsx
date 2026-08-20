import { useNavigate } from 'react-router-dom';
import { Button, Icon } from '@/components/basic';
import { Branch } from '@/types/models';
import { groupOpeningHours } from '@/utils/opening-hours';

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
