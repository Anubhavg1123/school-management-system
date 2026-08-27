import { apiClient as api } from './client';
import { ApiResponse } from '../types';

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  noticeType: string;
  priority: string;
  publishDate: string;
  expiryDate?: string | null;
  targetAudience: string;
  author: string;
  departmentName?: string | null;
  className?: string | null;
  requireAcknowledgment: boolean;
  isAcknowledged: boolean;
  attachments: any[];
}

export const noticeApi = {
  getNotices: async (params?: { search?: string; type?: string }): Promise<NoticeItem[]> => {
    const res = await api.get<ApiResponse<NoticeItem[]>>('/notices', { params });
    return res.data.data || [];
  },

  createNotice: async (payload: any): Promise<NoticeItem> => {
    const res = await api.post<ApiResponse<NoticeItem>>('/notices', payload);
    return res.data.data!;
  },

  estimateRecipients: async (params: { targetAudience: string; departmentId?: string; classId?: string; sectionId?: string }): Promise<{ targetAudience: string; estimatedRecipients: number }> => {
    const res = await api.get<ApiResponse<{ targetAudience: string; estimatedRecipients: number }>>('/notices/recipient-estimate', { params });
    return res.data.data!;
  },

  acknowledgeNotice: async (id: string): Promise<any> => {
    const res = await api.post<ApiResponse<any>>(`/notices/${id}/acknowledge`);
    return res.data.data!;
  },
};
