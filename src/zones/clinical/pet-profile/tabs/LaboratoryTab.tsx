import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { laboratoriesApi } from '@/api/laboratories.api';
import { Badge, ErrorState, Select, Skeleton, SkeletonText } from '@/components/basic';
import { LabTrendChart } from '@/components/LabTrendChart';
import { LAB_RESULT_FLAG_LABEL_VI } from '@/types/enums';
import { formatDate, formatDateTime } from '@/utils/format';
import { LAB_TEST_STATUS_LABEL_VI, labResultFlagClasses } from '@/utils/labels';
import { EmptyState } from '../shared';

function formatRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return '—';
  if (min === null) return `≤ ${max}`;
  if (max === null) return `≥ ${min}`;
  return `${min} – ${max}`;
}

/**
 * Khối 7 - Laboratory (P9-T6).
 *
 * Ba tầng, theo đúng thứ tự bác sĩ cần: bảng **chỉ số × ngày** để so ngang, biểu đồ một
 * chỉ số để nhìn xu hướng, rồi danh sách yêu cầu kèm kết quả dạng chữ và tệp đính kèm.
 * Bảng đặt ngày MỚI NHẤT ở cột đầu — ngược với biểu đồ (trái sang phải theo thời gian),
 * vì đọc bảng là để xem "lần này ra sao so với lần trước", còn đọc biểu đồ là để xem
 * đường đi.
 */
export function LaboratoryTab({ petId }: { petId: string }) {
  const [parameter, setParameter] = useState<string>('');

  const ordersQuery = useQuery({
    queryKey: ['pet-laboratories', petId],
    queryFn: () => laboratoriesApi.byPet(petId),
  });

  const orders = ordersQuery.data ?? [];
  // Chỉ giữ các lần đo CÓ chỉ số định lượng: yêu cầu mới chỉ định (chưa có kết quả) mà
  // thành một cột rỗng trong bảng thì bảng loãng ra mà không thêm thông tin nào.
  const measuredOrders = orders.filter((order) => (order.results ?? []).length > 0);
  const parameters = [
    ...new Set(measuredOrders.flatMap((order) => (order.results ?? []).map((r) => r.parameter))),
  ].sort();

  const trendQuery = useQuery({
    queryKey: ['pet-lab-trends', petId, parameter],
    queryFn: () => laboratoriesApi.trends(petId, parameter),
    enabled: Boolean(parameter),
  });

  if (ordersQuery.isLoading) {
    return <SkeletonText lines={5} />;
  }

  if (ordersQuery.isError) {
    return (
      <ErrorState
        title="Không tải được kết quả xét nghiệm"
        onRetry={() => void ordersQuery.refetch()}
      />
    );
  }

  // Acceptance P9-T6: thú cưng chưa xét nghiệm lần nào thì hiện empty state, không phải
  // một biểu đồ rỗng.
  if (orders.length === 0) {
    return (
      <EmptyState
        title="Thú cưng chưa có chỉ định xét nghiệm nào"
        description="Bác sĩ chỉ định xét nghiệm ngay trong màn hình khám; kết quả sẽ hiện ở đây."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {measuredOrders.length > 0 && (
        <section className="rounded border border-border bg-surface p-4">
          <h2 className="mb-3 font-medium">Bảng chỉ số theo thời gian</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 font-medium">Chỉ số</th>
                  <th className="py-2 pr-4 font-medium">Khoảng tham chiếu</th>
                  {measuredOrders.map((order) => (
                    <th key={order.id} className="py-2 pr-4 text-right font-medium">
                      {formatDate(order.resultDate ?? order.createdAt)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parameters.map((name) => {
                  const latest = measuredOrders
                    .flatMap((order) => order.results ?? [])
                    .find((result) => result.parameter === name);
                  return (
                    <tr key={name} className="border-b border-border/60">
                      <td className="py-2 pr-4">
                        <button
                          type="button"
                          onClick={() => setParameter(name)}
                          className={`font-medium hover:underline ${
                            parameter === name ? 'text-primary' : ''
                          }`}
                        >
                          {name}
                        </button>
                      </td>
                      <td className="py-2 pr-4 text-xs text-muted">
                        {formatRange(latest?.referenceMin ?? null, latest?.referenceMax ?? null)}
                        {latest?.unit ? ` ${latest.unit}` : ''}
                      </td>
                      {measuredOrders.map((order) => {
                        const cell = (order.results ?? []).find((r) => r.parameter === name);
                        return (
                          <td key={order.id} className="py-2 pr-4 text-right tabular-nums">
                            {cell ? (
                              <span
                                className={`rounded px-1.5 py-0.5 ${labResultFlagClasses(cell.flag)}`}
                                title={
                                  cell.flagOverridden
                                    ? `${LAB_RESULT_FLAG_LABEL_VI[cell.flag]} (kỹ thuật viên ghi đè)`
                                    : LAB_RESULT_FLAG_LABEL_VI[cell.flag]
                                }
                              >
                                {cell.value}
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">Bấm vào tên chỉ số để xem biểu đồ xu hướng.</p>
        </section>
      )}

      {parameter && (
        <section className="rounded border border-border bg-surface p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-medium">Xu hướng {parameter}</h2>
            <Select
              value={parameter}
              onChange={setParameter}
              options={parameters.map((name) => ({ value: name, label: name }))}
            />
          </div>
          {trendQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : (
            <LabTrendChart
              points={trendQuery.data?.points ?? []}
              unit={trendQuery.data?.unit ?? null}
            />
          )}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Các lần xét nghiệm</h2>
        {orders.map((order) => (
          <article key={order.id} className="rounded border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{order.testName}</p>
                <p className="text-sm text-muted">
                  Chỉ định {formatDateTime(order.createdAt)}
                  {order.resultDate ? ` · Có kết quả ${formatDateTime(order.resultDate)}` : ''}
                  {order.technician ? ` · KTV ${order.technician.fullName}` : ''}
                </p>
              </div>
              <Badge>{LAB_TEST_STATUS_LABEL_VI[order.status]}</Badge>
            </div>

            {/* Kết quả dạng chữ đi SONG SONG với bảng chỉ số, không thay thế nó - kết
                quả định tính ("Parvo: dương tính") không quy về số được. */}
            {order.resultText && <p className="mt-2 text-sm">{order.resultText}</p>}

            {order.resultFileUrls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-3">
                {order.resultFileUrls.map((url, index) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Tệp {index + 1}
                  </a>
                ))}
              </div>
            )}

            {(order.results ?? []).length === 0 && !order.resultText && (
              <p className="mt-2 text-sm text-muted">Chưa có kết quả.</p>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
