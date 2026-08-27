import { apiClient as api } from './client';

export const getPendingApprovals = async () => {
  const response = await api.get('/approvals/pending');
  return response.data.data;
};

export const createApprovalRequest = async (payload: {
  requestType: string;
  entityType: string;
  entityId: string;
  reason?: string;
}) => {
  const response = await api.post('/approvals/request', payload);
  return response.data.data;
};

export const reviewApprovalRequest = async (requestId: string, payload: { action: 'APPROVED' | 'REJECTED' | 'RETURNED_FOR_CORRECTION'; reason?: string }) => {
  const response = await api.post(`/approvals/${requestId}/review`, payload);
  return response.data.data;
};
