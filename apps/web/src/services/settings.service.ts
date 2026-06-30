import apiClient from '@/lib/api-client';

export const settingsService = {
  findAll: (branchId?: string) =>
    apiClient.get('/settings', { params: branchId ? { branchId } : {} }),

  get: (key: string, branchId?: string) =>
    apiClient.get(`/settings/${key}`, { params: branchId ? { branchId } : {} }),

  set: (key: string, value: unknown, branchId?: string) =>
    apiClient.put(`/settings/${key}`, { value, branchId }),

  remove: (key: string, branchId?: string) =>
    apiClient.delete(`/settings/${key}`, { params: branchId ? { branchId } : {} }),
};
