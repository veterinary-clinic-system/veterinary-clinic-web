import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { doctorsApi } from '@/api/doctors.api';
import {
  EmptyState,
  ErrorState,
  Pagination,
  SearchInput,
  Select,
  SkeletonCards,
  usePagination,
} from '@/components/basic';
import { specializationLabel } from '@/utils/display';
import { DoctorCard } from '../components/DoctorCard';

const PAGE_SIZE = 8;

/**
 * Trang đội ngũ bác sĩ.
 *
 * Ba bộ lọc theo đúng ba cách người ta chọn bác sĩ: **tên** (đã được ai đó giới thiệu),
 * **chuyên khoa** (biết bé bị gì), **chi nhánh** (chọn theo chỗ gần nhà).
 *
 * Danh sách chuyên khoa dựng từ chính dữ liệu trả về, không phải từ một danh sách cứng:
 * phòng khám thêm chuyên khoa mới thì bộ lọc tự có, và không bao giờ hiện một lựa chọn
 * lọc ra danh sách rỗng.
 */
export function DoctorsPage() {
  const [search, setSearch] = useState('');
  const [branchId, setBranchId] = useState('');
  const [specialization, setSpecialization] = useState('');

  const { data: branches } = useQuery({ queryKey: ['branches'], queryFn: branchesApi.list });
  const {
    data: doctors,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['doctors', 'public', branchId],
    queryFn: () => doctorsApi.listPublic(branchId || undefined),
  });

  const specializationOptions = useMemo(() => {
    const values = new Set((doctors ?? []).flatMap((doctor) => doctor.specialization));
    return [
      { value: '', label: 'Mọi chuyên khoa' },
      ...[...values].sort().map((value) => ({ value, label: specializationLabel(value) })),
    ];
  }, [doctors]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return (doctors ?? []).filter((doctor) => {
      if (specialization && !doctor.specialization.includes(specialization)) return false;
      if (!keyword) return true;
      return doctor.fullName.toLowerCase().includes(keyword);
    });
  }, [doctors, search, specialization]);

  const { page, setPage, pageItems, totalPages } = usePagination(filtered, PAGE_SIZE, [
    search,
    branchId,
    specialization,
  ]);

  const filtering = Boolean(search.trim() || branchId || specialization);

  function clearFilters() {
    setSearch('');
    setBranchId('');
    setSpecialization('');
  }

  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Đội ngũ bác sĩ
          </h1>
          <p className="mt-2 max-w-2xl text-muted">
            Các bác sĩ thú y đang công tác tại hệ thống. Bạn có thể chọn đúng bác sĩ khi đặt lịch,
            hoặc để phòng khám sắp xếp người phù hợp với tình trạng của bé.
          </p>

          <div className="mt-6 flex flex-wrap items-end gap-3">
            <SearchInput
              value={search}
              onValueChange={setSearch}
              label="Tìm bác sĩ theo tên"
              placeholder="Tìm theo tên bác sĩ..."
              className="w-full sm:max-w-xs"
            />
            <Select
              label="Chuyên khoa"
              value={specialization}
              onChange={setSpecialization}
              options={specializationOptions}
              className="min-w-[12rem]"
            />
            <Select
              label="Chi nhánh"
              value={branchId}
              onChange={setBranchId}
              options={[
                { value: '', label: 'Mọi chi nhánh' },
                ...(branches ?? []).map((branch) => ({
                  value: branch.id,
                  label: branch.branchName,
                })),
              ]}
              className="min-w-[14rem]"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        {isError ? (
          <ErrorState
            title="Không tải được danh sách bác sĩ"
            description="Máy chủ chưa phản hồi. Bạn vẫn có thể đặt lịch và để phòng khám sắp xếp bác sĩ."
            onRetry={() => void refetch()}
          />
        ) : isLoading ? (
          <SkeletonCards count={4} label="Đang tải danh sách bác sĩ" className="lg:grid-cols-2" />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={filtering ? 'Không có bác sĩ nào khớp bộ lọc' : 'Chưa có thông tin bác sĩ'}
            description={
              filtering
                ? 'Thử bỏ bớt điều kiện lọc - ví dụ chọn "Mọi chi nhánh" để xem toàn hệ thống.'
                : 'Thông tin đội ngũ đang được cập nhật.'
            }
            action={
              filtering ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex min-h-touch items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-surface-muted"
                >
                  Xoá bộ lọc
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <p className="mb-5 text-sm text-muted">
              {filtered.length} bác sĩ{filtering ? ' khớp bộ lọc' : ''}
            </p>
            <div className="grid gap-5 lg:grid-cols-2">
              {pageItems.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              total={filtered.length}
            />
          </>
        )}
      </section>
    </>
  );
}
