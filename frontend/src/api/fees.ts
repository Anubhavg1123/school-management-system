import { apiClient } from './client';

export const feesApi = {
  // Categories
  getCategories: async () => {
    const res = await apiClient.get('/fees/categories');
    return res.data;
  },
  createCategory: async (data: { code: string; name: string; description?: string }) => {
    const res = await apiClient.post('/fees/categories', data);
    return res.data;
  },

  // Structures
  getStructures: async (params?: { academicYearId?: string; classId?: string; departmentId?: string }) => {
    const res = await apiClient.get('/fees/structures', { params });
    return res.data;
  },
  getStructureById: async (id: string) => {
    const res = await apiClient.get(`/fees/structures/${id}`);
    return res.data;
  },
  createStructure: async (data: {
    code: string;
    name: string;
    academicYearId: string;
    classId?: string;
    departmentId?: string;
    description?: string;
    items: Array<{
      feeCategoryId: string;
      amount: number;
      isOptional?: boolean;
      dueDate?: string;
      installmentCount?: number;
    }>;
  }) => {
    const res = await apiClient.post('/fees/structures', data);
    return res.data;
  },

  // Assignments
  assignFee: async (data: {
    studentId: string;
    feeStructureId: string;
    academicYearId?: string;
    notes?: string;
    customInstallments?: number;
  }) => {
    const res = await apiClient.post('/fees/assign', data);
    return res.data;
  },
  getAssignments: async (params?: {
    studentId?: string;
    academicYearId?: string;
    status?: string;
    classId?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await apiClient.get('/fees/assignments', { params });
    return res.data;
  },

  // Discounts & Scholarships
  applyDiscount: async (data: {
    feeAssignmentId: string;
    type: string;
    amount?: number;
    percentage?: number;
    reason: string;
  }) => {
    const res = await apiClient.post('/fees/discount', data);
    return res.data;
  },

  // Payments & Receipts
  collectPayment: async (data: {
    studentId: string;
    feeAssignmentId: string;
    amount: number;
    paymentMethod: string;
    transactionReference?: string;
    notes?: string;
  }) => {
    const res = await apiClient.post('/fees/pay', data);
    return res.data;
  },

  // Refunds
  processRefund: async (data: {
    paymentId: string;
    amount: number;
    reason: string;
  }) => {
    const res = await apiClient.post('/fees/refund', data);
    return res.data;
  },

  // Student Financial Profile
  getStudentProfile: async (studentId: string) => {
    const res = await apiClient.get(`/fees/student/${studentId}`);
    return res.data;
  },

  // Financial Dashboard
  getDashboard: async () => {
    const res = await apiClient.get('/fees/dashboard');
    return res.data;
  },

  // Outstanding Reports
  getOutstandingReport: async (params?: {
    classId?: string;
    departmentId?: string;
    status?: string;
    page?: number;
    limit?: number;
    format?: string;
  }) => {
    const res = await apiClient.get('/fees/reports/outstanding', { params });
    return res.data;
  },

  downloadOutstandingCsvUrl: (params?: Record<string, string>) => {
    const query = new URLSearchParams({ ...params, format: 'csv' }).toString();
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${baseURL}/fees/reports/outstanding?${query}`;
  },
};
