import { apiClient } from './client';
import { CartStatus, CartView, Invoice, PaginatedResult, PaymentMethod, PosProduct } from '@/types/models';

export interface CheckoutPayload {
  paymentMethod: PaymentMethod;
  /** Bỏ trống = trả đủ. Trả dư bị backend từ chối 409. */
  amountPaid?: number;
  referenceCode?: string;
  note?: string;
}

/** Kết quả thanh toán: giỏ đã `CHECKED_OUT` và hoá đơn vừa lập. */
export interface CheckoutResult {
  cart: CartView['cart'];
  invoice: Invoice;
}

/**
 * Bán hàng tại quầy — SRS FR-19, UC-04.
 *
 * Giỏ hàng nằm ở **server**, không ở `localStorage`: nhân viên đổi máy giữa chừng vẫn
 * thấy giỏ đang dở (xem comment đầu `Cart` phía backend).
 */
export const posApi = {
  /** Ô tìm sản phẩm — `search` khớp cả tên, mã hàng và SKU (máy quét mã vạch). */
  products: (params: { branchId: string; search?: string; limit?: number }) =>
    apiClient.get<PosProduct[]>('/pos/products', { params }).then((r) => r.data),

  createCart: (payload: { branchId: string; customerId?: string; note?: string }) =>
    apiClient.post<CartView>('/pos/carts', payload).then((r) => r.data),
  carts: (params: { branchId?: string; status?: CartStatus; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResult<CartView['cart']>>('/pos/carts', { params }).then((r) => r.data),
  getCart: (id: string) => apiClient.get<CartView>(`/pos/carts/${id}`).then((r) => r.data),

  addItem: (cartId: string, payload: { itemId: string; quantity: number }) =>
    apiClient.post<CartView>(`/pos/carts/${cartId}/items`, payload).then((r) => r.data),
  setQuantity: (cartId: string, itemId: string, quantity: number) =>
    apiClient.patch<CartView>(`/pos/carts/${cartId}/items/${itemId}`, { quantity }).then((r) => r.data),
  removeItem: (cartId: string, itemId: string) =>
    apiClient.delete<CartView>(`/pos/carts/${cartId}/items/${itemId}`).then((r) => r.data),

  setDiscount: (cartId: string, payload: { amount?: number; percent?: number; note?: string }) =>
    apiClient.patch<CartView>(`/pos/carts/${cartId}/discount`, payload).then((r) => r.data),
  abandon: (cartId: string) =>
    apiClient.post<CartView>(`/pos/carts/${cartId}/abandon`).then((r) => r.data),
  checkout: (cartId: string, payload: CheckoutPayload) =>
    apiClient.post<CheckoutResult>(`/pos/carts/${cartId}/checkout`, payload).then((r) => r.data),
};
