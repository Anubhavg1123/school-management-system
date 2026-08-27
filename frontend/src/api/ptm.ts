import apiClient from './client';

export interface PtmSlot {
  id: string;
  facultyId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  maxBookings: number;
  currentBookings: number;
  status: string;
  faculty?: {
    user?: { id: string; firstName: string; lastName: string; email: string };
    department?: { name: string; code: string };
  };
  bookings?: Array<{
    id: string;
    studentId: string;
    guardianUserId: string;
    status: string;
    meetingNotes?: string;
    sensitiveRemarks?: string;
    student?: { user?: { firstName: string; lastName: string } };
    guardianUser?: { firstName: string; lastName: string; phone?: string };
  }>;
}

export const ptmApi = {
  getSlots: async (params?: { facultyId?: string; date?: string; status?: string }) => {
    const res = await apiClient.get('/ptm/slots', { params });
    return res.data.data.slots as PtmSlot[];
  },
  createSlots: async (data: {
    facultyId?: string;
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes?: number;
    maxBookingsPerSlot?: number;
  }) => {
    const res = await apiClient.post('/ptm/slots', data);
    return res.data.data.slots as PtmSlot[];
  },
  bookSlot: async (slotId: string, studentId: string) => {
    const res = await apiClient.post(`/ptm/slots/${slotId}/book`, { studentId });
    return res.data.data;
  },
  recordNotes: async (bookingId: string, data: { meetingNotes?: string; sensitiveRemarks?: string; status?: string }) => {
    const res = await apiClient.patch(`/ptm/bookings/${bookingId}/notes`, data);
    return res.data.data;
  },
};
