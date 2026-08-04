import { apiClient } from './client';
import { Role } from '@/types/models';

/** Mã quyền — khớp `Permission` enum ở backend, giữ dạng string vì UI chỉ hiển thị. */
export type PermissionCode = string;

export interface PermissionCatalogEntry {
  group: string;
  permissions: PermissionCode[];
}

export interface RolePermissionMatrixRow {
  role: Role;
  permissions: PermissionCode[];
}

export const permissionsApi = {
  catalog: () =>
    apiClient.get<PermissionCatalogEntry[]>('/permissions/catalog').then((r) => r.data),
  matrix: () => apiClient.get<RolePermissionMatrixRow[]>('/permissions/matrix').then((r) => r.data),
  setRolePermissions: (role: Role, permissions: PermissionCode[]) =>
    apiClient
      .put<{ role: Role; permissions: PermissionCode[] }>(`/permissions/roles/${role}`, {
        permissions,
      })
      .then((r) => r.data),
  resetRole: (role: Role) =>
    apiClient
      .post<{ role: Role; permissions: PermissionCode[] }>(`/permissions/roles/${role}/reset`)
      .then((r) => r.data),
};
