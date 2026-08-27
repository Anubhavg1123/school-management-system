import { apiClient as api } from './client';
import { ApiResponse } from '../types';

export interface HodDashboardData {
  department: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  academicYear: string;
  metrics: {
    totalFaculty: number;
    activeFaculty: number;
    facultyOnLeaveCount: number;
    totalStudents: number;
    activeClassesCount: number;
    totalSections: number;
    totalSubjectsCount: number;
    todayClassesCount: number;
    pendingLeavesCount: number;
    pendingCorrectionsCount: number;
    pendingExtraClassesCount: number;
    lowAttendanceStudentCount: number;
  };
  facultyOnLeaveToday: Array<{
    leaveId: string;
    facultyName: string;
    leaveType: string;
  }>;
  todaySchedule: Array<{
    id: string;
    className: string;
    sectionName: string;
    subjectName: string;
    facultyName: string;
    room: string;
    period: string;
    startTime: string;
    endTime: string;
  }>;
  pendingApprovals: {
    leaves: any[];
    corrections: any[];
    extraClasses: any[];
  };
  recentNotices: any[];
}

export interface DepartmentFacultyMember {
  id: string;
  userId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  whatsAppNumber?: string;
  designation: string;
  status: string;
  isHod: boolean;
  isCoordinator: boolean;
  coordinatorSection?: string | null;
  assignedSubjectsCount: number;
  assignedSubjects: Array<{
    subjectName: string;
    subjectCode: string;
    className: string;
    sectionName: string;
  }>;
}

export interface DepartmentStudentItem {
  id: string;
  userId: string;
  admissionNumber: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  className: string;
  sectionName: string;
  attendancePercentage: number;
  isLowAttendance: boolean;
  status: string;
}

export interface FacultyWorkloadItem {
  facultyId: string;
  employeeCode: string;
  facultyName: string;
  designation: string;
  assignedCoursesCount: number;
  weeklyPeriodCount: number;
  approvedExtraClassesCount: number;
  substituteLecturesCount: number;
  isCoordinator: boolean;
  coordinatorSection?: string | null;
  workloadStatus: 'UNDER_UTILIZED' | 'BALANCED' | 'HIGH_WORKLOAD';
}

