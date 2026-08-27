import client from './client';

export interface EmergencyAlert {
  id: string;
  title: string;
  message: string;
  priority: 'NORMAL' | 'HIGH' | 'EMERGENCY';
  targetAudience: string;
  channels: string;
  status: 'SENT' | 'CANCELLED';
  sentAt: string;
  cancelledAt?: string;
  cancellationNote?: string;
  createdBy?: {
    firstName: string;
    lastName: string;
    activeRole: string;
  };
}

export interface CampusStatus {
  currentStatus: 'NORMAL' | 'WARNING' | 'EMERGENCY';
  lastReason: string;
  updatedBy: string;
  updatedAt: string;
}

export const emergencyApi = {
  getAlerts: async (params?: { status?: string; priority?: string }) => {
    const res = await client.get<{ data: { alerts: EmergencyAlert[] } }>('/emergency/alerts', { params });
    return res.data;
  },

  createAlert: async (data: {
    title: string;
    message: string;
    priority?: 'NORMAL' | 'HIGH' | 'EMERGENCY';
    targetAudience?: string;
    channels?: string[];
  }) => {
    const res = await client.post('/emergency/alerts', data);
    return res.data;
  },

  cancelAlert: async (id: string, reason: string) => {
    const res = await client.post(`/emergency/alerts/${id}/cancel`, { reason });
    return res.data;
  },

  getCampusStatus: async () => {
    const res = await client.get<{ data: CampusStatus }>('/emergency/campus-status');
    return res.data;
  },

  updateCampusStatus: async (data: { status: 'NORMAL' | 'WARNING' | 'EMERGENCY'; reason?: string }) => {
    const res = await client.post('/emergency/campus-status', data);
    return res.data;
  },
};
