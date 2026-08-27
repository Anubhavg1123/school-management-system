import { apiClient as api } from './client';

export const getStudentPerformanceTrend = async (studentId: string) => {
  const response = await api.get(`/academic-performance/students/${studentId}/trend`);
  return response.data;
};

export const getClassPerformance = async (classId: string, examinationId?: string) => {
  const response = await api.get(`/academic-performance/classes/${classId}`, {
    params: { examinationId },
  });
  return response.data;
};
