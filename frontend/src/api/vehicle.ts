import { apiClient as api } from './client';
import { ApiResponse } from '../types';

export interface VehicleItem {
  id: string;
  registrationNumber: string;
  vehicleType: string;
  makeModel?: string;
  color?: string;
  fuelType: string;
  capacity: number;
  ownerType: string;
  assignedDriverId?: string | null;
  insuranceNumber?: string;
  insuranceExpiry?: string;
  registrationExpiry?: string;
  fitnessExpiry?: string;
  permitExpiry?: string;
  status: string;
  assignedDriver?: {
    id: string;
    employeeCode: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
  } | null;
}

export const vehicleApi = {
  getVehicles: async (params?: { search?: string; type?: string; status?: string }): Promise<VehicleItem[]> => {
    const res = await api.get<ApiResponse<VehicleItem[]>>('/vehicles', { params });
    return res.data.data || [];
  },

  getVehicleById: async (id: string): Promise<any> => {
    const res = await api.get<ApiResponse<any>>(`/vehicles/${id}`);
    return res.data.data!;
  },

  createVehicle: async (payload: any): Promise<VehicleItem> => {
    const res = await api.post<ApiResponse<VehicleItem>>('/vehicles', payload);
    return res.data.data!;
  },

  updateVehicle: async (id: string, payload: any): Promise<VehicleItem> => {
    const res = await api.put<ApiResponse<VehicleItem>>(`/vehicles/${id}`, payload);
    return res.data.data!;
  },

  assignDriver: async (vehicleId: string, driverId: string, notes?: string): Promise<any> => {
    const res = await api.post<ApiResponse<any>>(`/vehicles/${vehicleId}/assignments`, { driverId, notes });
    return res.data.data!;
  },

  recordKmLog: async (payload: { vehicleId: string; date: string; startingKm: number; endingKm: number; purpose?: string; route?: string; remarks?: string }): Promise<any> => {
    const res = await api.post<ApiResponse<any>>('/vehicles/km-logs', payload);
    return res.data.data!;
  },

  recordFuel: async (payload: { vehicleId: string; date: string; fuelType: string; quantity: number; pricePerUnit: number; odometerReading: number; fuelStation?: string; receiptNumber?: string; remarks?: string }): Promise<any> => {
    const res = await api.post<ApiResponse<any>>('/vehicles/fuel', payload);
    return res.data.data!;
  },

  createMaintenance: async (payload: any): Promise<any> => {
    const res = await api.post<ApiResponse<any>>('/vehicles/maintenance', payload);
    return res.data.data!;
  },

  updateMaintenanceStatus: async (id: string, status: string, payload?: any): Promise<any> => {
    const res = await api.patch<ApiResponse<any>>(`/vehicles/maintenance/${id}`, { status, ...payload });
    return res.data.data!;
  },

  getFleetReports: async (): Promise<any> => {
    const res = await api.get<ApiResponse<any>>('/vehicles/reports');
    return res.data.data!;
  },
};
