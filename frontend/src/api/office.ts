import { apiClient as api } from './client';

export const getOfficeDashboard = async () => {
  const response = await api.get('/office/dashboard');
  return response.data.data;
};

export const createStudentMaster = async (payload: {
  firstName: string;
  lastName: string;
  email: string;
  guardianName: string;
  guardianRelationship: string;
  guardianWhatsAppNumber: string;
  sectionId: string;
  admissionNumber?: string;
  enrollmentNumber?: string;
}) => {
  const response = await api.post('/office/students/master', payload);
  return response.data.data;
};

export const updateStudentStatus = async (studentId: string, payload: { status: string; reason: string }) => {
  const response = await api.patch(`/office/students/${studentId}/status`, payload);
  return response.data.data;
};

export const recordFeePayment = async (payload: {
  studentId: string;
  studentFeeAssignmentId: string;
  amount: number;
  paymentMethod: string;
  transactionRef?: string;
}) => {
  const response = await api.post('/office/finance/payment', payload);
  return response.data.data;
};
