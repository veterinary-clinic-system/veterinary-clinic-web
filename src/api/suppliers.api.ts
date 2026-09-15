import { apiClient } from './client';
import { PaginatedResult, Supplier } from '@/types/models';

export interface SupplierListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  
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
