import apiClient from '@/lib/api-client';

export const customersService = {
  findAll: (params?: Record<string, unknown>) =>
    apiClient.get('/customers', { params: { limit: 1000, ...params } }),
  findOne: (id: string) =>
    apiClient.get(`/customers/${id}`),
  create: (data: Record<string, unknown>) =>
    apiClient.post('/customers', data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/customers/${id}`, data),
  remove: (id: string) =>
    apiClient.delete(`/customers/${id}`),
  getPurchaseHistory: (id: string) =>
    apiClient.get(`/customers/${id}/purchase-history`),
  getLoyaltyTransactions: (id: string) =>
    apiClient.get(`/customers/${id}/loyalty-transactions`),
};
