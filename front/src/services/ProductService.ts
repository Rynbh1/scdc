import apiClient from '../api/client';

export const scanProduct = async (barcode: string) => {
  const response = await apiClient.get(`/products/scan/${barcode}`);
  return response.data;
};

export const searchProduct = async (query: string) => {
  const response = await apiClient.get(`/products/search/${query}`);
  return response.data;
};

export const advancedSearchProducts = async (params: {
  q?: string;
  category?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  sort_by?: 'name' | 'price' | 'stock' | 'category' | 'brand';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}) => {
  const response = await apiClient.get('/products/advanced-search', { params });
  return response.data;
};

export const listProducts = async (params?: Record<string, any>) => {
  const response = await apiClient.get('/products', { params });
  return response.data;
};

export const createProduct = async (payload: {
  name: string;
  brand?: string;
  category?: string;
  price: number;
  picture?: string;
  nutritional_info?: string;
  available_quantity: number;
  off_id?: string;
}) => {
  const response = await apiClient.post('/products/manager', payload);
  return response.data;
};

export const updateProduct = async (productId: number, payload: Record<string, any>) => {
  const response = await apiClient.put(`/products/${productId}`, payload);
  return response.data;
};

export const deleteProduct = async (productId: number) => {
  const response = await apiClient.delete(`/products/${productId}`);
  return response.data;
};

export const importProductFromOpenFoodFacts = async (barcode: string, overwrite = false) => {
  const response = await apiClient.post(`/products/import/off/${barcode}`, null, {
    params: { overwrite },
  });
  return response.data;
};

export const updateProductStock = async (barcode: string, price: number, availableQuantity: number) => {
  const response = await apiClient.put(`/products/manager/stock/${barcode}`, {
    price,
    available_quantity: availableQuantity,
  });
  return response.data;
};
