import { apiClient as api } from './client';

export const getMyPermissions = async () => {
  const response = await api.get('/permissions/my-permissions');
  return response.data.data;
};

export const assignUserRole = async (payload: { targetUserId: string; roleName: string; departmentId?: string }) => {
  const response = await api.post('/permissions/assign-role', payload);
  return response.data.data;
};

export const suspendUserAccount = async (userId: string, reason: string) => {
  const response = await api.post(`/permissions/users/${userId}/suspend`, { reason });
  return response.data.data;
};

export const activateUserAccount = async (userId: string) => {
  const response = await api.post(`/permissions/users/${userId}/activate`);
  return response.data.data;
};

export const assignOperationalRole = async (
  userId: string,
  payload: {
    role: string;
    departmentId?: string;
    designation?: string;
    employeeOrAdmissionCode?: string;
    reason?: string;
  }
) => {
  const response = await api.post(`/users/${userId}/assign-role`, payload);
  return response.data.data;
};

