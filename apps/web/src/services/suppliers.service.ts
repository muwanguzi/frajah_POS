import apiClient from '@/lib/api-client';

export const suppliersService = {
  findAll: (params?: Record<string, unknown>) =>
    apiClient.get('/suppliers', { params: { limit: 1000, ...params } }),
  findOne: (id: string) =>
    apiClient.get(`/suppliers/${id}`),
  create: (data: Record<string, unknown>) =>
    apiClient.post('/suppliers', data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/suppliers/${id}`, data),
  remove: (id: string) =>
    apiClient.delete(`/suppliers/${id}`),
  getPurchaseHistory: (id: string) =>
    apiClient.get(`/suppliers/${id}/purchase-history`),
  getPaymentHistory: (id: string) =>
    apiClient.get(`/suppliers/${id}/payment-history`),
};
