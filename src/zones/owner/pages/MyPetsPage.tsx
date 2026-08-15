import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { petsApi } from '@/api/pets.api';
import { Pagination, usePagination } from '@/components/basic';
import { getInitial } from '@/utils/display';

const PAGE_SIZE = 12;

export function MyPetsPage() {
  const {
    data: pets,
    isLoading,
    isError,
  } = useQuery({ queryKey: ['pets', 'mine'], queryFn: petsApi.mine });

  // `GET /pets/mine` trả toàn bộ thú cưng của chủ nuôi trong một lần - cắt trang ở
  // client là đủ và không cần thêm một cửa API có phân trang.
  const { page, setPage, pageItems, totalPages } = usePagination(pets ?? [], PAGE_SIZE);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">Thú cưng của tôi</h1>
        <Link to="/booking" className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Đặt lịch khám
        </Link>
      </div>

      {isLoading && <p className="mt-8 text-muted">Đang tải danh sách thú cưng...</p>}
      {isError && <p className="mt-8 text-destructive">Không thể tải danh sách thú cưng.</p>}

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pageItems.map((pet) => (
          <div key={pet.id} className="rounded border border-border bg-surface p-5">
            <Link to={`/my/pets/${pet.id}`} className="flex items-center gap-3">
              {pet.avatarUrl ? (
                <img src={pet.avatarUrl} alt={pet.name} className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                  {getInitial(pet.name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{pet.name}</p>
                <p className="truncate text-sm text-muted">
                  {pet.breed?.breedName ?? 'Chưa rõ giống'}
                  {pet.breed?.species ? ` · ${pet.breed.species.speciesName}` : ''}
                </p>
              </div>
            </Link>
            <div className="mt-4 flex gap-2">
              <Link
                to={`/my/pets/${pet.id}`}
                className="flex-1 rounded border border-border px-3 py-1.5 text-center text-sm font-medium text-foreground"
              >
                Xem hồ sơ
              </Link>
              {/*
                BookingPage đọc `location.state.petId` và chọn sẵn thú cưng này ở bước
                "Thông tin" (xem `BookingHandoffState`).
              */}
              <Link
                to="/booking"
                state={{ petId: pet.id }}
                className="flex-1 rounded bg-primary px-3 py-1.5 text-center text-sm font-medium text-primary-foreground"
              >
                Đặt lịch khám
              </Link>
            </div>
          </div>
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        total={pets?.length ?? 0}
      />

      {pets && pets.length === 0 && (
        <div className="mt-8 rounded border border-dashed border-border p-8 text-center text-muted">
          <p>Bạn chưa có thú cưng nào trong hồ sơ.</p>
          <p className="mt-1">Thú cưng sẽ được thêm khi bạn đặt lịch khám lần đầu.</p>
          <Link to="/booking" className="mt-4 inline-block rounded bg-primary px-4 py-2 text-primary-foreground">
            Đặt lịch khám ngay
          </Link>
        </div>
      )}
    </div>
  );
}
