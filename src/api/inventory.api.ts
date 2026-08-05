import { apiClient } from './client';
import {
  GoodsReceipt,
  InventoryAlerts,
  InventoryBatch,
  InventoryItem,
  InventoryTransaction,
  InventoryTransactionType,
  PaginatedResult,
  PurchaseOrder,
  PurchaseOrderStatus,
  StockTake,
  StockTakeStatus,
} from '@/types/models';

// ------------------------------------------------------------------------ Tồn kho

export interface InventoryListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  branchId?: string;
  itemId?: string;
  /** Đối chiếu với tên và mã mặt hàng. */
  search?: string;
  /** Chỉ lấy các dòng đã chạm ngưỡng `minimumStock`. */
  lowStock?: boolean;
}

export interface ReceiveInventoryPayload {
  itemId: string;
  branchId: string;
  batchNo: string;
  expiryDate?: string;
  quantity: number;
  costPrice?: number;
  supplierId?: string;
  note?: string;
}

export interface IssueInventoryPayload {
  itemId: string;
  branchId: string;
  quantity: number;
  /** Chỉ nhận các lý do thủ công — xem `MANUAL_ISSUE_TYPES`. */
  type: InventoryTransactionType;
  note: string;
}

/**
 * Kho — SRS FR-18.
 *
 * Không có hàm nào ghi thẳng số tồn: mọi thay đổi đều đi qua `receive`/`issue`/`update`
 * và backend luôn sinh một dòng sổ cái tương ứng. Xem comment đầu `InventoryService`
 * phía backend.
 */
export const inventoryApi = {
  list: (params: InventoryListParams = {}) =>
    apiClient.get<PaginatedResult<InventoryItem>>('/catalog/inventory', { params }).then((r) => r.data),
  /** Các lô của một dòng tồn kho, sắp theo hạn dùng gần nhất trước. */
  batches: (inventoryItemId: string) =>
    apiClient
      .get<InventoryBatch[]>(`/catalog/inventory/${inventoryItemId}/batches`)
      .then((r) => r.data),
  alerts: (branchId?: string) =>
    apiClient
      .get<InventoryAlerts>('/catalog/inventory/alerts', { params: { branchId } })
      .then((r) => r.data),
  receive: (payload: ReceiveInventoryPayload) =>
    apiClient.post<InventoryBatch>('/catalog/inventory/receive', payload).then((r) => r.data),
  issue: (payload: IssueInventoryPayload) =>
    apiClient
      .post<{ batchId: string; batchNo: string; quantity: number }[]>(
        '/catalog/inventory/issue',
        payload,
      )
      .then((r) => r.data),
  /** Điều chỉnh tồn kèm lý do — backend quy về một dòng sổ cái loại `ADJUSTMENT`. */
  adjust: (id: string, payload: { delta?: number; inventoryQuantity?: number; note?: string }) =>
    apiClient.patch<InventoryItem>(`/catalog/inventory/${id}`, payload).then((r) => r.data),
};

// -------------------------------------------------------------------------- Sổ cái

export interface InventoryTransactionListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  branchId?: string;
  itemId?: string;
  inventoryItemId?: string;
  type?: InventoryTransactionType;
  /** `YYYY-MM-DD`, tính cả ngày này. */
  fromDate?: string;
  toDate?: string;
}

/** Chỉ có đọc: sổ cái là bản ghi bất biến (SRS FR-18-02). */
export const inventoryTransactionsApi = {
  list: (params: InventoryTransactionListParams = {}) =>
    apiClient
      .get<PaginatedResult<InventoryTransaction>>('/catalog/inventory-transactions', { params })
      .then((r) => r.data),
};

// ------------------------------------------------------------------- Đơn đặt hàng

export interface PurchaseOrderListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  branchId?: string;
  supplierId?: string;
  status?: PurchaseOrderStatus;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export interface PurchaseOrderPayload {
  supplierId: string;
  branchId: string;
  orderDate?: string;
  expectedDate?: string;
  note?: string;
  items: { itemId: string; quantity: number; unitCost: number }[];
}

