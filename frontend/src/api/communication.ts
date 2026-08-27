import { apiClient as api } from './client';
import { ApiResponse } from '../types';

export interface CommunicationDeliveryItem {
  id: string;
  eventId?: string | null;
  userId?: string | null;
  guardianPhone?: string | null;
  channel: string;
  provider: string;
  providerMessageId?: string | null;
  recipientContact: string;
  templateCode?: string | null;
  variables?: string | null;
  status: string;
  retryCount: number;
  failureReason?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
}

export const communicationApi = {
  getTemplates: async (): Promise<any[]> => {
    const res = await api.get<ApiResponse<any[]>>('/communication/templates');
    return res.data.data || [];
  },

  sendWhatsAppTemplate: async (payload: { recipientPhone: string; templateCode: string; variables: Record<string, string> }): Promise<CommunicationDeliveryItem> => {
    const res = await api.post<ApiResponse<CommunicationDeliveryItem>>('/communication/whatsapp/send-template', payload);
    return res.data.data!;
  },

  getLogs: async (params?: { channel?: string; status?: string; search?: string }): Promise<{ providerConfigured: boolean; deliveries: CommunicationDeliveryItem[] }> => {
    const res = await api.get<ApiResponse<{ providerConfigured: boolean; deliveries: CommunicationDeliveryItem[] }>>('/communication/logs', { params });
    return res.data.data!;
  },

  triggerQueueWorker: async (): Promise<any> => {
    const res = await api.post<ApiResponse<any>>('/communication/process-queue');
    return res.data.data!;
  },
};
