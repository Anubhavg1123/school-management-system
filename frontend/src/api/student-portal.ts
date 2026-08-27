import { apiClient as api } from './client';

export const getStudentDashboard = async () => {
  const response = await api.get('/student/dashboard');
  return response.data;
};

export const getStudentTimetable = async (studentId: string, dayOfWeek?: string) => {
  const response = await api.get(`/student/timetable/${studentId}`, {
    params: { dayOfWeek },
  });
  return response.data;
};

export const getStudentAttendance = async (studentId: string) => {
  const response = await api.get(`/student/attendance/${studentId}`);
  return response.data;
};

export const requestProfileUpdate = async (studentId: string, payload: { fieldChanges: object; reason?: string }) => {
  const response = await api.post(`/student/profile-update-requests/${studentId}`, payload);
  return response.data;
};

export const requestStudentLeave = async (studentId: string, payload: { startDate: string; endDate: string; reason: string }) => {
  const response = await api.post(`/student/leave-requests/${studentId}`, payload);
  return response.data;
};
