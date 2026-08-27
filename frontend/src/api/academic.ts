import { apiClient } from './client';

export const academicApi = {
  // 1. Departments & HOD
  getDepartments: async () => {
    const res = await apiClient.get('/academic/departments');
    return res.data;
  },
  getDepartmentById: async (id: string) => {
    const res = await apiClient.get(`/academic/departments/${id}`);
    return res.data;
  },
  createDepartment: async (data: { code: string; name: string; description?: string; hodUserId?: string }) => {
    const res = await apiClient.post('/academic/departments', data);
    return res.data;
  },
  updateDepartment: async (id: string, data: any) => {
    const res = await apiClient.put(`/academic/departments/${id}`, data);
    return res.data;
  },
  assignDepartmentHod: async (departmentId: string, data: { hodUserId: string; reason: string }) => {
    const res = await apiClient.post(`/academic/departments/${departmentId}/assign-hod`, data);
    return res.data;
  },

  // 2. Academic Years
  getYears: async () => {
    const res = await apiClient.get('/academic/years');
    return res.data;
  },
  createYear: async (data: { name: string; startDate: string; endDate: string; isCurrent?: boolean }) => {
    const res = await apiClient.post('/academic/years', data);
    return res.data;
  },
  setYearStatus: async (id: string, isCurrent: boolean) => {
    const res = await apiClient.patch(`/academic/years/${id}/status`, { isCurrent });
    return res.data;
  },

  // 3. Classes & Sections & Coordinators
  getClasses: async (departmentId?: string, academicYearId?: string) => {
    const res = await apiClient.get('/academic/classes', { params: { departmentId, academicYearId } });
    return res.data;
  },
  createClass: async (data: { name: string; code: string; departmentId?: string; academicYearId: string }) => {
    const res = await apiClient.post('/academic/classes', data);
    return res.data;
  },
  getSections: async (classId?: string) => {
    const res = await apiClient.get('/academic/sections', { params: { classId } });
    return res.data;
  },
  createSection: async (data: { classId: string; name: string; capacity?: number; coordinatorFacultyId?: string }) => {
    const res = await apiClient.post('/academic/sections', data);
    return res.data;
  },
  assignClassCoordinator: async (sectionId: string, data: { facultyId: string; academicYearId: string; reason: string }) => {
    const res = await apiClient.post(`/academic/sections/${sectionId}/assign-coordinator`, data);
    return res.data;
  },
  unassignClassCoordinator: async (sectionId: string, reason?: string) => {
    const res = await apiClient.post(`/academic/sections/${sectionId}/unassign-coordinator`, { reason });
    return res.data;
  },
  getCoordinatorHistory: async (sectionId: string) => {
    const res = await apiClient.get(`/academic/sections/${sectionId}/coordinator-history`);
    return res.data;
  },

  // 4. Subjects & Class Subjects
  getSubjects: async (departmentId?: string) => {
    const res = await apiClient.get('/academic/subjects', { params: { departmentId } });
    return res.data;
  },
  createSubject: async (data: {
    code: string;
    name: string;
    type?: string;
    credits?: number;
    departmentId?: string;
    description?: string;
  }) => {
    const res = await apiClient.post('/academic/subjects', data);
    return res.data;
  },
  updateSubject: async (id: string, data: any) => {
    const res = await apiClient.put(`/academic/subjects/${id}`, data);
    return res.data;
  },
  assignClassSubjects: async (classId: string, data: { academicYearId: string; subjectIds: string[] }) => {
    const res = await apiClient.post(`/academic/classes/${classId}/subjects`, data);
    return res.data;
  },
  getClassSubjects: async (classId: string, academicYearId?: string) => {
    const res = await apiClient.get(`/academic/classes/${classId}/subjects`, { params: { academicYearId } });
    return res.data;
  },

  // 5. Faculty Subject Assignments
  assignFacultySubject: async (data: {
    academicYearId: string;
    facultyId: string;
    classId: string;
    sectionId?: string;
    subjectId: string;
  }) => {
    const res = await apiClient.post('/academic/faculty/assign-subject', data);
    return res.data;
  },
  getFacultyAssignments: async (params?: {
    academicYearId?: string;
    facultyId?: string;
    departmentId?: string;
    classId?: string;
  }) => {
    const res = await apiClient.get('/academic/faculty/assignments', { params });
    return res.data;
  },
  deleteFacultyAssignment: async (id: string) => {
    const res = await apiClient.delete(`/academic/faculty/assignments/${id}`);
    return res.data;
  },

  // 6. Rooms & Time Slots
  getRooms: async (type?: string, status?: string) => {
    const res = await apiClient.get('/academic/rooms', { params: { type, status } });
    return res.data;
  },
  createRoom: async (data: {
    roomNumber: string;
    name: string;
    building: string;
    floor?: number;
    capacity?: number;
    type?: string;
    equipment?: string;
  }) => {
    const res = await apiClient.post('/academic/rooms', data);
    return res.data;
  },
  updateRoom: async (id: string, data: any) => {
    const res = await apiClient.put(`/academic/rooms/${id}`, data);
    return res.data;
  },
  getTimeSlots: async (academicYearId: string, dayOfWeek?: string) => {
    const res = await apiClient.get('/academic/time-slots', { params: { academicYearId, dayOfWeek } });
    return res.data;
  },
  createTimeSlot: async (data: {
    academicYearId: string;
    dayOfWeek: string;
    periodNumber: number;
    name: string;
    startTime: string;
    endTime: string;
    isBreak?: boolean;
  }) => {
    const res = await apiClient.post('/academic/time-slots', data);
    return res.data;
  },
  generateDefaultTimeSlots: async (academicYearId: string, days?: string[]) => {
    const res = await apiClient.post('/academic/time-slots/generate-defaults', { academicYearId, days });
    return res.data;
  },

  // 7. Faculty Availability
  getFacultyAvailability: async (facultyId: string, academicYearId: string) => {
    const res = await apiClient.get(`/academic/faculty/${facultyId}/availability`, { params: { academicYearId } });
    return res.data;
  },
  setFacultyAvailability: async (data: {
    facultyId: string;
    academicYearId: string;
    dayOfWeek: string;
    timeSlotId?: string;
    startTime?: string;
    endTime?: string;
    isAvailable: boolean;
    reason?: string;
  }) => {
    const res = await apiClient.post('/academic/faculty/availability', data);
    return res.data;
  },

  // 8. Timetable
  getTimetable: async (params: {
    academicYearId: string;
    departmentId?: string;
    classId?: string;
    sectionId?: string;
    facultyId?: string;
    roomId?: string;
    dayOfWeek?: string;
  }) => {
    const res = await apiClient.get('/academic/timetable', { params });
    return res.data;
  },
  createTimetableEntry: async (data: {
    academicYearId: string;
    departmentId?: string;
    classId: string;
    sectionId: string;
    subjectId?: string;
    facultyId?: string;
    roomId?: string;
    timeSlotId: string;
    dayOfWeek: string;
  }) => {
    const res = await apiClient.post('/academic/timetable', data);
    return res.data;
  },
  generateTimetableGrid: async (data: {
    academicYearId: string;
    classId: string;
    sectionId: string;
    days?: string[];
    periods?: Array<{ periodNumber: number; name: string; startTime: string; endTime: string; isBreak?: boolean }>;
    forceRegenerate?: boolean;
  }) => {
    const res = await apiClient.post('/academic/timetable/generate-grid', data);
    return res.data;
  },
  updateTimetableEntry: async (id: string, data: any) => {
    const res = await apiClient.put(`/academic/timetable/${id}`, data);
    return res.data;
  },
  deleteTimetableEntry: async (id: string) => {
    const res = await apiClient.delete(`/academic/timetable/${id}`);
    return res.data;
  },
  checkTimetableConflicts: async (data: any) => {
    const res = await apiClient.post('/academic/timetable/conflicts/check', data);
    return res.data;
  },

  // 9. Extra Classes
  requestExtraClass: async (data: {
    academicYearId: string;
    classId: string;
    sectionId: string;
    subjectId: string;
    facultyId: string;
    roomId: string;
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  }) => {
    const res = await apiClient.post('/academic/extra-classes', data);
    return res.data;
  },
  getExtraClasses: async (params?: {
    academicYearId?: string;
    departmentId?: string;
    status?: string;
    facultyId?: string;
  }) => {
    const res = await apiClient.get('/academic/extra-classes', { params });
    return res.data;
  },
  reviewExtraClass: async (id: string, data: { action: 'APPROVED' | 'REJECTED'; reviewNotes?: string }) => {
    const res = await apiClient.post(`/academic/extra-classes/${id}/review`, data);
    return res.data;
  },

  // 10. Substitute Faculty
  assignSubstitute: async (data: {
    timetableEntryId?: string;
    originalFacultyId: string;
    substituteFacultyId: string;
    date: string;
    classId: string;
    sectionId: string;
    subjectId: string;
    timeSlotId: string;
    roomId?: string;
    reason: string;
  }) => {
    const res = await apiClient.post('/academic/substitute-faculty', data);
    return res.data;
  },
  getSubstitutes: async (params?: { date?: string; classId?: string; facultyId?: string }) => {
    const res = await apiClient.get('/academic/substitute-faculty', { params });
    return res.data;
  },

  // 11. Dashboards
  getHodDashboard: async (departmentId?: string, academicYearId?: string) => {
    const url = departmentId ? `/academic/dashboard/hod/${departmentId}` : '/academic/dashboard/hod';
    const res = await apiClient.get(url, { params: { academicYearId } });
    return res.data;
  },
  getFacultyAcademicDashboard: async (academicYearId?: string) => {
    const res = await apiClient.get('/academic/dashboard/faculty', { params: { academicYearId } });
    return res.data;
  },

  // 12. Students & Admissions (Retained from Phase 3)
  getStudents: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sectionId?: string;
    classId?: string;
    departmentId?: string;
    academicYearId?: string;
    status?: string;
  }) => {
    const res = await apiClient.get('/academic/students', { params });
    return res.data;
  },
  getStudentById: async (id: string) => {
    const res = await apiClient.get(`/academic/students/${id}`);
    return res.data;
  },
  admitStudent: async (data: any) => {
    const res = await apiClient.post('/academic/students/admit', data);
    return res.data;
  },
  transferStudent: async (
    id: string,
    data: {
      toSectionId: string;
      toClassId?: string;
      toDepartmentId?: string;
      toAcademicYearId?: string;
      transferType: string;
      reason: string;
    }
  ) => {
    const res = await apiClient.post(`/academic/students/${id}/transfer`, data);
    return res.data;
  },
  updateStudentStatus: async (id: string, data: { status: string; reason: string }) => {
    const res = await apiClient.patch(`/academic/students/${id}/status`, data);
    return res.data;
  },
  uploadStudentDocument: async (
    id: string,
    data: {
      docType: string;
      title: string;
      fileUrl: string;
      fileSize?: number;
      mimeType?: string;
    }
  ) => {
    const res = await apiClient.post(`/academic/students/${id}/documents`, data);
    return res.data;
  },
};
