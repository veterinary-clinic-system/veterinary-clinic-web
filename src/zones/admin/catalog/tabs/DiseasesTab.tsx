import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '@/api/catalog.api';
import { Table } from '@/components/basic';
import type { Column } from '@/components/basic';
import { PAGE_SIZE, TabPagination } from '../shared';

interface DiseaseGroupLite {
  id: string;
  diseaseName: string;
  describe?: string | null;
}

const COLUMNS: Column<DiseaseGroupLite>[] = [
  { key: 'diseaseName', header: 'Tên nhóm bệnh' },
  {
    key: 'describe',
    header: 'Mô tả',
    render: (disease) => <span className="text-muted">{disease.describe ?? '—'}</span>,
  },
];

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
        Danh sách nhóm bệnh dùng cho chẩn đoán và phân tích AI (chỉ xem — quản lý đầy đủ nằm ngoài
        phạm vi đợt này).
      </p>

      {/*
        `Table` thay cho bảng tự dựng: nó mang theo skeleton, dòng rỗng và trạng thái lỗi.
        Bản trước hiện chữ "Đang tải…" giữa bảng, và khi API hỏng thì hiện "Không có dữ
        liệu." - tức là nói với người dùng rằng phòng khám không có nhóm bệnh nào.
      */}
      <Table
        columns={COLUMNS}
        data={diseases}
        getRowId={(disease) => disease.id}
        loading={listQuery.isLoading}
        error={listQuery.isError}
        onRetry={() => void listQuery.refetch()}
        emptyMessage="Chưa có nhóm bệnh nào trong danh mục."
      />

      <TabPagination page={page} total={total} onPageChange={setPage} />
    </div>
  );
}