export const hodPortalApi = {
  // 1. Dashboard & Department Profile
  getDashboard: async (departmentId?: string): Promise<HodDashboardData> => {
    const res = await api.get<ApiResponse<HodDashboardData>>('/hod/dashboard', { params: { departmentId } });
    return res.data.data!;
  },

  getDepartmentProfile: async (departmentId?: string): Promise<any> => {
    const res = await api.get<ApiResponse<any>>('/hod/department', { params: { departmentId } });
    return res.data.data!;
  },

  updateDepartmentProfile: async (payload: { description?: string; status?: string }, departmentId?: string): Promise<any> => {
    const res = await api.put<ApiResponse<any>>('/hod/department', payload, { params: { departmentId } });
    return res.data.data!;
  },

  // 2. Faculty Management & Workload
  getFaculty: async (params?: { search?: string; status?: string; page?: number; limit?: number; departmentId?: string }): Promise<{ faculty: DepartmentFacultyMember[]; meta: any }> => {
    const res = await api.get<ApiResponse<{ faculty: DepartmentFacultyMember[]; meta: any }>>('/hod/faculty', { params });
    return res.data.data || { faculty: [], meta: {} };
  },

  getFacultyProfile: async (facultyId: string, departmentId?: string): Promise<any> => {
    const res = await api.get<ApiResponse<any>>(`/hod/faculty/${facultyId}`, { params: { departmentId } });
    return res.data.data!;
  },

  assignFacultySubject: async (payload: { facultyId: string; classId: string; sectionId?: string; subjectId: string }, departmentId?: string): Promise<any> => {
    const res = await api.post<ApiResponse<any>>('/hod/faculty-assignments', payload, { params: { departmentId } });
    return res.data.data!;
  },

  getFacultyWorkload: async (departmentId?: string): Promise<FacultyWorkloadItem[]> => {
    const res = await api.get<ApiResponse<FacultyWorkloadItem[]>>('/hod/workload', { params: { departmentId } });
    return res.data.data || [];
  },

  // 3. Classes & Coordinators
  getClasses: async (departmentId?: string): Promise<any[]> => {
    const res = await api.get<ApiResponse<any[]>>('/hod/classes', { params: { departmentId } });
    return res.data.data || [];
  },

  assignClassCoordinator: async (sectionId: string, facultyId: string, departmentId?: string): Promise<any> => {
    const res = await api.post<ApiResponse<any>>(`/hod/sections/${sectionId}/coordinator`, { facultyId }, { params: { departmentId } });
    return res.data.data!;
  },

  // 4. Students & Low Attendance
  getStudents: async (params?: { search?: string; classId?: string; sectionId?: string; page?: number; limit?: number; departmentId?: string }): Promise<{ students: DepartmentStudentItem[]; meta: any }> => {
    const res = await api.get<ApiResponse<{ students: DepartmentStudentItem[]; meta: any }>>('/hod/students', { params });
    return res.data.data || { students: [], meta: {} };
  },

  getLowAttendance: async (departmentId?: string): Promise<any[]> => {
    const res = await api.get<ApiResponse<any[]>>('/hod/low-attendance', { params: { departmentId } });
    return res.data.data || [];
  },

  // 5. Approvals (Corrections, Bypasses, Leaves, Extra Classes)
  getCorrections: async (departmentId?: string): Promise<any[]> => {
    const res = await api.get<ApiResponse<any[]>>('/hod/corrections', { params: { departmentId } });
    return res.data.data || [];
  },

  reviewCorrection: async (id: string, action: 'APPROVED' | 'REJECTED', reviewNotes?: string, departmentId?: string): Promise<any> => {
    const res = await api.post<ApiResponse<any>>(`/hod/corrections/${id}/review`, { action, reviewNotes }, { params: { departmentId } });
    return res.data.data!;
  },

  getBypasses: async (departmentId?: string): Promise<any[]> => {
    const res = await api.get<ApiResponse<any[]>>('/hod/bypasses', { params: { departmentId } });
    return res.data.data || [];
  },

  reviewBypass: async (id: string, action: 'APPROVED' | 'REJECTED', reviewNotes?: string, departmentId?: string): Promise<any> => {
    const res = await api.post<ApiResponse<any>>(`/hod/bypasses/${id}/review`, { action, reviewNotes }, { params: { departmentId } });
    return res.data.data!;
  },

  getLeaves: async (departmentId?: string): Promise<any[]> => {
    const res = await api.get<ApiResponse<any[]>>('/hod/leaves', { params: { departmentId } });
    return res.data.data || [];
  },

  reviewFacultyLeave: async (id: string, action: 'APPROVED' | 'REJECTED', reviewNotes?: string, departmentId?: string): Promise<any> => {
    const res = await api.post<ApiResponse<any>>(`/hod/leaves/${id}/review`, { action, reviewNotes }, { params: { departmentId } });
    return res.data.data!;
  },

  assignSubstitute: async (payload: { originalFacultyId: string; substituteFacultyId: string; classId: string; sectionId: string; subjectId: string; timeSlotId: string; date: string; reason: string }, departmentId?: string): Promise<any> => {
    const res = await api.post<ApiResponse<any>>('/hod/substitutes', payload, { params: { departmentId } });
    return res.data.data!;
  },

  getExtraClasses: async (departmentId?: string): Promise<any[]> => {
    const res = await api.get<ApiResponse<any[]>>('/hod/extra-classes', { params: { departmentId } });
    return res.data.data || [];
  },

  reviewExtraClass: async (id: string, action: 'APPROVED' | 'REJECTED', reviewNotes?: string, departmentId?: string): Promise<any> => {
    const res = await api.post<ApiResponse<any>>(`/hod/extra-classes/${id}/review`, { action, reviewNotes }, { params: { departmentId } });
    return res.data.data!;
  },

  // 6. Timetable Engine & WhatsApp Config
  getTimetable: async (departmentId?: string): Promise<any[]> => {
    const res = await api.get<ApiResponse<any[]>>('/hod/timetable', { params: { departmentId } });
    return res.data.data || [];
  },

  createTimetableEntry: async (payload: any, departmentId?: string): Promise<any> => {
    const res = await api.post<ApiResponse<any>>('/hod/timetable', payload, { params: { departmentId } });
    return res.data.data!;
  },

  updateWhatsAppConfig: async (sectionId: string, payload: { whatsAppGroupId?: string; whatsAppGroupStatus?: string }, departmentId?: string): Promise<any> => {
    const res = await api.post<ApiResponse<any>>(`/hod/sections/${sectionId}/whatsapp`, payload, { params: { departmentId } });
    return res.data.data!;
  },

  // 7. Department Notices & Reports
  getNotices: async (departmentId?: string): Promise<any[]> => {
    const res = await api.get<ApiResponse<any[]>>('/hod/notices', { params: { departmentId } });
    return res.data.data || [];
  },

  createNotice: async (payload: { title: string; content: string; targetScope?: string; classId?: string; sectionId?: string }, departmentId?: string): Promise<any> => {
    const res = await api.post<ApiResponse<any>>('/hod/notices', payload, { params: { departmentId } });
    return res.data.data!;
  },

  getReport: async (type: 'FACULTY' | 'STUDENTS' | 'TIMETABLE' | 'ATTENDANCE', departmentId?: string): Promise<any> => {
    const res = await api.get<ApiResponse<any>>('/hod/reports', { params: { type, departmentId } });
    return res.data.data!;
  },
};
