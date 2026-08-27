import { apiClient } from './client';
import { ApiResponse, FacultyLeave } from '../types';

export const leaveApi = {
  requestLeave: async (data: { leaveType: string; startDate: string; endDate: string; reason: string }) => {
    const res = await apiClient.post<ApiResponse<FacultyLeave>>('/leave/request', data);
    return res.data;
  },

  getMyLeaves: async () => {
    const res = await apiClient.get<ApiResponse<FacultyLeave[]>>('/leave/my-requests');
    return res.data;
  },

  getPendingLeaves: async () => {
    const res = await apiClient.get<ApiResponse<FacultyLeave[]>>('/leave/pending');
    return res.data;
  },

  reviewLeave: async (id: string, action: 'APPROVED' | 'REJECTED', rejectionReason?: string) => {
    const res = await apiClient.post<ApiResponse<FacultyLeave>>(`/leave/${id}/review`, {
      action,
      rejectionReason,
    });
    return res.data;
  },
};
