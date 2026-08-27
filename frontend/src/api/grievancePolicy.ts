import apiClient from './client';

export interface Grievance {
  id: string;
  trackingNumber: string;
  category: string;
  privacyLevel: string;
  title: string;
  description: string;
  submittedByUserId: string;
  isAnonymous: boolean;
  assignedToUserId?: string;
  status: string;
  resolutionNotes?: string;
  createdAt: string;
  submittedByUser?: { id: string; firstName: string; lastName: string; email: string };
  assignedToUser?: { id: string; firstName: string; lastName: string; email: string };
}

export interface InstitutionalPolicy {
  id: string;
  policyCode: string;
  title: string;
  category: string;
  version: number;
  effectiveDate: string;
  reviewDate?: string;
  content: string;
  status: string;
  acknowledgements?: Array<{ userId: string; acknowledgedAt: string }>;
}

export interface ComplianceItem {
  id: string;
  category: string;
  title: string;
  description?: string;
  frequency: string;
  dueDate: string;
  status: string;
  isOverdue?: boolean;
  verifiedAt?: string;
}

export const grievancePolicyApi = {
  getGrievances: async () => {
    const res = await apiClient.get('/grievances');
    return res.data.data.grievances as Grievance[];
  },
  submitGrievance: async (data: Partial<Grievance>) => {
    const res = await apiClient.post('/grievances', data);
    return res.data.data as Grievance;
  },
  updateGrievanceStatus: async (id: string, data: { status: string; resolutionNotes?: string; assignedToUserId?: string }) => {
    const res = await apiClient.patch(`/grievances/${id}/status`, data);
    return res.data.data;
  },
  submitFeedback: async (data: { targetType: string; targetId?: string; rating: number; comments?: string }) => {
    const res = await apiClient.post('/grievances/feedback', data);
    return res.data.data;
  },
  getFeedbackMetrics: async (targetType?: string) => {
    const res = await apiClient.get('/grievances/feedback/metrics', { params: { targetType } });
    return res.data.data;
  },
  getPolicies: async (category?: string) => {
    const res = await apiClient.get('/grievances/policies', { params: { category } });
    return res.data.data.policies as InstitutionalPolicy[];
  },
  publishPolicy: async (data: Partial<InstitutionalPolicy>) => {
    const res = await apiClient.post('/grievances/policies', data);
    return res.data.data as InstitutionalPolicy;
  },
  acknowledgePolicy: async (policyId: string) => {
    const res = await apiClient.post(`/grievances/policies/${policyId}/acknowledge`);
    return res.data.data;
  },
  getComplianceChecklist: async () => {
    const res = await apiClient.get('/grievances/compliance');
    return res.data.data.checklist as ComplianceItem[];
  },
  createComplianceItem: async (data: Partial<ComplianceItem>) => {
    const res = await apiClient.post('/grievances/compliance', data);
    return res.data.data;
  },
  verifyComplianceItem: async (id: string) => {
    const res = await apiClient.patch(`/grievances/compliance/${id}/verify`);
    return res.data.data;
  },
};
