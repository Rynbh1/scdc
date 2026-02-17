// front/src/services/AuthService.ts
import apiClient from '../api/client';

export const loginUser = async (email: string, password: string) => {
  // FastAPI attend du application/x-www-form-urlencoded pour OAuth2
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);

  try {
    const response = await apiClient.post('/auth/login', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    // On retourne directement la data (qui contient access_token)
    return response.data;
  } catch (error: any) {
    // On log l'erreur précise pour le débuggage
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