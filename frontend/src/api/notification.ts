import { apiClient as api } from './client';
import { ApiResponse } from '../types';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface UserNotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

export const notificationApi = {
  getUserNotifications: async (params?: { unreadOnly?: boolean; limit?: number }): Promise<UserNotificationsResponse> => {
    const res = await api.get<ApiResponse<UserNotificationsResponse>>('/notifications', { params });
    return res.data.data!;
  },

  markAsRead: async (id: string): Promise<NotificationItem> => {
    const res = await api.patch<ApiResponse<NotificationItem>>(`/notifications/${id}/read`);
    return res.data.data!;
  },

  markAllAsRead: async (): Promise<{ success: boolean }> => {
    const res = await api.post<ApiResponse<{ success: boolean }>>('/notifications/read-all');
    return res.data.data!;
  },

  deleteNotification: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.delete<ApiResponse<{ success: boolean }>>(`/notifications/${id}`);
    return res.data.data!;
  },
};
