import axios from 'axios';
import { tokenStorage } from '../utils/storage';

const BASE_URL = 'http://192.168.1.63:8000'; 

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getItem('userToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) await tokenStorage.deleteItem('userToken');
    return Promise.reject(error);
  }
);

export default apiClient;