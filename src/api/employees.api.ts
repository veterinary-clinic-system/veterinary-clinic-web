import { apiClient } from './client';
import { Branch, EmployeeStatus, PaginatedResult, Role, StaffUser } from '@/types/models';

export interface Employee {
  id: string;
  employeeCode: string;
  userId: string | null;
  user?: StaffUser | null;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  position: string | null;
  branchId: string | null;
  branch?: Branch | null;
  hireDate: string | null;
  resignedDate: string | null;
  status: EmployeeStatus;
  note: string | null;
  createdAt: string;
}

export interface EmployeeListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  status?: EmployeeStatus;
  branchId?: string;
  position?: string;
}

export interface CreateEmployeePayload {
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  position?: string;
  branchId?: string;
  hireDate?: string;
  status?: EmployeeStatus;
  note?: string;
  /** Bỏ trống = hồ sơ nhân sự thuần, không tạo tài khoản đăng nhập. */
  account?: { role: Role; password: string };
}

export type UpdateEmployeePayload = Partial<Omit<CreateEmployeePayload, 'phone' | 'account'>>;

export const employeesApi = {
  list: (params: EmployeeListParams) =>
    apiClient.get<PaginatedResult<Employee>>('/employees', { params }).then((r) => r.data),
  getOne: (id: string) => apiClient.get<Employee>(`/employees/${id}`).then((r) => r.data),
  create: (payload: CreateEmployeePayload) =>
    apiClient.post<Employee>('/employees', payload).then((r) => r.data),
  update: (id: string, payload: UpdateEmployeePayload) =>
    apiClient.patch<Employee>(`/employees/${id}`, payload).then((r) => r.data),
};
