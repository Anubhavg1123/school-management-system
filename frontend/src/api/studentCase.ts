import client from './client';

export interface StudentCase {
  id: string;
  studentId: string;
  caseNumber: string;
  caseType: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  title: string;
  description: string;
  status: 'CREATED' | 'ASSIGNED' | 'UNDER_REVIEW' | 'ACTION_REQUIRED' | 'RESOLVED' | 'CLOSED';
  assignedToUserId?: string;
  resolution?: string;
  createdById: string;
  createdAt: string;
  student?: {
    admissionNumber: string;
    user: { firstName: string; lastName: string; email: string };
    section?: { name: string; class: { name: string } };
  };
  assignedTo?: { firstName: string; lastName: string; email: string };
  createdBy?: { firstName: string; lastName: string; activeRole: string };
  actions?: Array<{
    id: string;
    actionType: string;
    note: string;
    createdAt: string;
    performedBy: { firstName: string; lastName: string; activeRole: string };
  }>;
}

export const studentCaseApi = {
  getCases: async (params?: { status?: string; caseType?: string; priority?: string }) => {
    const res = await client.get<{ data: { cases: StudentCase[]; total: number } }>('/cases', { params });
    return res.data;
  },

  getCaseById: async (id: string) => {
    const res = await client.get<{ data: StudentCase }>(`/cases/${id}`);
    return res.data;
  },

  createCase: async (data: {
    studentId: string;
    caseType?: string;
    priority?: string;
    title: string;
    description: string;
    assignedToUserId?: string;
  }) => {
    const res = await client.post<{ data: StudentCase }>('/cases', data);
    return res.data;
  },

  updateStatus: async (id: string, data: { status: string; assignedToUserId?: string; resolution?: string; note?: string }) => {
    const res = await client.patch<{ data: StudentCase }>(`/cases/${id}/status`, data);
    return res.data;
  },

  addAction: async (id: string, note: string, actionType?: string) => {
    const res = await client.post(`/cases/${id}/actions`, { note, actionType });
    return res.data;
  },

  getStats: async () => {
    const res = await client.get('/cases/stats');
    return res.data;
  },
};
