import { apiClient } from './client';
import { Category, PaginatedResult, Product } from '@/types/models';

export interface ProductListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  /** Đối chiếu với tên sản phẩm, SKU và mã nội bộ cùng lúc. */
  search?: string;
  categoryId?: string;
  active?: boolean;
}

export interface ProductPayload {
  itemName: string;
  describe?: string;
  unitPrice: number;
  categoryId?: string | null;
  sku: string;
  brand?: string;
  unit: string;
  costPrice?: number;
  minimumStock?: number;
  active?: boolean;
}

export const productsApi = {
  list: (params: ProductListParams = {}) =>
    apiClient
      .get<PaginatedResult<Product>>('/catalog/products', { params })
      .then((r) => r.data),
  getOne: (id: string) =>
    apiClient.get<Product>(`/catalog/products/${id}`).then((r) => r.data),
  create: (payload: ProductPayload) =>
    apiClient.post<Product>('/catalog/products', payload).then((r) => r.data),
  update: (id: string, payload: Partial<ProductPayload>) =>
    apiClient.patch<Product>(`/catalog/products/${id}`, payload).then((r) => r.data),
};

export interface CategoryPayload {
  categoryName: string;
  code: string;
  itemType: string;
  parentId?: string | null;
  active?: boolean;
}

export const categoriesApi = {
  /**
   * Trả về **dạng cây** (mỗi nút có `children`), không phải danh sách phẳng —
   * xem `CategoriesService.findTree` phía backend.
   */
  tree: (params: { itemType?: string; includeInactive?: boolean } = {}) =>
    apiClient.get<Category[]>('/catalog/categories', { params }).then((r) => r.data),
  create: (payload: CategoryPayload) =>
    apiClient.post<Category>('/catalog/categories', payload).then((r) => r.data),
  update: (id: string, payload: Partial<Omit<CategoryPayload, 'itemType'>>) =>
    apiClient.patch<Category>(`/catalog/categories/${id}`, payload).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/catalog/categories/${id}`).then(() => undefined),
};
