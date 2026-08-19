import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi, AuditLogRow } from '@/api/audit.api';
import { employeesApi } from '@/api/employees.api';
import { Badge, Button, DatePicker, Modal, Select, Table } from '@/components/basic';
import type { Column } from '@/components/basic';
import { AUDIT_ACTION_LABEL_VI, AUDIT_ENTITY_LABEL_VI } from '@/types/enums';
import { formatDateTime } from '@/utils/format';

const LIMIT = 20;

/** Hành động làm đổi tiền hoặc quyền — tô đậm để lướt mắt là thấy. */
const SENSITIVE_ACTIONS = new Set(['DELETE', 'PAYMENT', 'STOCK_ADJUSTMENT', 'CANCEL']);

/**
 * Trang xem nhật ký kiểm toán — SRS FR-26, BR-17 (acceptance P10-T2).
 *
 * CHỈ ĐỌC, và không có nút xóa: bảng `audit_logs` là bất biến (xem `AuditLogService`).
 * Quyền `AUDIT_VIEW` trong ma trận mặc định chỉ thuộc về ADMIN, backend vẫn là hàng rào
 * thật — chặn ở router chỉ để không đưa người dùng tới một trang chắc chắn nhận 403.
 *
 * Ô chọn hành động và thực thể lấy từ `GET /audit-logs/filters` chứ không chép cứng ở
 * đây: bảng audit còn giữ giá trị của các phiên bản trước, và một danh sách chép tay sẽ
 * lặng lẽ lệch khỏi dữ liệu thật.
 */
