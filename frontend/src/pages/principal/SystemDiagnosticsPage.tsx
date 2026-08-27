import React, { useState, useEffect } from 'react';
import { diagnosticsApi, DiagnosticCheck } from '../../api/diagnostics';

export const SystemDiagnosticsPage: React.FC = () => {
  const [systemCheck, setSystemCheck] = useState<{
    overallStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    checks: DiagnosticCheck[];
    timestamp: string;
  } | null>(null);

  const [dataQuality, setDataQuality] = useState<{
    totalIssues: number;
    status: string;
    issues: Array<{ category: string; severity: 'WARNING' | 'CRITICAL'; issue: string }>;
    auditedAt: string;
  } | null>(null);

  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runAllDiagnostics();
  }, []);

  const runAllDiagnostics = async () => {
    setLoading(true);
    try {
      const [sysRes, dqRes, whRes] = await Promise.all([
        diagnosticsApi.runSystemCheck(),
        diagnosticsApi.runDataQualityAudit(),
        diagnosticsApi.getWebhookLogs(),
      ]);
      setSystemCheck(sysRes.data);
      setDataQuality(dqRes.data);
      setWebhookLogs(whRes.data.logs || []);
    } catch (err) {
      console.error('Failed to run diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🩺</span> System Self-Diagnostics & Data Quality Center
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Automated health probes, subsystem diagnostics, relational data integrity audits, and webhook logs.
          </p>
        </div>
        <button
          onClick={runAllDiagnostics}
          className="mt-3 md:mt-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition"
        >
          🔄 Re-Run Full Diagnostic Scan
        </button>
      </div>

      {/* System Overall Health Status */}
      {systemCheck && (
        <div
          className={`p-6 rounded-xl border shadow-sm flex items-center justify-between ${
            systemCheck.overallStatus === 'HEALTHY'
              ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
              : systemCheck.overallStatus === 'DEGRADED'
              ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800'
              : 'bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {systemCheck.overallStatus === 'HEALTHY' ? '🟢' : systemCheck.overallStatus === 'DEGRADED' ? '🟡' : '🔴'}
              </span>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Subsystem Integrity: {systemCheck.overallStatus}
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Scanned on {new Date(systemCheck.timestamp).toLocaleString()}
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
            {systemCheck.checks.filter((c) => c.status === 'PASS').length} / {systemCheck.checks.length} Passing
          </span>
        </div>
      )}

      {/* Subsystem Health Checklist */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Subsystem Diagnostic Checks</h2>

        {loading ? (
          <div className="text-center py-6 text-gray-500">Executing subsystem diagnostics...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systemCheck?.checks.map((c, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{c.subsystem}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-bold ${
                      c.status === 'PASS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : c.status === 'WARNING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">{c.message}</p>
                {c.details && (
                  <div className="mt-2 text-xs font-mono text-gray-400">
                    {JSON.stringify(c.details)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Automated Data Quality Audit */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🧹</span> Automated Data Quality & Integrity Auditor
            </h2>
            <p className="text-xs text-gray-500">
              Scans database entities for relational orphans, unassigned classes, and configuration gaps.
            </p>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              dataQuality?.totalIssues === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {dataQuality?.status} ({dataQuality?.totalIssues || 0} Issues)
          </span>
        </div>

        {dataQuality && dataQuality.issues.length > 0 ? (
          <div className="space-y-2">
            {dataQuality.issues.map((iss, i) => (
              <div
                key={i}
                className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                    [{iss.category}]
                  </span>
                  <span className="text-gray-800 dark:text-gray-200">{iss.issue}</span>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  {iss.severity}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-medium">
            ✅ No data integrity gaps detected. All student enrollments and academic assignments are consistent.
          </div>
        )}
      </div>

      {/* Webhook Ingestion Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Webhook Ingestion & Idempotency Logs
        </h2>

        {webhookLogs.length === 0 ? (
          <p className="text-xs text-gray-500">No external webhook events logged.</p>
        ) : (
          <div className="overflow-x-auto max-h-60">
            <table className="w-full text-xs text-left text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 uppercase">
                <tr>
                  <th className="px-3 py-2">Provider</th>
                  <th className="px-3 py-2">Event Type</th>
                  <th className="px-3 py-2">Idempotency Key</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Received At</th>
                </tr>
              </thead>
              <tbody>
                {webhookLogs.map((log: any) => (
                  <tr key={log.id} className="border-b dark:border-gray-700">
                    <td className="px-3 py-2 font-bold">{log.provider}</td>
                    <td className="px-3 py-2">{log.eventType}</td>
                    <td className="px-3 py-2 font-mono text-gray-500">{log.idempotencyKey || '—'}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 rounded font-bold text-xs bg-emerald-100 text-emerald-800">
                        {log.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
