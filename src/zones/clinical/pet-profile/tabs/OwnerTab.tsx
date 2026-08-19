import { Link } from 'react-router-dom';
import { Pet } from '@/types/models';
import { EmptyState, Row } from '../shared';

/** Khối 2 - Owner. */
export function OwnerTab({ pet }: { pet: Pet }) {
  if (!pet.owner) {
    return <EmptyState title="Chưa có thông tin chủ nuôi" />;
  }

  return (
    <section className="rounded border border-border bg-surface p-4">
      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
        <Row label="Họ tên" value={pet.owner.fullName} />
        <Row label="Số điện thoại" value={pet.owner.phone} />
      </dl>
      <Link
        to={`/staff/customers/${pet.ownerId}`}
        className="mt-4 inline-block text-sm text-primary hover:underline"
      >
        Xem hồ sơ khách hàng →
      </Link>
    </section>
  );
}
