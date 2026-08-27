import { apiClient } from './client';

export const attendanceApi = {
  checkIn: async (data?: { source?: string; kioskIdentifier?: string; targetUserId?: string }) => {
    const res = await apiClient.post('/attendance/check-in', data || {});
    return res.data;
  },
  checkOut: async (data?: { source?: string; targetUserId?: string }) => {
    const res = await apiClient.post('/attendance/check-out', data || {});
    return res.data;
  },
  getTodayStatus: async (userId?: string) => {
    const res = await apiClient.get('/attendance/today', { params: { userId } });
    return res.data;
  },
  getMyRecords: async (params?: { startDate?: string; endDate?: string }) => {
    const res = await apiClient.get('/attendance/my-records', { params });
    return res.data;
  },
  getRecords: async (params?: { page?: number; limit?: number; date?: string; status?: string; departmentId?: string; role?: string }) => {
    const res = await apiClient.get('/attendance/records', { params });
    return res.data;
  },
  requestCorrection: async (data: {
    attendanceId: string;
    proposedCheckIn?: string;
    proposedCheckOut?: string;
    proposedStatus?: string;
    reason: string;
  }) => {
    const res = await apiClient.post('/attendance/corrections', data);
    return res.data;
  },
  reviewCorrection: async (id: string, action: 'APPROVED' | 'REJECTED', rejectionReason?: string) => {
    const res = await apiClient.post(`/attendance/corrections/${id}/review`, { action, rejectionReason });
    return res.data;
  },
};
