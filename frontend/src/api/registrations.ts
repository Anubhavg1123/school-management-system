import { apiClient } from './client';
import { ApiResponse, RegistrationRequest } from '../types';

export const registrationsApi = {
  getPending: async (params?: { page?: number; limit?: number; roleId?: string; departmentId?: string }) => {
    const res = await apiClient.get<ApiResponse<RegistrationRequest[]>>('/registrations/pending', { params });
    return res.data;
  },

  getRecentlyReviewed: async (limit = 10) => {
    const res = await apiClient.get<ApiResponse<{ approved: RegistrationRequest[]; rejected: RegistrationRequest[] }>>(
      '/registrations/recently-reviewed',
      { params: { limit } }
    );
    return res.data;
  },

  getById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<RegistrationRequest>>(`/registrations/${id}`);
    return res.data;
  },

  markUnderReview: async (id: string, reviewerNotes?: string) => {
    const res = await apiClient.patch<ApiResponse<RegistrationRequest>>(`/registrations/${id}/under-review`, {
      reviewerNotes,
    });
    return res.data;
  },

  approve: async (id: string, data: { role?: string; departmentId?: string; employeeOrAdmissionCode?: string; designation?: string; reviewerNotes?: string }) => {
    const res = await apiClient.post<ApiResponse<{ status: string; userId: string; role?: string }>>(`/registrations/${id}/approve`, data);
    return res.data;
  },

  reject: async (id: string, reason: string) => {
    const res = await apiClient.post<ApiResponse<{ status: string }>>(`/registrations/${id}/reject`, { reason });
    return res.data;
  },
};
