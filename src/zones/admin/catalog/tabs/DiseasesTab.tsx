import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '@/api/catalog.api';
import { PAGE_SIZE, TabPagination } from '../shared';

interface DiseaseGroupLite {
  id: string;
  diseaseName: string;
  describe?: string | null;
}

export function DiseasesTab() {
  const [page, setPage] = useState(1);
  const listQuery = useQuery({
    queryKey: ['catalog-diseases', page],
    queryFn: () => catalogApi.diseases({ page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });
  const raw = listQuery.data as
    | { data?: DiseaseGroupLite[]; total?: number }
    | DiseaseGroupLite[]
    | undefined;
  const diseases: DiseaseGroupLite[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
  // Cửa này từng trả về mảng trần ở một số bản; khi đó không có `total` để chia trang.
  const total = Array.isArray(raw) ? raw.length : (raw?.total ?? diseases.length);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Danh sách nhóm bệnh dùng cho chẩn đoán và phân tích AI (chỉ xem — quản lý đầy đủ nằm ngoài phạm vi đợt này).
      </p>
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full min-w-[500px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-muted text-left">
              <th className="px-3 py-2">Tên nhóm bệnh</th>
              <th className="px-3 py-2">Mô tả</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isLoading && (
              <tr>
                <td colSpan={2} className="px-3 py-6 text-center text-muted">
                  Đang tải…
                </td>
              </tr>
            )}
            {!listQuery.isLoading && diseases.length === 0 && (
              <tr>
                <td colSpan={2} className="px-3 py-6 text-center text-muted">
                  Không có dữ liệu.
                </td>
              </tr>
            )}
            {diseases.map((d) => (
              <tr key={d.id} className="border-t border-border">
                <td className="px-3 py-2">{d.diseaseName}</td>
                <td className="px-3 py-2 text-muted">{d.describe ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TabPagination page={page} total={total} onPageChange={setPage} />
    </div>
  );
}
