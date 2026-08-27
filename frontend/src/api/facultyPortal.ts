import { apiClient as api } from './client';

export interface FacultyProfile {
  facultyId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  whatsAppNumber?: string;
  altPhone?: string;
  address?: string;
  dob?: string;
  gender?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  department: string;
  departmentCode: string;
  designation: string;
  joiningDate?: string;
  isHod: boolean;
  status: string;
  coordinatorSection?: string | null;
  assignedSubjects: Array<{
    id: string;
    className: string;
    sectionName: string;
    subjectName: string;
    subjectCode: string;
  }>;
}

export interface DashboardData {
  faculty: {
    id: string;
    userId: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    department: string;
    departmentCode: string;
    designation: string;
    isHod: boolean;
    isCoordinator: boolean;
    coordinatedSection?: { sectionId: string; sectionName: string; className: string } | null;
  };
  today: {
    date: string;
    dayOfWeek: string;
    checkInStatus?: { status: string; checkInTime?: string; checkOutTime?: string; lateMinutes?: number } | null;
    classesCount: number;
    pendingAttendanceCount: number;
    completedAttendanceCount: number;
  };
  todayClasses: Array<{
    id: string;
    timeSlot: string;
    startTime: string;
    endTime: string;
    className: string;
    sectionName: string;
    subjectName: string;
    subjectCode: string;
    room: string;
    isSubstitute: boolean;
    attendanceStatus: string;
    slotId?: string | null;
  }>;
  todaySubstitutes: Array<{
    id: string;
    timeSlot: string;
    startTime: string;
    endTime: string;
    className: string;
    sectionName: string;
    subjectName: string;
    reason?: string;
  }>;
  assignedSubjectsCount: number;
  pendingLeavesCount: number;
  pendingCorrectionsCount: number;
  extraClassRequests: any[];
  recentNotifications: any[];
  classAnnouncements: any[];
}

export interface AssignedClass {
  id: string;
  classId: string;
  className: string;
  classCode: string;
  sectionId: string;
  sectionName: string;
  studentCount: number;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  academicYear: string;
  isCoordinator: boolean;
}

export interface AssignedStudent {
  id: string;
  userId: string;
  admissionNumber: string;
  enrollmentNumber?: string;
  rollNumber?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  className: string;
  sectionName: string;
  department: string;
  attendancePercentage: number;
  isLowAttendance: boolean;
  status: string;
}

export interface AssignmentItem {
  id: string;
  academicYearId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  title: string;
  description: string;
  issueDate: string;
  dueDate: string;
  status: string;
  class: { name: string };
  section: { name: string };
  subject: { name: string; code: string };
  attachments?: Array<{ id: string; title: string; fileUrl: string }>;
  _count?: { targets: number };
}

export interface FacultyLeave {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface ExtraClass {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: string;
  class: { name: string };
  section: { name: string };
  subject: { name: string };
  room: { roomNumber: string; name: string };
}

export interface FacultyVehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  makeModel?: string;
  color?: string;
  registrationDetails?: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface ClassAnnouncement {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  class: { name: string };
  section: { name: string };
}

export const facultyPortalApi = {
  getDashboard: async (): Promise<DashboardData> => {
    const res = await api.get('/faculty/dashboard');
    return res.data.data;
  },

  getProfile: async (): Promise<FacultyProfile> => {
    const res = await api.get('/faculty/profile');
    return res.data.data;
  },

  updateProfile: async (data: {
    phone?: string;
    whatsAppNumber?: string;
    altPhone?: string;
    address?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  }): Promise<FacultyProfile> => {
    const res = await api.put('/faculty/profile', data);
    return res.data.data;
  },

  getAssignedClasses: async (): Promise<{
    subjectAssignments: AssignedClass[];
    coordinatorSections: Array<{
      sectionId: string;
      sectionName: string;
      classId: string;
      className: string;
      studentCount: number;
      academicYear: string;
    }>;
  }> => {
    const res = await api.get('/faculty/classes');
    return res.data.data;
  },

  getAssignedStudents: async (sectionId: string): Promise<AssignedStudent[]> => {
    const res = await api.get(`/faculty/classes/${sectionId}/students`);
    return res.data.data;
  },

  getStudentProfile: async (studentId: string): Promise<any> => {
    const res = await api.get(`/faculty/students/${studentId}`);
    return res.data.data;
  },

  getTimetable: async (dayOfWeek?: string): Promise<{
    regularTimetable: any[];
    substituteClasses: any[];
  }> => {
    const res = await api.get('/faculty/timetable', { params: { dayOfWeek } });
    return res.data.data;
  },

  createAssignment: async (data: {
    classId: string;
    sectionId: string;
    subjectId: string;
    title: string;
    description: string;
    dueDate: string;
    attachments?: Array<{ title: string; fileUrl: string }>;
  }): Promise<AssignmentItem> => {
    const res = await api.post('/faculty/assignments', data);
    return res.data.data;
  },

  getAssignments: async (filters?: { status?: string; sectionId?: string }): Promise<AssignmentItem[]> => {
    const res = await api.get('/faculty/assignments', { params: filters });
    return res.data.data;
  },

  publishAssignment: async (id: string): Promise<AssignmentItem> => {
    const res = await api.post(`/faculty/assignments/${id}/publish`);
    return res.data.data;
  },

  requestLeave: async (data: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<FacultyLeave> => {
    const res = await api.post('/faculty/leave', data);
    return res.data.data;
  },

  getLeaves: async (): Promise<FacultyLeave[]> => {
    const res = await api.get('/faculty/leave');
    return res.data.data;
  },

  requestExtraClass: async (data: {
    classId: string;
    sectionId: string;
    subjectId: string;
    roomId: string;
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  }): Promise<ExtraClass> => {
    const res = await api.post('/faculty/extra-classes', data);
    return res.data.data;
  },

  getExtraClasses: async (): Promise<ExtraClass[]> => {
    const res = await api.get('/faculty/extra-classes');
    return res.data.data;
  },

  registerVehicle: async (data: {
    vehicleNumber: string;
    vehicleType: string;
    makeModel?: string;
    color?: string;
    registrationDetails?: string;
  }): Promise<FacultyVehicle> => {
    const res = await api.post('/faculty/vehicles', data);
    return res.data.data;
  },

  getVehicles: async (): Promise<FacultyVehicle[]> => {
    const res = await api.get('/faculty/vehicles');
    return res.data.data;
  },

  reviewVehicle: async (id: string, data: { action: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) => {
    const res = await api.post(`/faculty/vehicles/${id}/review`, data);
    return res.data.data;
  },

  createAnnouncement: async (data: {
    classId: string;
    sectionId: string;
    title: string;
    content: string;
    category?: string;
  }): Promise<ClassAnnouncement> => {
    const res = await api.post('/faculty/announcements', data);
    return res.data.data;
  },

  getAnnouncements: async (filters?: { sectionId?: string }): Promise<ClassAnnouncement[]> => {
    const res = await api.get('/faculty/announcements', { params: filters });
    return res.data.data;
  },

  getNotifications: async (): Promise<any[]> => {
    const res = await api.get('/faculty/notifications');
    return res.data.data;
  },

  markNotificationRead: async (id: string) => {
    const res = await api.post(`/faculty/notifications/${id}/read`);
    return res.data.data;
  },

  getWorkload: async () => {
    const res = await api.get('/faculty/workload');
    return res.data.data;
  },
};
