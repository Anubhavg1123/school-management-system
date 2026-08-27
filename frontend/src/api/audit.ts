import { apiClient } from './client';

export const auditApi = {
  getLogs: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    entityType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const res = await apiClient.get('/audit', { params });
    return res.data;
  },
};
