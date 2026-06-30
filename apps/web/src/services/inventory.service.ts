import apiClient from '@/lib/api-client';

export const inventoryService = {
  getStockLevels: (params?: Record<string, unknown>) =>
    apiClient.get('/inventory/stock-levels', { params: { limit: 1000, ...params } }),
  createAdjustment: (data: Record<string, unknown>) =>
    apiClient.post('/inventory/adjustments', data),
  createTransfer: (data: Record<string, unknown>) =>
    apiClient.post('/inventory/transfers', data),
  getAdjustments: (params?: Record<string, unknown>) =>
    apiClient.get('/inventory/adjustments', { params: { limit: 1000, ...params } }),
  getTransfers: (params?: Record<string, unknown>) =>
    apiClient.get('/inventory/transfers', { params: { limit: 1000, ...params } }),
  getBatches: (params?: Record<string, unknown>) =>
    apiClient.get('/batches', { params: { limit: 1000, ...params } }),
  createStockCount: (data: Record<string, unknown>) =>
    apiClient.post('/inventory/stock-counts', data),
  getStockCounts: (params?: Record<string, unknown>) =>
    apiClient.get('/inventory/stock-counts', { params: { limit: 1000, ...params } }),
};
