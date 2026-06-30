import apiClient from '@/lib/api-client';

export const salesService = {
  getOrders: (params?: Record<string, unknown>) =>
    apiClient.get('/sales/orders', { params: { limit: 1000, ...params } }),
  getInvoices: (params?: Record<string, unknown>) =>
    apiClient.get('/sales/invoices', { params: { limit: 1000, ...params } }),
  getQuotes: (params?: Record<string, unknown>) =>
    apiClient.get('/sales/quotes', { params: { limit: 1000, ...params } }),
  createInvoice: (data: Record<string, unknown>) =>
    apiClient.post('/sales/invoices', data),
  createQuote: (data: Record<string, unknown>) =>
    apiClient.post('/sales/quotes', data),
  createCreditNote: (data: Record<string, unknown>) =>
    apiClient.post('/sales/credit-notes', data),
  recordPayment: (invoiceId: string, data: Record<string, unknown>) =>
    apiClient.post(`/sales/invoices/${invoiceId}/payments`, data),
  getDeliveryNotes: (params?: Record<string, unknown>) =>
    apiClient.get('/sales/delivery-notes', { params: { limit: 1000, ...params } }),
  getCreditNotes: (params?: Record<string, unknown>) =>
    apiClient.get('/sales/credit-notes', { params: { limit: 1000, ...params } }),
};
