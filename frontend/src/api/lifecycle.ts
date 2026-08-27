import apiClient from './client';

export interface AlumniProfile {
  id: string;
  studentId: string;
  graduationYear: number;
  programName: string;
  currentCompany?: string;
  currentRole?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  student?: {
    user?: { firstName: string; lastName: string; email: string; phone?: string };
    department?: { name: string; code: string };
  };
}

export interface StudentExitChecklist {
  id: string;
  studentId: string;
  feeClearance: boolean;
  libraryClearance: boolean;
  assetClearance: boolean;
  documentClearance: boolean;
  idCardReturned: boolean;
  status: string;
  remarks?: string;
  exitDate?: string;
}

export interface StaffHandoverResponsibilities {
  classesCount: number;
  classes: any[];
  timetableEntriesCount: number;
  pendingMarksCount: number;
  pendingMarks: any[];
  assignedAssetsCount: number;
  assignedAssets: any[];
}

export const lifecycleApi = {
  updateStudentStatus: async (studentId: string, status: string, reason?: string) => {
    const res = await apiClient.patch(`/lifecycle/students/${studentId}/status`, { status, reason });
    return res.data.data;
  },
  processStudentExit: async (studentId: string, data: Partial<StudentExitChecklist>) => {
    const res = await apiClient.post(`/lifecycle/students/${studentId}/exit-checklist`, data);
    return res.data.data as StudentExitChecklist;
  },
  createAlumni: async (studentId: string, data: Partial<AlumniProfile>) => {
    const res = await apiClient.post(`/lifecycle/students/${studentId}/alumni`, data);
    return res.data.data as AlumniProfile;
  },
  getAlumni: async (year?: number) => {
    const res = await apiClient.get('/lifecycle/alumni', { params: { year } });
    return res.data.data.alumni as AlumniProfile[];
  },
  processStaffOnboarding: async (userId: string, data: any) => {
    const res = await apiClient.post(`/lifecycle/staff/${userId}/onboarding`, data);
    return res.data.data;
  },
  getStaffHandoverResponsibilities: async (userId: string) => {
    const res = await apiClient.get(`/lifecycle/staff/${userId}/handover-check`);
    return res.data.data as StaffHandoverResponsibilities;
  },
  processStaffExit: async (userId: string, data: any) => {
    const res = await apiClient.post(`/lifecycle/staff/${userId}/exit-handover`, data);
    return res.data.data;
  },
};
