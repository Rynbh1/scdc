import apiClient from '../api/client';

export const scanProduct = async (barcode: string) => {
  const response = await apiClient.get(`/products/scan/${barcode}`);
  return response.data;
};

export const searchProduct = async (query: string) => {
  const response = await apiClient.get(`/products/search/${query}`);
  return response.data;
};

export const updateProductStock = async (barcode: string, price: number, availableQuantity: number) => {
  const response = await apiClient.put(`/products/manager/stock/${barcode}`, {
    price,
    available_quantity: availableQuantity,
  });
  return response.data;
};
