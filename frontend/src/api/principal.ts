import { apiClient as api } from './client';

export const getPrincipalDashboard = async () => {
  const response = await api.get('/principal/dashboard');
  return response.data.data;
};

export const getExecutiveSummary = async () => {
  const response = await api.get('/principal/executive-summary');
  return response.data.data;
};

export const getDepartmentOverview = async () => {
  const response = await api.get('/principal/departments-overview');
  return response.data.data;
};

export const searchGlobal = async (query: string) => {
  const response = await api.get('/principal/global-search', { params: { q: query } });
  return response.data.data;
};

export const logPrincipalOverride = async (payload: {
  action: string;
  entityType: string;
  entityId: string;
  reason: string;
  beforeState?: any;
  afterState?: any;
}) => {
  const response = await api.post('/principal/override-log', payload);
  return response.data.data;
};

export const getSystemHealth = async () => {
  const response = await api.get('/principal/system-health');
  return response.data.data;
};
