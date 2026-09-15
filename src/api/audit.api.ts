import { apiClient } from './client';
import { PaginatedResult } from '@/types/models';

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
  
  filters: () =>
    apiClient
      .get<{ actions: string[]; entities: string[] }>('/audit-logs/filters')
      .then((r) => r.data),
};
