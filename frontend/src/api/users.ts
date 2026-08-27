import { apiClient } from './client';
import { ApiResponse, User, AuditLogItem } from '../types';

export const usersApi = {
  getUsers: async (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string; departmentId?: string; userCategory?: string }) => {
    const res = await apiClient.get<ApiResponse<User[]>>('/users', { params });
    return res.data;
  },

  getUserById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return res.data;
  },

  createUser: async (data: any) => {
    const res = await apiClient.post<ApiResponse<User>>('/users', data);
    return res.data;
  },

  updateProfile: async (id: string, data: any) => {
    const res = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
    return res.data;
  },

  updateStatus: async (id: string, status: string) => {
    const res = await apiClient.patch<ApiResponse<User>>(`/users/${id}/status`, { status });
    return res.data;
  },

  assignRoles: async (id: string, roles: Array<{ roleName: string; departmentId?: string; isPrimary?: boolean }>) => {
    const res = await apiClient.post<ApiResponse<User>>(`/users/${id}/roles`, { roles });
    return res.data;
  },

  resetPassword: async (id: string, newPassword?: string) => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>(`/users/${id}/reset-password`, { newPassword });
    return res.data;
  },

  getUserAuditTrail: async (id: string) => {
    const res = await apiClient.get<ApiResponse<AuditLogItem[]>>(`/users/${id}/audit`);
    return res.data;
  },

  getRoles: async () => {
    const res = await apiClient.get<ApiResponse<any[]>>('/users/roles');
    return res.data;
  },

  getPermissions: async () => {
    const res = await apiClient.get<ApiResponse<any[]>>('/users/permissions');
    return res.data;
  },
};
