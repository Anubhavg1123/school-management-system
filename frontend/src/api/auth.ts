import { apiClient } from './client';
import { ApiResponse, User } from '../types';

export const authApi = {
  login: async (credentials: { identifier: string; password: string; selectedRole?: string }) => {
    const res = await apiClient.post<ApiResponse<{ user: User; tokens: { accessToken: string; refreshToken: string } }>>(
      '/auth/login',
      credentials
    );
    return res.data;
  },

  register: async (data: any) => {
    const res = await apiClient.post<ApiResponse<{ registrationId: string; status: string }>>(
      '/auth/register',
      data
    );
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data;
  },

  logout: async (refreshToken?: string) => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/logout', { refreshToken });
    return res.data;
  },

  logoutAll: async () => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/logout-all');
    return res.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/change-password', data);
    return res.data;
  },
};
