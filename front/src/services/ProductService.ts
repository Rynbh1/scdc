import apiClient from '../api/client';

export const scanProduct = async (barcode: string) => {
  try {
    const response = await apiClient.get(`/products/scan/${barcode}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchProduct = async (query: string) => {
  try {
    const response = await apiClient.get(`/products/search/${query}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateProductPrice = async (barcode: string, newPrice: number) => {
  try {
    const response = await apiClient.put(`/products/update_price/${barcode}`, {
      price: newPrice
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};