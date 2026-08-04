import { apiClient } from './client';
import { PaginatedResult, Supplier } from '@/types/models';

export interface SupplierListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  /** Đối chiếu với tên, mã NCC và số điện thoại cùng lúc. */
  search?: string;
  active?: boolean;
}

export interface SupplierPayload {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  taxCode?: string;
  note?: string;
  active?: boolean;
}

/** `supplierCode` do backend sinh (NCC0001) — không gửi lên khi tạo. */
export const suppliersApi = {
  list: (params: SupplierListParams = {}) =>
    apiClient
      .get<PaginatedResult<Supplier>>('/catalog/suppliers', { params })
      .then((r) => r.data),
  getOne: (id: string) =>
    apiClient.get<Supplier>(`/catalog/suppliers/${id}`).then((r) => r.data),
  create: (payload: SupplierPayload) =>
    apiClient.post<Supplier>('/catalog/suppliers', payload).then((r) => r.data),
  update: (id: string, payload: Partial<SupplierPayload>) =>
    apiClient.patch<Supplier>(`/catalog/suppliers/${id}`, payload).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/catalog/suppliers/${id}`).then(() => undefined),
};
