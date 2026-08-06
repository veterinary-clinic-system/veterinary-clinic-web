import { apiClient } from './client';
import { PaginatedResult } from '@/types/models';

/**
 * Một dòng nhật ký kiểm toán — FR-26.
 *
 * `changes` để kiểu mở: nội dung của nó là ảnh chụp trước/sau của một entity bất kỳ,
 * nên không có hình dạng chung nào mô tả đúng được cả mười loại hành động.
 */
export interface AuditLogRow {
  id: string;
  createdAt: string;
  actorUserId: string | null;
  actorName: string | null;
  actorPhone: string | null;
  action: string;
  entityName: string;
  entityId: string | null;
  changes: AuditChanges | null;
  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * Hai hình dạng mà interceptor sinh ra: có ảnh chụp hai đầu thì `before/after/diff`,
 * không có thì chỉ còn body của request đã lọc.
 */
export interface AuditChanges {
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  diff?: Record<string, { before: unknown; after: unknown }>;
  request?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  actorUserId?: string;
  action?: string;
  entityName?: string;
  entityId?: string;
  from?: string;
  to?: string;
}

export const auditApi = {
  list: (params: AuditLogParams) =>
    apiClient.get<PaginatedResult<AuditLogRow>>('/audit-logs', { params }).then((r) => r.data),
  /** Giá trị cho ô chọn — lấy từ backend để không phải chép danh sách sang đây. */
  filters: () =>
    apiClient
      .get<{ actions: string[]; entities: string[] }>('/audit-logs/filters')
      .then((r) => r.data),
};
