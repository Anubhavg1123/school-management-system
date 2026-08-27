import apiClient from './client';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  category: string;
  startDate: string;
  endDate: string;
  isHoliday: boolean;
  allDay: boolean;
  targetRoles: string;
  departmentId?: string;
  venue?: string;
  capacity?: number;
  registeredCount: number;
  status: string;
  registrations?: Array<{ id: string; userId?: string; studentId?: string; status: string; attended: boolean }>;
}

export const calendarApi = {
  getEvents: async (params?: { startDate?: string; endDate?: string; category?: string; isHoliday?: boolean }) => {
    const res = await apiClient.get('/calendar', { params });
    return res.data.data.events as CalendarEvent[];
  },
  createEvent: async (data: Partial<CalendarEvent>) => {
    const res = await apiClient.post('/calendar', data);
    return res.data.data as CalendarEvent;
  },
  checkHoliday: async (date: string) => {
    const res = await apiClient.get('/calendar/holiday-check', { params: { date } });
    return res.data.data as { isHoliday: boolean; holidayName?: string };
  },
  registerForEvent: async (eventId: string, studentId?: string) => {
    const res = await apiClient.post(`/calendar/${eventId}/register`, { studentId });
    return res.data.data;
  },
  recordAttendance: async (registrationId: string, attended: boolean) => {
    const res = await apiClient.post(`/calendar/registrations/${registrationId}/attendance`, { attended });
    return res.data.data;
  },
};
