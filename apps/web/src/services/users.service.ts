import apiClient from '@/lib/api-client';

export const usersService = {
  getUsers: (params?: Record<string, unknown>) =>
    apiClient.get('/users', { params: { limit: 1000, ...params } }),
  createUser: (data: Record<string, unknown>) =>
    apiClient.post('/users', data),
  updateUser: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/users/${id}`, data),
  deactivateUser: (id: string) =>
    apiClient.delete(`/users/${id}`),
};
