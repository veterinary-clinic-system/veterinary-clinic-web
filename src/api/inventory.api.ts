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

export interface InventoryListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  branchId?: string;
  itemId?: string;
  
  search?: string;
  
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
  
  type: InventoryTransactionType;
  note: string;
}

export const inventoryApi = {
  list: (params: InventoryListParams = {}) =>
    apiClient.get<PaginatedResult<InventoryItem>>('/catalog/inventory', { params }).then((r) => r.data),
  
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
  
  adjust: (id: string, payload: { delta?: number; inventoryQuantity?: number; note?: string }) =>
    apiClient.patch<InventoryItem>(`/catalog/inventory/${id}`, payload).then((r) => r.data),
};

export interface InventoryTransactionListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  branchId?: string;
  itemId?: string;
  inventoryItemId?: string;
  type?: InventoryTransactionType;
  
  fromDate?: string;
  toDate?: string;
}

export const inventoryTransactionsApi = {
  list: (params: InventoryTransactionListParams = {}) =>
    apiClient
      .get<PaginatedResult<InventoryTransaction>>('/catalog/inventory-transactions', { params })
      .then((r) => r.data),
};

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
  
  update: (
    id: string,
    payload: Partial<Pick<PurchaseOrderPayload, 'expectedDate' | 'note' | 'items'>> & {
      status?: PurchaseOrderStatus;
    },
  ) => apiClient.patch<PurchaseOrder>(`/catalog/purchase-orders/${id}`, payload).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/catalog/purchase-orders/${id}`).then(() => undefined),
};

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
