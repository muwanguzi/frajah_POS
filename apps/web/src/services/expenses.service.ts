import apiClient from '@/lib/api-client';

export const expensesService = {
  getExpenses: (params?: Record<string, unknown>) =>
    apiClient.get('/expenses', { params: { limit: 1000, ...params } }),
  createExpense: (data: Record<string, unknown>) =>
    apiClient.post('/expenses', data),
  updateExpense: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/expenses/${id}`, data),
  submitExpense: (id: string) =>
    apiClient.post(`/expenses/${id}/submit`, {}),
  approveExpense: (id: string) =>
    apiClient.patch(`/expenses/${id}/approve`, {}),
  rejectExpense: (id: string, reason?: string) =>
    apiClient.patch(`/expenses/${id}/reject`, { reason }),
  getPendingApprovals: () =>
    apiClient.get('/expenses/pending-approvals'),
  getCategories: () =>
    apiClient.get('/expenses/categories/list'),
};
