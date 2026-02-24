import apiClient from '../api/client';

export const listUsers = async (params?: { q?: string; role?: string }) => {
  const response = await apiClient.get('/users', { params });
  return response.data;
};

export const getUserDetail = async (userId: number) => {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data;
};

export const createUserByManager = async (payload: Record<string, any>) => {
  const response = await apiClient.post('/users', payload);
  return response.data;
};

export const updateUserByManager = async (userId: number, payload: Record<string, any>) => {
  const response = await apiClient.put(`/users/${userId}`, payload);
  return response.data;
};

export const deleteUserByManager = async (userId: number) => {
  const response = await apiClient.delete(`/users/${userId}`);
  return response.data;
};
