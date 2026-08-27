import client from './client';

export interface ExplainableInsight {
  id: string;
  category: 'ATTENDANCE' | 'ACADEMIC' | 'FINANCE' | 'OPERATIONS';
  title: string;
  summary: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  dataSource: string;
  calculationRule: string;
  metrics: Record<string, any>;
  recommendation: string;
}

export const aiInsightsApi = {
  processQuery: async (query: string) => {
    const res = await client.post('/ai/query', { query });
    return res.data;
  },

  getAdministrativeInsights: async () => {
    const res = await client.get<{ data: { insights: ExplainableInsight[] } }>('/ai/insights/administrative');
    return res.data;
  },

  generateDraftNotice: async (data: { topic: string; targetAudience: string; keyPoints: string[] }) => {
    const res = await client.post('/ai/draft-notice', data);
    return res.data;
  },
};
