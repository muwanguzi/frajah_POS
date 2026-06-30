import apiClient from '@/lib/api-client';

export interface ProductParams {
  search?: string;
  categoryId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const productsService = {
  findAll: (params?: ProductParams) =>
    apiClient.get('/products', { params: { limit: 1000, ...params } }),
  findOne: (id: string) =>
    apiClient.get(`/products/${id}`),
  create: (data: Record<string, unknown>) =>
    apiClient.post('/products', data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/products/${id}`, data),
  remove: (id: string) =>
    apiClient.delete(`/products/${id}`),
  findByBarcode: (barcode: string) =>
    apiClient.get(`/products/barcode/${barcode}`),
  getLowStock: () =>
    apiClient.get('/products/low-stock'),
};
