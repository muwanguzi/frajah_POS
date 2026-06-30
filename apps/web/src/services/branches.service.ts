import apiClient from '@/lib/api-client';

export const branchesService = {
  getBranches: (params?: Record<string, unknown>) =>
    apiClient.get('/branches', { params }),
  createBranch: (data: Record<string, unknown>) =>
    apiClient.post('/branches', data),
  updateBranch: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/branches/${id}`, data),
};