export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actorUserId, setActorUserId] = useState('');
  const [action, setAction] = useState('');
  const [entityName, setEntityName] = useState('');
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [detail, setDetail] = useState<AuditLogRow | null>(null);

  const filtersQuery = useQuery({ queryKey: ['audit-filters'], queryFn: () => auditApi.filters() });

  // Người thực hiện lọc theo tài khoản nhân viên: hồ sơ nhân sự không có `userId` thì
  // không bao giờ xuất hiện trong nhật ký, nên không đưa vào ô chọn. `limit` là 100 vì
  // đó là trần `PaginationQueryDto` của backend — xin 200 sẽ nhận 400.
  const employeesQuery = useQuery({
    queryKey: ['audit-employees'],
    queryFn: () => employeesApi.list({ limit: 100 }),
  });

  const logsQuery = useQuery({
    queryKey: ['audit-logs', page, actorUserId, action, entityName, from, to],
    queryFn: () =>
      auditApi.list({
        page,
        limit: LIMIT,
        actorUserId: actorUserId || undefined,
        action: action || undefined,
        entityName: entityName || undefined,
        from: from ?? undefined,
        to: to ?? undefined,
      }),
  });

  /** Mọi thay đổi bộ lọc đều phải kéo về trang 1 — trang 5 của kết quả cũ là vô nghĩa. */
  function applyFilter(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  function applyDateFilter(setter: (value: string | null) => void) {
    return (value: string | null) => {
      setter(value);
      setPage(1);
    };
  }

  const columns: Column<AuditLogRow>[] = [
    {
      key: 'createdAt',
      header: 'Thời điểm',
      render: (row) => <span className="whitespace-nowrap">{formatDateTime(row.createdAt)}</span>,
    },
    {
      key: 'actor',
      header: 'Người thực hiện',
      render: (row) =>
        row.actorUserId ? (
          <div>
            <p className="font-medium">{row.actorName ?? 'Tài khoản đã xóa'}</p>
            <p className="text-xs text-muted">{row.actorPhone ?? row.actorUserId}</p>
          </div>
        ) : (
          <span className="text-muted">Hệ thống</span>
        ),
    },
    {
      key: 'action',
      header: 'Hành động',
      render: (row) => (
        <Badge variant={SENSITIVE_ACTIONS.has(row.action) ? 'warning' : 'outline'}>
          {AUDIT_ACTION_LABEL_VI[row.action] ?? row.action}
        </Badge>
      ),
    },
    {
      key: 'entityName',
      header: 'Đối tượng',
      render: (row) => (
        <div>
          <p>{AUDIT_ENTITY_LABEL_VI[row.entityName] ?? row.entityName}</p>
          {row.entityId && (
            <p className="font-mono text-xs text-muted">{row.entityId.slice(0, 8)}…</p>
          )}
        </div>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP',
      render: (row) => <span className="font-mono text-xs">{row.ipAddress ?? '—'}</span>,
    },
    {
      key: 'changes',
      header: '',
      render: (row) => (
        <Button variant="ghost" onClick={() => setDetail(row)}>
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nhật ký kiểm toán</h1>
        <p className="text-muted">
          Ghi lại mọi thao tác trọng yếu trên hệ thống. Bản ghi là bất biến — không sửa, không xóa
          được.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Select
          label="Người thực hiện"
          value={actorUserId}
          onChange={applyFilter(setActorUserId)}
          options={[
            { value: '', label: 'Tất cả' },
            ...(employeesQuery.data?.data ?? [])
              .filter((employee) => employee.userId)
              .map((employee) => ({
                value: employee.userId as string,
                label: `${employee.fullName} (${employee.phone})`,
              })),
          ]}
        />
        <Select
          label="Hành động"
          value={action}
          onChange={applyFilter(setAction)}
          options={[
            { value: '', label: 'Tất cả' },
            ...(filtersQuery.data?.actions ?? []).map((value) => ({
              value,
              label: AUDIT_ACTION_LABEL_VI[value] ?? value,
            })),
          ]}
        />
        <Select
          label="Đối tượng"
          value={entityName}
          onChange={applyFilter(setEntityName)}
          options={[
            { value: '', label: 'Tất cả' },
            ...(filtersQuery.data?.entities ?? []).map((value) => ({
              value,
              label: AUDIT_ENTITY_LABEL_VI[value] ?? value,
            })),
          ]}
        />
        <DatePicker label="Từ ngày" value={from} onChange={applyDateFilter(setFrom)} max={to ?? undefined} />
        <DatePicker label="Đến ngày" value={to} onChange={applyDateFilter(setTo)} min={from ?? undefined} />
      </div>

      <Table
        columns={columns}
        data={logsQuery.data?.data ?? []}
        getRowId={(row) => row.id}
        page={page}
        limit={LIMIT}
        total={logsQuery.data?.total ?? 0}
        onPageChange={setPage}
        loading={logsQuery.isLoading}
        error={logsQuery.isError}
        onRetry={() => void logsQuery.refetch()}
        emptyMessage="Không có bản ghi nào khớp bộ lọc."
      />

      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title="Chi tiết bản ghi"
        className="max-w-3xl"
      >
        {detail && <AuditDetail row={detail} />}
      </Modal>
    </div>
  );
}

/**
 * Nội dung một bản ghi.
 *
 * Ưu tiên hiện BẢNG KHÁC BIỆT khi có: người đọc nhật ký hỏi "cái gì đã đổi", và một
 * ảnh chụp bốn mươi trường JSON không trả lời được câu đó. Ảnh chụp đầy đủ vẫn để dưới,
 * gập lại.
 */
function AuditDetail({ row }: { row: AuditLogRow }) {
  const diff = row.changes?.diff;
  const diffEntries = diff ? Object.entries(diff) : [];

  return (
    <div className="flex flex-col gap-4 text-sm">
      <dl className="grid grid-cols-2 gap-3">
        <Field label="Thời điểm" value={formatDateTime(row.createdAt)} />
        <Field
          label="Người thực hiện"
          value={row.actorName ? `${row.actorName} (${row.actorPhone ?? '—'})` : 'Hệ thống'}
        />
        <Field label="Hành động" value={AUDIT_ACTION_LABEL_VI[row.action] ?? row.action} />
        <Field
          label="Đối tượng"
          value={AUDIT_ENTITY_LABEL_VI[row.entityName] ?? row.entityName}
        />
        <Field label="Mã đối tượng" value={row.entityId ?? '—'} mono />
        <Field label="Địa chỉ IP" value={row.ipAddress ?? '—'} mono />
      </dl>

      {diffEntries.length > 0 && (
        <section>
          <h3 className="mb-2 font-medium">Các trường đã thay đổi</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="bg-surface-muted text-left">
                  <th className="px-3 py-2">Trường</th>
                  <th className="px-3 py-2">Giá trị cũ</th>
                  <th className="px-3 py-2">Giá trị mới</th>
                </tr>
              </thead>
              <tbody>
                {diffEntries.map(([field, change]) => (
                  <tr key={field} className="border-t border-border align-top">
                    <td className="px-3 py-2 font-mono text-xs">{field}</td>
                    <td className="px-3 py-2 text-muted">{renderValue(change.before)}</td>
                    <td className="px-3 py-2 font-medium">{renderValue(change.after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {diffEntries.length === 0 && row.changes && (
        <p className="text-muted">
          Bản ghi này không có ảnh chụp trước/sau — xem dữ liệu thô bên dưới.
        </p>
      )}

      <details className="rounded border border-border">
        <summary className="cursor-pointer px-3 py-2 text-muted">Dữ liệu thô</summary>
        <pre className="max-h-80 overflow-auto px-3 pb-3 text-xs">
          {JSON.stringify(row.changes ?? {}, null, 2)}
        </pre>
      </details>

      {row.userAgent && (
        <p className="break-all text-xs text-muted">Trình duyệt: {row.userAgent}</p>
      )}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={mono ? 'font-mono text-xs' : ''}>{value}</dd>
    </div>
  );
}

/** Giá trị trong `changes` là JSON bất kỳ — chuỗi hóa gọn để một ô bảng vẫn đọc được. */
function renderValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
