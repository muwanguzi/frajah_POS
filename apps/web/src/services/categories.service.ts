import apiClient from '@/lib/api-client';

export const categoriesService = {
  findAll: (params?: Record<string, unknown>) =>
    apiClient.get('/categories', { params }),
  findOne: (id: string) =>
    apiClient.get(`/categories/${id}`),
  create: (data: Record<string, unknown>) =>
    apiClient.post('/categories', data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/categories/${id}`, data),
  remove: (id: string) =>
    apiClient.delete(`/categories/${id}`),
};
