import apiClient from '../api/client';

export const loginUser = async (email: string, password: string) => {
  const formData = new FormData();
  formData.append('username', email); 
  formData.append('password', password);

  try {
    const response = await apiClient.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Erreur Login:", error);
    throw error;
  }
};

export const registerUser = async (userData: any) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};