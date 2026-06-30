import apiClient from '@/lib/api-client';

export const accountingService = {
  getAccounts: (params?: Record<string, unknown>) =>
    apiClient.get('/accounting/accounts', { params: { limit: 1000, ...params } }),
  getJournalEntries: (params?: Record<string, unknown>) =>
    apiClient.get('/accounting/journal-entries', { params: { limit: 1000, ...params } }),
  createJournalEntry: (data: Record<string, unknown>) =>
    apiClient.post('/accounting/journal-entries', data),
  getCashbook: (params?: Record<string, unknown>) =>
    apiClient.get('/accounting/cashbook', { params }),
  getTrialBalance: (params?: Record<string, unknown>) =>
    apiClient.get('/accounting/trial-balance', { params }),
  getProfitLoss: (params?: Record<string, unknown>) =>
    apiClient.get('/accounting/profit-loss', { params }),
  getBalanceSheet: (params?: Record<string, unknown>) =>
    apiClient.get('/accounting/balance-sheet', { params }),
  getVATReport: (params?: Record<string, unknown>) =>
    apiClient.get('/accounting/vat-report', { params }),
  getBankReconciliation: (params?: Record<string, unknown>) =>
    apiClient.get('/accounting/bank-reconciliation', { params }),
};
