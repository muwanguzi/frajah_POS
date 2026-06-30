import apiClient from '@/lib/api-client';

export const posService = {
  openSession: (data: { branchId: string; cashierId: string; openingCash: number }) =>
    apiClient.post('/pos/sessions/open', data),

  closeSession: (sessionId: string, closingCash: number) =>
    apiClient.patch(`/pos/sessions/${sessionId}/close`, { closingCash }),

  getActiveSession: (cashierId: string) =>
    apiClient.get('/pos/sessions/active', { params: { cashierId } }),

  getSessions: (params?: Record<string, unknown>) =>
    apiClient.get('/pos/sessions', { params }),

  lookupProduct: (query: string) =>
    apiClient.get('/pos/products/lookup', { params: { q: query } }),

  completeSale: (data: {
    sessionId: string;
    customerId?: string;
    branchId: string;
    cashierId: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      discountPercent?: number;
    }>;
    payments: Array<{ method: string; amount: number; reference?: string }>;
    discountAmount?: number;
    notes?: string;
    taxRate?: number;
  }) => apiClient.post('/pos/sales', data),

  getSales: (params?: Record<string, unknown>) =>
    apiClient.get('/pos/transactions', { params: { limit: 1000, ...params } }),

  getTransactions: (params?: Record<string, unknown>) =>
    apiClient.get('/pos/transactions', { params: { limit: 1000, ...params } }),

  getTransaction: (id: string) =>
    apiClient.get(`/pos/transactions/${id}`),

  voidTransaction: (id: string, reason: string) =>
    apiClient.delete(`/pos/transactions/${id}/void`, { data: { reason } }),
};
