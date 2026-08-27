import { apiClient as api } from './client';

export const createExam = async (payload: any) => {
  const response = await api.post('/examinations', payload);
  return response.data;
};

export const scheduleExamSubject = async (payload: any) => {
  const response = await api.post('/examinations/schedule-subject', payload);
  return response.data;
};

export const resolveExamEligibility = async (examinationId: string) => {
  const response = await api.post(`/examinations/${examinationId}/resolve-eligibility`);
  return response.data;
};

export const recordExamAttendance = async (payload: { examinationSubjectId: string; attendances: any[] }) => {
  const response = await api.post('/examinations/attendance', payload);
  return response.data;
};

export const updateExamStatus = async (examinationId: string, status: string) => {
  const response = await api.patch(`/examinations/${examinationId}/status`, { status });
  return response.data;
};
