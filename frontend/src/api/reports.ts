import { apiClient } from './client';

export const reportsApi = {
  getStudentRoster: async (params?: {
    status?: string;
    classId?: string;
    sectionId?: string;
    departmentId?: string;
    academicYearId?: string;
    format?: string;
  }) => {
    const res = await apiClient.get('/reports/students/roster', { params });
    return res.data;
  },

  downloadRosterCsvUrl: (params?: Record<string, string>) => {
    const query = new URLSearchParams({ ...params, format: 'csv' }).toString();
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${baseURL}/reports/students/roster?${query}`;
  },

  getClassWiseReport: async (academicYearId?: string) => {
    const res = await apiClient.get('/reports/classes', { params: { academicYearId } });
    return res.data;
  },

  getDepartmentWiseReport: async () => {
    const res = await apiClient.get('/reports/departments');
    return res.data;
  },

  getTransfersReport: async (limit = 100) => {
    const res = await apiClient.get('/reports/transfers', { params: { limit } });
    return res.data;
  },

  getAdmissionsReport: async () => {
    const res = await apiClient.get('/reports/admissions');
    return res.data;
  },

  // ===== PHASE 15 EXTENDED REPORTS =====

  getAttendanceReport: async (params?: {
    classId?: string;
    sectionId?: string;
    academicYearId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const res = await apiClient.get('/reports/attendance', { params });
    return res.data;
  },

  getFinanceReport: async (params?: {
    academicYearId?: string;
    classId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const res = await apiClient.get('/reports/finance', { params });
    return res.data;
  },

  getExaminationReport: async (params?: {
    academicYearId?: string;
    classId?: string;
  }) => {
    const res = await apiClient.get('/reports/examinations', { params });
    return res.data;
  },

  getStaffReport: async () => {
    const res = await apiClient.get('/reports/staff');
    return res.data;
  },

  getVisitorReport: async (params?: {
    startDate?: string;
    endDate?: string;
    purpose?: string;
  }) => {
    const res = await apiClient.get('/reports/visitors', { params });
    return res.data;
  },

  getAuditReport: async (params?: {
    entityType?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) => {
    const res = await apiClient.get('/reports/audit', { params });
    return res.data;
  },

  downloadReportCsvUrl: (reportType: string, params?: Record<string, string>) => {
    const query = new URLSearchParams({ ...params, format: 'csv' }).toString();
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${baseURL}/reports/${reportType}?${query}`;
  },
};
