import apiClient from '@/lib/api-client';

export const authService = {
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  verify2FA: (data: { userId: string; code: string }) =>
    apiClient.post('/auth/2fa/verify', data),
  enable2FA: (data: { code: string }) =>
    apiClient.post('/auth/2fa/enable', data),
  generate2FA: () => apiClient.post('/auth/2fa/generate', {}),
  getProfile: () => apiClient.get('/auth/profile'),
  logout: () => apiClient.post('/auth/logout', {}),
};
