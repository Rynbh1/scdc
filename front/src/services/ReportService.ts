import apiClient from '../api/client';

export const getKpiReports = async (token: string) => {
  try {
    const response = await apiClient.get('/reports'); 
    return response.data;
  } catch (error) {
    console.error("Erreur ReportService:", error);
    throw error;
  }
};