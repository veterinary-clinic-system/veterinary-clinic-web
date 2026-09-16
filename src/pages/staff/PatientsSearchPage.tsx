import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { petsApi } from '@/api/pets.api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const LIMIT = 20;

/** Staff-facing patient (pet) search by name / owner phone / record id. */
export function PatientsSearchPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const query = useQuery({
    queryKey: ['pets-search', debouncedSearch, page],
    queryFn: () => petsApi.search({ search: debouncedSearch || undefined, page, limit: LIMIT }),
    placeholderData: (prev) => prev,
  });

  const data = query.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Hồ sơ thú cưng</h1>

      <input
        type="search"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Tìm theo tên thú cưng, số điện thoại chủ hoặc mã hồ sơ…"
        className="w-full max-w-lg rounded border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-muted text-left">
              <th className="px-3 py-2">Mã hồ sơ</th>
              <th className="px-3 py-2">Tên thú cưng</th>
              <th className="px-3 py-2">Giống loài</th>
              <th className="px-3 py-2">Chủ nuôi</th>
              <th className="px-3 py-2">SĐT chủ nuôi</th>
            </tr>
          </thead>
          <tbody>
            {query.isLoading && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted">
                  Đang tải…
                </td>
              </tr>
            )}
            {!query.isLoading && (data?.data.length ?? 0) === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted">
                  Không tìm thấy hồ sơ nào.
                </td>
              </tr>
            )}
            {data?.data.map((pet) => (
              <tr key={pet.id} className="border-t border-border hover:bg-surface-muted">
                <td className="px-3 py-2 font-mono text-xs text-muted">{pet.id.slice(0, 8)}</td>
                <td className="px-3 py-2">
                  <Link to={`/staff/patients/${pet.id}`} className="font-medium text-primary hover:underline">
                    {pet.name}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  {pet.breed?.breedName ?? '—'}
                  {pet.breed?.species ? ` (${pet.breed.species.speciesName})` : ''}
                </td>
                <td className="px-3 py-2">{pet.owner?.fullName ?? '—'}</td>
                <td className="px-3 py-2">{pet.owner?.phone ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            Trang {data.page} / {totalPages} — tổng {data.total} hồ sơ
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-border px-3 py-1 hover:bg-surface-muted disabled:opacity-50"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded border border-border px-3 py-1 hover:bg-surface-muted disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
