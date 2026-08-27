import apiClient from './client';

export interface OperationsDailySummary {
  date: string;
  generatedAt: string;
  metrics: {
    totalStudents: number;
    activeStudents: number;
    totalFaculty: number;
    activeFaculty: number;
    todayStaffAttendanceCheckIns: number;
    pendingUserRegistrations: number;
    todayVisitorsInside: number;
    activeEmergencyAlerts: number;
  };
  healthSummary: {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    notes: string;
  };
}

export interface OperationalRecommendation {
  id: string;
  observation: string;
  evidenceJson: string;
  suggestedAction: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'NEW' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
  reasonForDismissal?: string;
  createdAt: string;
}

export interface InstitutionalIncident {
  id: string;
  incidentCode: string;
  severity: string;
  category: string;
  title: string;
  description: string;
  status: string;
  rootCauseAnalysis?: string;
  correctiveActions?: string;
  preventiveActions?: string;
  ownerUser?: { firstName: string; lastName: string; email: string };
  createdAt: string;
}

export interface DataCorrectionRequest {
  id: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  oldValue?: string;
  newValue: string;
  reason: string;
  status: string;
  rejectionReason?: string;
  requestedByUser?: { firstName: string; lastName: string; email: string };
  approvedByUser?: { firstName: string; lastName: string; email: string };
  createdAt: string;
}

export const intelligenceApi = {
  getDailySummary: async () => {
    const res = await apiClient.get('/intelligence/daily-summary');
    return res.data.data as OperationsDailySummary;
  },
  getRecommendations: async () => {
    const res = await apiClient.get('/intelligence/recommendations');
    return res.data.data.recommendations as OperationalRecommendation[];
  },
  updateRecommendationStatus: async (id: string, data: { status: string; reasonForDismissal?: string }) => {
    const res = await apiClient.patch(`/intelligence/recommendations/${id}/status`, data);
    return res.data.data;
  },
  getStudent360: async (studentId: string) => {
    const res = await apiClient.get(`/intelligence/student-360/${studentId}`);
    return res.data.data;
  },
  getStaff360: async (userId: string) => {
    const res = await apiClient.get(`/intelligence/staff-360/${userId}`);
    return res.data.data;
  },
  getIncidents: async () => {
    const res = await apiClient.get('/intelligence/incidents');
    return res.data.data.incidents as InstitutionalIncident[];
  },
  createIncident: async (data: Partial<InstitutionalIncident>) => {
    const res = await apiClient.post('/intelligence/incidents', data);
    return res.data.data as InstitutionalIncident;
  },
  updateIncident: async (id: string, data: any) => {
    const res = await apiClient.patch(`/intelligence/incidents/${id}`, data);
    return res.data.data;
  },
  getDataCorrections: async () => {
    const res = await apiClient.get('/intelligence/data-corrections');
    return res.data.data.requests as DataCorrectionRequest[];
  },
  createDataCorrection: async (data: Partial<DataCorrectionRequest>) => {
    const res = await apiClient.post('/intelligence/data-corrections', data);
    return res.data.data as DataCorrectionRequest;
  },
  processDataCorrection: async (id: string, data: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) => {
    const res = await apiClient.patch(`/intelligence/data-corrections/${id}`, data);
    return res.data.data;
  },
};
