import { apiClient as api } from './client';

export const getGuardianDashboard = async (studentId?: string) => {
  const response = await api.get('/guardian/dashboard', {
    params: { studentId },
  });
  return response.data;
};

export const getLinkedChildren = async () => {
  const response = await api.get('/guardian/children');
  return response.data;
};

export const getWardResults = async (studentId: string) => {
  const response = await api.get(`/guardian/children/${studentId}/results`);
  return response.data;
};

export const getWardFees = async (studentId: string) => {
  const response = await api.get(`/guardian/children/${studentId}/fees`);
  return response.data;
};

export const updateGuardianPreferences = async (payload: { whatsAppEnabled?: boolean; emailEnabled?: boolean; inAppEnabled?: boolean; smsEnabled?: boolean }) => {
  const response = await api.put('/guardian/preferences', payload);
  return response.data;
};
