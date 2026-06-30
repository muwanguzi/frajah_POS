import apiClient from '@/lib/api-client';

export const reportsService = {
  getSalesReport: (params: Record<string, unknown>) =>
    apiClient.get('/reports/sales', { params }),
  getInventoryReport: (params: Record<string, unknown>) =>
    apiClient.get('/reports/inventory', { params }),
  getProfitLossReport: (params: Record<string, unknown>) =>
    apiClient.get('/reports/profit-loss', { params }),
  getExpensesReport: (params: Record<string, unknown>) =>
    apiClient.get('/reports/expenses', { params }),
  getVATReport: (params: Record<string, unknown>) =>
    apiClient.get('/reports/vat', { params }),
  downloadReport: (type: string, format: string, params: Record<string, unknown>) =>
    apiClient.get(`/reports/${type}/download`, {
      params: { ...params, format },
      responseType: 'blob',
    }),
};
