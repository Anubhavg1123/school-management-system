import client from './client';

export interface DiagnosticCheck {
  subsystem: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  message: string;
  details?: Record<string, any>;
}

export const diagnosticsApi = {
  runSystemCheck: async () => {
    const res = await client.get<{
      data: {
        overallStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
        checks: DiagnosticCheck[];
        timestamp: string;
      };
    }>('/diagnostics/system-check');
    return res.data;
  },

  runDataQualityAudit: async () => {
    const res = await client.get<{
      data: {
        totalIssues: number;
        status: string;
        issues: Array<{ category: string; severity: 'WARNING' | 'CRITICAL'; issue: string }>;
        auditedAt: string;
      };
    }>('/diagnostics/data-quality');
    return res.data;
  },

  getWebhookLogs: async () => {
    const res = await client.get('/diagnostics/webhooks');
    return res.data;
  },
};
