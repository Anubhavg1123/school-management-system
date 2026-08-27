import client from './client';

export interface PreRegisteredVisitor {
  id: string;
  visitorFullName: string;
  contactNumber: string;
  expectedDate: string;
  hostUserId: string;
  purpose: string;
  securityPassNumber?: string;
  status: 'PENDING_ARRIVAL' | 'ARRIVED' | 'CANCELLED' | 'EXPIRED';
  checkedInTime?: string;
  hostUser?: { firstName: string; lastName: string; activeRole: string };
}

export const smartCampusApi = {
  getLiveOccupancy: async () => {
    const res = await client.get('/campus/live-status');
    return res.data;
  },

  getVehicleAlerts: async () => {
    const res = await client.get('/campus/vehicle-alerts');
    return res.data;
  },

  getPreRegisteredVisitors: async (params?: { expectedDate?: string; status?: string }) => {
    const res = await client.get<{ data: { records: PreRegisteredVisitor[] } }>('/campus/pre-registered-visitors', { params });
    return res.data;
  },

  preRegisterVisitor: async (data: {
    visitorFullName: string;
    contactNumber: string;
    expectedDate: string;
    purpose: string;
  }) => {
    const res = await client.post('/campus/pre-register-visitor', data);
    return res.data;
  },

  checkInVisitor: async (id: string) => {
    const res = await client.post(`/campus/pre-registered-visitors/${id}/check-in`);
    return res.data;
  },
};
