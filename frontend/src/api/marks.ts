import { apiClient as api } from './client';

export const submitStudentMarksBatch = async (payload: { examinationSubjectId: string; marks: any[]; isDraft?: boolean }) => {
  const response = await api.post('/marks/submit-batch', payload);
  return response.data;
};

export const verifySubjectMarks = async (subjectId: string, action: 'VERIFIED' | 'RETURNED_FOR_CORRECTION', reason?: string) => {
  const response = await api.post(`/marks/verify/${subjectId}`, { action, reason });
  return response.data;
};

export const requestMarksCorrection = async (payload: { studentMarksId: string; requestedMarks: number; reason: string }) => {
  const response = await api.post('/marks/corrections/request', payload);
  return response.data;
};

export const reviewMarksCorrection = async (requestId: string, action: 'APPROVED' | 'REJECTED') => {
  const response = await api.post(`/marks/corrections/${requestId}/review`, { action });
  return response.data;
};
