import apiClient from '../api/client';
import { getCache, setCache } from './cache';

export type ProductApiErrorCode = 'PRODUCT_NOT_FOUND' | 'SCAN_SERVICE_UNAVAILABLE' | 'UNKNOWN';

export class ProductApiError extends Error {
  constructor(public code: ProductApiErrorCode, message: string) {
    super(message);
  }
}

const ONE_HOUR = 60 * 60 * 1000;

const toSafeKey = (value: string) => value.trim().toLowerCase();

const mapApiError = (error: any): ProductApiError => {
  const detail = error?.response?.data?.detail;
  if (detail?.code === 'PRODUCT_NOT_FOUND') {
    return new ProductApiError('PRODUCT_NOT_FOUND', detail.message);
  }
  if (detail?.code === 'SCAN_SERVICE_UNAVAILABLE') {
    return new ProductApiError('SCAN_SERVICE_UNAVAILABLE', detail.message);
  }
  return new ProductApiError('UNKNOWN', 'Une erreur réseau est survenue.');
};

export const scanProduct = async (barcode: string) => {
  const cacheKey = `scan:${toSafeKey(barcode)}`;
  try {
    const response = await apiClient.get(`/products/scan/${barcode}`);
    await setCache(cacheKey, response.data);
    return response.data;
  } catch (error) {
    const cached = await getCache<any>(cacheKey, ONE_HOUR);
    if (cached) return cached;
    throw mapApiError(error);
  }
};

export const searchProduct = async (query: string) => {
  const cacheKey = `search:${toSafeKey(query)}`;
  try {
    const response = await apiClient.get(`/products/search/${query}`);
    await setCache(cacheKey, response.data);
    return response.data;
  } catch {
    const cached = await getCache<any[]>(cacheKey, ONE_HOUR);
    if (cached) return cached;
    throw new ProductApiError('UNKNOWN', 'Problème de connexion.');
  }
};

export const getRecommendations = async (params?: { category?: string; limit?: number }) => {
  const cacheKey = `recommendations:${JSON.stringify(params || {})}`;
  try {
    const response = await apiClient.get('/products/recommendations', { params });
    await setCache(cacheKey, response.data);
    return response.data;
  } catch {
    const cached = await getCache<any>(cacheKey, ONE_HOUR);
    if (cached) return cached;
    throw new ProductApiError('UNKNOWN', 'Impossible de charger les recommandations.');
  }
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
  const cacheKey = `list:${JSON.stringify(params || {})}`;
  try {
    const response = await apiClient.get('/products', { params });
    await setCache(cacheKey, response.data);
    return response.data;
  } catch {
    const cached = await getCache<any>(cacheKey, ONE_HOUR);
    if (cached) return cached;
    throw new ProductApiError('UNKNOWN', 'Impossible de charger le stock.');
  }
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
