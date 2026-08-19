import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { petsApi } from '@/api/pets.api';
import { Avatar, Badge, DataColumn, DataTable, PageHeader, SearchInput } from '@/components/basic';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Pet } from '@/types/models';
import { petAgeLabel } from '@/zones/owner/components/pet-display';

const LIMIT = 20;

/**
 * Tìm hồ sơ bệnh nhân - cửa vào chính của bác sĩ và lễ tân khi khách gọi điện hoặc
 * bước tới quầy.
 *
 * Ô tìm kiếm là thứ được focus đầu tiên: 100% lượt mở trang này bắt đầu bằng việc gõ
 * một từ khoá, nên bắt người dùng bấm chuột vào ô trước là một thao tác thừa lặp lại
 * hàng chục lần mỗi ngày.
 *
 * Trạng thái rỗng phân biệt hai trường hợp - **chưa gõ gì** và **gõ rồi mà không thấy**:
 * cùng một màn hình trắng cho cả hai làm người dùng tưởng hệ thống hỏng khi thực ra họ
 * chưa nhập gì.
 */
export function PatientsSearchPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const query = useQuery({
    queryKey: ['pets-search', debouncedSearch, page],
    queryFn: () => petsApi.search({ search: debouncedSearch || undefined, page, limit: LIMIT }),
    // Giữ kết quả cũ trong lúc gõ tiếp - danh sách không nháy trắng sau mỗi ký tự.
    placeholderData: (prev) => prev,
  });

  const columns: DataColumn<Pet>[] = [
    {
      key: 'name',
      header: 'Thú cưng',
      render: (pet) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={pet.name} src={pet.avatarUrl} size="xs" />
          <span className="min-w-0">
            <span className="block truncate font-medium text-foreground">{pet.name}</span>
            <span className="block font-mono text-xs text-muted">{pet.petCode}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'breed',
      header: 'Giống loài',
      render: (pet) => (
        <span>
          <span className="block">{pet.breed?.breedName ?? '—'}</span>
          <span className="block text-xs text-muted">
            {[pet.breed?.species?.speciesName, petAgeLabel(pet.birthDate)].filter(Boolean).join(' · ')}
          </span>
        </span>
      ),
    },
    {
      key: 'alerts',
      header: 'Lưu ý',
      hideBelow: 'md',
      render: (pet) =>
        pet.allergies.length > 0 || pet.chronicConditions.length > 0 ? (
          <span className="flex flex-wrap gap-1">
            {pet.allergies.length > 0 && <Badge variant="destructive">Dị ứng</Badge>}
            {pet.chronicConditions.length > 0 && <Badge variant="warning">Mãn tính</Badge>}
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: 'microchip',
      header: 'Microchip',
      hideBelow: 'lg',
      render: (pet) =>
        pet.microchipId ? (
          <span className="font-mono text-xs">{pet.microchipId}</span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: 'owner',
      header: 'Chủ nuôi',
      render: (pet) => (
        <span>
          <span className="block">{pet.owner?.fullName ?? '—'}</span>
          {pet.owner?.phone && (
            <a
              href={`tel:${pet.owner.phone.replace(/\s/g, '')}`}
              onClick={(event) => event.stopPropagation()}
              className="block text-xs text-primary hover:underline"
            >
              {pet.owner.phone}
            </a>
          )}
        </span>
      ),
    },
  ];

  const searching = debouncedSearch.trim().length > 0;

  return (
    <div className="flex flex-col gap-stack">
      <PageHeader
        title="Hồ sơ thú cưng"
        description="Tìm theo mã hồ sơ, số microchip, tên thú cưng hoặc số điện thoại chủ nuôi."
      />

      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        getRowId={(pet) => pet.id}
        loading={query.isLoading}
        error={query.isError}
        onRetry={() => void query.refetch()}
        page={query.data?.page}
        limit={query.data?.limit}
        total={query.data?.total}
        onPageChange={setPage}
        onRowClick={(pet) => navigate(`/staff/patients/${pet.id}`)}
        emptyTitle={searching ? 'Không tìm thấy hồ sơ nào' : 'Nhập từ khoá để tìm hồ sơ'}
        emptyDescription={
          searching
            ? 'Thử tìm bằng số điện thoại chủ nuôi - đây là cách tra cứu chắc chắn nhất khi khách gọi tới.'
            : 'Mã hồ sơ, số microchip, tên thú cưng hoặc số điện thoại chủ nuôi đều tìm được.'
        }
        toolbar={
          <SearchInput
            value={search}
            onValueChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            autoFocus
            label="Tìm hồ sơ thú cưng"
            placeholder="Mã hồ sơ, microchip, tên bé hoặc SĐT chủ nuôi..."
            className="w-full sm:w-96"
          />
        }
      />
    </div>
  );
}
