import { apiClient } from './client';
import {
  Customer,
  CustomerAppointment,
  CustomerDetail,
  CustomerMedicalHistory,
  CustomerPurchase,
  CustomerTransaction,
  PaginatedResult,
  Pet,
} from '@/types/models';

export interface CustomerListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  active?: boolean;
  hasPets?: boolean;
  branchId?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface CreateCustomerPayload {
  phone: string;
  fullName: string;
  avatarUrl?: string;
  email?: string;
  password?: string;
  
  dateOfBirth?: string;
  address?: string;
  note?: string;
}

export type UpdateCustomerPayload = Partial<
  Pick<CreateCustomerPayload, 'fullName' | 'avatarUrl' | 'email' | 'dateOfBirth' | 'address' | 'note'>
> & { active?: boolean };

export const customersApi = {
  list: (params: CustomerListParams) =>
    apiClient.get<PaginatedResult<Customer>>('/customers', { params }).then((r) => r.data),
  getOne: (id: string) => apiClient.get<CustomerDetail>(`/customers/${id}`).then((r) => r.data),
  create: (payload: CreateCustomerPayload) =>
    apiClient.post<CustomerDetail>('/customers', payload).then((r) => r.data),
  update: (id: string, payload: UpdateCustomerPayload) =>
    apiClient.patch<CustomerDetail>(`/customers/${id}`, payload).then((r) => r.data),
  
  deactivate: (id: string) =>
    apiClient.post<CustomerDetail>(`/customers/${id}/deactivate`).then((r) => r.data),
  activate: (id: string) =>
    apiClient.post<CustomerDetail>(`/customers/${id}/activate`).then((r) => r.data),
  pets: (id: string) => apiClient.get<Pet[]>(`/customers/${id}/pets`).then((r) => r.data),
  appointments: (id: string) =>
    apiClient.get<CustomerAppointment[]>(`/customers/${id}/appointments`).then((r) => r.data),
  medicalHistory: (id: string) =>
    apiClient.get<CustomerMedicalHistory[]>(`/customers/${id}/medical-history`).then((r) => r.data),
  transactions: (id: string) =>
    apiClient.get<CustomerTransaction[]>(`/customers/${id}/transactions`).then((r) => r.data),
  
  purchases: (id: string) =>
    apiClient.get<CustomerPurchase[]>(`/customers/${id}/purchases`).then((r) => r.data),
};
