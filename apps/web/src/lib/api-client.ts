import axios, { type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const _axios = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

_axios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

_axios.interceptors.response.use(
  (response) => {
    const hasEnvelope =
      response.data && typeof response.data === 'object' && 'data' in response.data && 'success' in response.data;
    const payload = hasEnvelope ? response.data.data : response.data;
    // Unwrap paginated shape { data: [...], meta: {...} } → plain array
    if (payload && typeof payload === 'object' && Array.isArray(payload.data) && payload.meta) {
      return payload.data;
    }
    return payload;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// Typed wrapper: the response interceptor unwraps .data, so return type is T not AxiosResponse<T>
const apiClient = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    _axios.get<T>(url, config) as unknown as Promise<T>,
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    _axios.post<T>(url, data, config) as unknown as Promise<T>,
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    _axios.patch<T>(url, data, config) as unknown as Promise<T>,
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    _axios.put<T>(url, data, config) as unknown as Promise<T>,
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    _axios.delete<T>(url, config) as unknown as Promise<T>,
};

export default apiClient;
