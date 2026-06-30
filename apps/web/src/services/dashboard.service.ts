import apiClient from '@/lib/api-client';

export const dashboardService = {
  getMetrics: (branchId?: string) =>
    apiClient.get('/dashboard/metrics', { params: branchId ? { branchId } : {} }),
  getSalesChart: (period: string) =>
    apiClient.get('/dashboard/sales-chart', { params: { period } }),
  getAlerts: () =>
    apiClient.get('/dashboard/alerts'),
};
