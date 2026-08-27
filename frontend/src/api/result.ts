import { apiClient as api } from './client';

export const calculateExamResults = async (examId: string) => {
  const response = await api.post(`/results/${examId}/calculate`);
  return response.data;
};

export const publishExamResults = async (examId: string) => {
  const response = await api.post(`/results/${examId}/publish`);
  return response.data;
};

export const getStudentResults = async (studentId: string) => {
  const response = await api.get(`/results/students/${studentId}`);
  return response.data;
};

export const verifyResultToken = async (token: string) => {
  const response = await api.get(`/results/verify-token/${token}`);
  return response.data;
};
