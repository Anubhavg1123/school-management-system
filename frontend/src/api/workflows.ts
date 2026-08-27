import apiClient from './client';

export interface ApprovalDelegation {
  id: string;
  originalApproverUserId: string;
  delegateUserId: string;
  startDate: string;
  endDate: string;
  reason: string;
  scope: string;
  isActive: boolean;
  isCurrentlyEffective?: boolean;
  originalApprover?: { id: string; firstName: string; lastName: string; email: string };
  delegateUser?: { id: string; firstName: string; lastName: string; email: string };
  createdAt: string;
}

export interface WorkflowSlaConfig {
  id: string;
  workflowType: string;
  targetHours: number;
  reminderHours: number;
  escalateToRole?: string;
  escalateToUserId?: string;
  isActive: boolean;
}

export interface SlaStatusReport {
  summary: {
    totalPending: number;
    overdueCount: number;
    warningCount: number;
    onTrackCount: number;
  };
  items: Array<{
    id: string;
    workflow: string;
    item: string;
    createdAt: string;
    elapsedHours: number;
    targetHours: number;
    status: 'ON_TRACK' | 'WARNING' | 'OVERDUE';
  }>;
}

export const workflowApi = {
  getDelegations: async () => {
    const res = await apiClient.get('/workflows/delegations');
    return res.data.data.delegations as ApprovalDelegation[];
  },
  createDelegation: async (data: {
    delegateUserId: string;
    startDate: string;
    endDate: string;
    reason: string;
    scope?: string;
  }) => {
    const res = await apiClient.post('/workflows/delegations', data);
    return res.data.data as ApprovalDelegation;
  },
  revokeDelegation: async (id: string) => {
    const res = await apiClient.delete(`/workflows/delegations/${id}`);
    return res.data.data;
  },
  getSlaConfigs: async () => {
    const res = await apiClient.get('/workflows/sla');
    return res.data.data.configs as WorkflowSlaConfig[];
  },
  configureSla: async (data: {
    workflowType: string;
    targetHours: number;
    reminderHours: number;
    escalateToRole?: string;
  }) => {
    const res = await apiClient.post('/workflows/sla', data);
    return res.data.data as WorkflowSlaConfig;
  },
  getSlaStatus: async () => {
    const res = await apiClient.get('/workflows/sla/status');
    return res.data.data as SlaStatusReport;
  },
};
