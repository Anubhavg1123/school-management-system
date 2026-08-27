import { apiClient as api } from './client';
import { ApiResponse } from '../types';

export interface ActiveVisitorItem {
  id: string;
  passNumber: string;
  passToken: string;
  visitorName: string;
  contactNumber: string;
  visitorType: string;
  studentRelationship?: string;
  studentName?: string;
  personToMeet: string;
  purpose: string;
  vehicleNumber?: string;
  entryTime: string;
  durationHours: number;
  isOverstay: boolean;
  isEmergency: boolean;
  emergencyReason?: string;
  securityStaffName: string;
}

export const visitorSecurityApi = {
  createVisitorEntry: async (payload: any): Promise<any> => {
    const res = await api.post<ApiResponse<any>>('/visitor-security/visitors', payload);
    return res.data.data!;
  },

  markVisitorExit: async (passNumberOrId: string, remarks?: string): Promise<any> => {
    const res = await api.post<ApiResponse<any>>(`/visitor-security/visitors/${passNumberOrId}/exit`, { remarks });
    return res.data.data!;
  },

  getActiveVisitors: async (thresholdHours?: number): Promise<ActiveVisitorItem[]> => {
    const res = await api.get<ApiResponse<ActiveVisitorItem[]>>('/visitor-security/active-visitors', {
      params: { thresholdHours },
    });
    return res.data.data || [];
  },

  searchStudents: async (query: string): Promise<any[]> => {
    const res = await api.get<ApiResponse<any[]>>('/visitor-security/students/search', { params: { query } });
    return res.data.data || [];
  },

  verifyVehicle: async (vehicleNumber: string): Promise<any> => {
    const res = await api.get<ApiResponse<any>>(`/visitor-security/vehicles/verify/${vehicleNumber}`);
    return res.data.data!;
  },

  recordCampusVehicleEntry: async (payload: { vehicleNumber: string; driverOwnerName?: string; vehicleType?: string; purpose?: string }): Promise<any> => {
    const res = await api.post<ApiResponse<any>>('/visitor-security/campus-vehicles', payload);
    return res.data.data!;
  },

  recordCampusVehicleExit: async (vehicleLogId: string): Promise<any> => {
    const res = await api.post<ApiResponse<any>>(`/visitor-security/campus-vehicles/${vehicleLogId}/exit`);
    return res.data.data!;
  },

  getVisitorPass: async (passTokenOrNumber: string): Promise<any> => {
    const res = await api.get<ApiResponse<any>>(`/visitor-security/passes/${passTokenOrNumber}`);
    return res.data.data!;
  },

  getVisitorHistory: async (params?: { search?: string; type?: string; date?: string }): Promise<any[]> => {
    const res = await api.get<ApiResponse<any[]>>('/visitor-security/visitors/history', { params });
    return res.data.data || [];
  },
};
