import apiClient from '../api/client';

export const loginUser = async (email: string, password: string) => {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);

  try {
    const response = await apiClient.post('/auth/login', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    return response.data;
  } catch (error: any) {
    console.error("Erreur Login Détail:", error.response?.data || error.message);
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

export const updateProfile = async (userData: any) => {
  try {
    const response = await apiClient.put('/auth/me', userData);
    return response.data;
  } catch (error) {
    console.error("Erreur Update Profile:", error);
    throw error;
  }
};