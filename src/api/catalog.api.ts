import { apiClient } from './client';
import { Item, Medication, PaginatedResult, Service } from '@/types/models';

export const catalogApi = {
  items: (params: { page?: number; limit?: number; itemType?: string }) =>
    apiClient.get<PaginatedResult<Item>>('/catalog/items', { params }).then((r) => r.data),
  services: (params: { page?: number; limit?: number } = {}) =>
    apiClient.get<PaginatedResult<Service>>('/catalog/services', { params }).then((r) => r.data),
  createService: (payload: Record<string, unknown>) =>
    apiClient.post<Service>('/catalog/services', payload).then((r) => r.data),
  updateService: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch<Service>(`/catalog/services/${id}`, payload).then((r) => r.data),
  medications: (params: { page?: number; limit?: number } = {}) =>
    apiClient.get<PaginatedResult<Medication>>('/catalog/medications', { params }).then((r) => r.data),
  createMedication: (payload: Record<string, unknown>) =>
    apiClient.post<Medication>('/catalog/medications', payload).then((r) => r.data),
  updateMedication: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch<Medication>(`/catalog/medications/${id}`, payload).then((r) => r.data),
  diseases: (params: { page?: number; limit?: number; search?: string } = {}) =>
    apiClient.get('/catalog/diseases', { params }).then((r) => r.data),
  inventory: (params: { page?: number; limit?: number; branchId?: string }) =>
    apiClient.get('/catalog/inventory', { params }).then((r) => r.data),
  upsertInventory: (payload: { itemId: string; branchId: string; inventoryQuantity: number }) =>
    apiClient.post('/catalog/inventory', payload).then((r) => r.data),
};
