import { apiClient as api } from './client';
import {
  ApiResponse,
  AttendanceSlot,
  StudentAttendanceRosterItem,
  StudentAttendanceCorrection,
  AcademicBypassRequest,
  AttendanceAnomaly,
} from '../types';

export const studentAttendanceApi = {
  generateSlots: async (date?: string, academicYearId?: string) => {
    const res = await api.post<ApiResponse<{ date: string; dayOfWeek: string; generatedCount: number; slots: AttendanceSlot[] }>>(
      '/student-attendance/generate-slots',
      { date, academicYearId }
    );
    return res.data;
  },

  getSlots: async (filters?: {
    date?: string;
    classId?: string;
    sectionId?: string;
    facultyId?: string;
    departmentId?: string;
    academicYearId?: string;
    status?: string;
  }) => {
    const res = await api.get<ApiResponse<AttendanceSlot[]>>('/student-attendance/slots', {
      params: filters,
    });
    return res.data;
  },

  getSlotDetails: async (slotId: string) => {
    const res = await api.get<
      ApiResponse<{
        slot: AttendanceSlot;
        totalStudents: number;
        isFinalized: boolean;
        isSubmitted: boolean;
        roster: StudentAttendanceRosterItem[];
      }>
    >(`/student-attendance/slots/${slotId}`);
    return res.data;
  },

  submitAttendance: async (payload: {
    slotId: string;
    studentRecords: Array<{ studentId: string; status: string; remarks?: string }>;
    isFinalize?: boolean;
  }) => {
    const res = await api.post<ApiResponse<{ message: string; result: { slotStatus: string; savedCount: number; absentCount: number } }>>(
      '/student-attendance/submit',
      payload
    );
    return res.data;
  },

  requestCorrection: async (payload: {
    studentAttendanceId: string;
    proposedStatus: string;
    reason: string;
  }) => {
    const res = await api.post<ApiResponse<StudentAttendanceCorrection>>(
      '/student-attendance/corrections',
      payload
    );
    return res.data;
  },

  reviewCorrection: async (id: string, payload: { action: 'APPROVED' | 'REJECTED'; reviewNotes?: string }) => {
    const res = await api.post<ApiResponse<StudentAttendanceCorrection>>(
      `/student-attendance/corrections/${id}/review`,
      payload
    );
    return res.data;
  },

  applyBypass: async (payload: {
    studentId: string;
    attendanceSlotId?: string;
    date: string;
    activityType: string;
    reason: string;
  }) => {
    const res = await api.post<ApiResponse<any>>(
      '/student-attendance/bypass',
      payload
    );
    return res.data;
  },

  requestBypass: async (payload: {
    studentId: string;
    attendanceSlotId?: string;
    date: string;
    activityName: string;
    reason: string;
  }) => {
    const res = await api.post<ApiResponse<AcademicBypassRequest>>(
      '/student-attendance/bypass',
      payload
    );
    return res.data;
  },

  reviewBypass: async (id: string, payload: { action: 'APPROVED' | 'REJECTED' }) => {
    const res = await api.post<ApiResponse<AcademicBypassRequest>>(
      `/student-attendance/bypass/${id}/review`,
      payload
    );
    return res.data;
  },

  getStudentHistory: async (studentId: string, academicYearId?: string) => {
    const res = await api.get<
      ApiResponse<{
        student: any;
        stats: {
          totalSessions: number;
          presentCount: number;
          lateCount: number;
          excusedCount: number;
          academicBypassCount: number;
          absentCount: number;
          overallPercentage: number;
          minimumThreshold: number;
          isLowAttendance: boolean;
        };
        subjectBreakdown: Array<{
          subject: any;
          total: number;
          present: number;
          percentage: number;
          isLow: boolean;
        }>;
        records: any[];
      }>
    >(`/student-attendance/student/${studentId}`, { params: { academicYearId } });
    return res.data;
  },

  getDailySummary: async (filters?: { date?: string; departmentId?: string; role?: string }) => {
    const res = await api.get<ApiResponse<any>>('/student-attendance/daily-summary', {
      params: filters,
    });
    return res.data;
  },

  getAnomalies: async (filters?: { type?: string; limit?: number }) => {
    const res = await api.get<ApiResponse<AttendanceAnomaly[]>>('/student-attendance/anomalies', {
      params: filters,
    });
    return res.data;
  },
};
