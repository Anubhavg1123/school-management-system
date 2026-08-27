import { apiClient as api } from './client';
import { ApiResponse } from '../types';

export interface NonFacultyDashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    jobTitle: string;
    employeeCode: string;
  };
  todayDate: string;
  attendanceStatus: {
    id?: string;
    status: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    source?: string;
    enteredByUserId?: string | null;
  };
  assignedVehicle?: {
    id: string;
    registrationNumber: string;
    makeModel?: string;
    type: string;
    status: string;
  } | null;
  todayKmLogs: any[];
  notifications: any[];
}

export const nonFacultyApi = {
  getDashboard: async (): Promise<NonFacultyDashboardData> => {
    const res = await api.get<ApiResponse<NonFacultyDashboardData>>('/non-faculty/dashboard');
    return res.data.data!;
  },

  getStaffCategories: async (): Promise<any[]> => {
    const res = await api.get<ApiResponse<any[]>>('/non-faculty/categories');
    return res.data.data || [];
  },

  createStaffCategory: async (payload: { code: string; name: string; description?: string }): Promise<any> => {
    const res = await api.post<ApiResponse<any>>('/non-faculty/categories', payload);
    return res.data.data!;
  },

  attenderMarkAttendance: async (payload: { targetUserId: string; action: 'CHECK_IN' | 'CHECK_OUT'; remarks?: string }): Promise<any> => {
    const res = await api.post<ApiResponse<any>>('/non-faculty/attender/attendance', payload);
    return res.data.data!;
  },

  getAttenderDashboard: async (): Promise<any> => {
    const res = await api.get<ApiResponse<any>>('/non-faculty/attender/dashboard');
    return res.data.data!;
  },
};