export const purchaseOrdersApi = {
  list: (params: PurchaseOrderListParams = {}) =>
    apiClient
      .get<PaginatedResult<PurchaseOrder>>('/catalog/purchase-orders', { params })
      .then((r) => r.data),
  getOne: (id: string) =>
    apiClient.get<PurchaseOrder>(`/catalog/purchase-orders/${id}`).then((r) => r.data),
  create: (payload: PurchaseOrderPayload) =>
    apiClient.post<PurchaseOrder>('/catalog/purchase-orders', payload).then((r) => r.data),
  /**
   * `items` nếu có thì **thay thế toàn bộ** các dòng, và chỉ làm được khi đơn còn
   * `DRAFT`. `status` chỉ nhận `ORDERED`/`CANCELLED` — hai trạng thái nhận hàng do
   * backend tính từ số đã nhận.
   */
  update: (
    id: string,
    payload: Partial<Pick<PurchaseOrderPayload, 'expectedDate' | 'note' | 'items'>> & {
      status?: PurchaseOrderStatus;
    },
  ) => apiClient.patch<PurchaseOrder>(`/catalog/purchase-orders/${id}`, payload).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/catalog/purchase-orders/${id}`).then(() => undefined),
};

// -------------------------------------------------------------------- Phiếu nhập

export interface GoodsReceiptListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  branchId?: string;
  supplierId?: string;
  purchaseOrderId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export interface GoodsReceiptPayload {
  purchaseOrderId?: string;
  supplierId: string;
  branchId: string;
  receivedDate?: string;
  note?: string;
  items: {
    itemId: string;
    purchaseOrderItemId?: string;
    quantity: number;
    unitCost: number;
    batchNo: string;
    expiryDate?: string;
  }[];
}

/**
 * Không có `update`/`remove`: phiếu nhập đã sinh sổ cái bất biến và đã tăng tồn thật.
 * Nhập sai thì lập phiếu kiểm kê có ghi lý do.
 */
export const goodsReceiptsApi = {
  list: (params: GoodsReceiptListParams = {}) =>
    apiClient
      .get<PaginatedResult<GoodsReceipt>>('/catalog/goods-receipts', { params })
      .then((r) => r.data),
  getOne: (id: string) =>
    apiClient.get<GoodsReceipt>(`/catalog/goods-receipts/${id}`).then((r) => r.data),
  create: (payload: GoodsReceiptPayload) =>
    apiClient.post<GoodsReceipt>('/catalog/goods-receipts', payload).then((r) => r.data),
};

// --------------------------------------------------------------------- Kiểm kê

export interface StockTakeListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  branchId?: string;
  status?: StockTakeStatus;
  search?: string;
}

export const stockTakesApi = {
  list: (params: StockTakeListParams = {}) =>
    apiClient.get<PaginatedResult<StockTake>>('/catalog/stock-takes', { params }).then((r) => r.data),
  getOne: (id: string) => apiClient.get<StockTake>(`/catalog/stock-takes/${id}`).then((r) => r.data),
  /** `inventoryItemIds` bỏ trống = kiểm kê toàn bộ mặt hàng của chi nhánh. */
  create: (payload: { branchId: string; takenDate?: string; note?: string; inventoryItemIds?: string[] }) =>
    apiClient.post<StockTake>('/catalog/stock-takes', payload).then((r) => r.data),
  submitCounts: (
    id: string,
    items: { stockTakeItemId: string; countedQuantity: number; note?: string }[],
  ) =>
    apiClient
      .patch<StockTake>(`/catalog/stock-takes/${id}/counts`, { items })
      .then((r) => r.data),
  confirm: (id: string, note?: string) =>
    apiClient.post<StockTake>(`/catalog/stock-takes/${id}/confirm`, { note }).then((r) => r.data),
  cancel: (id: string) =>
    apiClient.post<StockTake>(`/catalog/stock-takes/${id}/cancel`, {}).then((r) => r.data),
};
