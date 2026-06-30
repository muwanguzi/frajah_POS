import apiClient from '@/lib/api-client';

export const purchasingService = {
  // Purchase Orders
  getPurchaseOrders: (params?: Record<string, unknown>) =>
    apiClient.get('/purchasing/orders', { params: { limit: 1000, ...params } }),
  getPurchaseOrder: (id: string) =>
    apiClient.get(`/purchasing/orders/${id}`),
  createPurchaseOrder: (data: Record<string, unknown>) =>
    apiClient.post('/purchasing/orders', data),
  updatePurchaseOrderStatus: (id: string, status: string) =>
    apiClient.patch(`/purchasing/orders/${id}/status`, { status }),
  // Goods Receipt
  receiveGoods: (data: Record<string, unknown>) =>
    apiClient.post('/purchasing/receipts', data),
};
