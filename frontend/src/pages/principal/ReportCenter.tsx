import React, { useState, useEffect } from 'react';
import { reportsApi } from '../../api/reports';

type TabType = 'students' | 'attendance' | 'finance' | 'examinations' | 'staff' | 'visitors' | 'audit';

export const ReportCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('students');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async (tab: TabType) => {
    setLoading(true);
    setError(null);
    try {
      let data;
      switch (tab) {
        case 'students':
          data = await reportsApi.getStudentRoster();
          break;
        case 'attendance':
          data = await reportsApi.getAttendanceReport();
          break;
        case 'finance':
          data = await reportsApi.getFinanceReport();
          break;
        case 'examinations':
          data = await reportsApi.getExaminationReport();
          break;
        case 'staff':
          data = await reportsApi.getStaffReport();
          break;
        case 'visitors':
          data = await reportsApi.getVisitorReport();
          break;
        case 'audit':
          data = await reportsApi.getAuditReport({ limit: 50 });
          break;
      }
      setReportData(data?.data || data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab]);

  const handleExportCsv = () => {
    let endpoint = '';
    switch (activeTab) {
      case 'students':
        endpoint = 'students/roster';
        break;
      case 'attendance':
        endpoint = 'attendance';
        break;
      case 'finance':
        endpoint = 'finance';
        break;
      case 'examinations':
        endpoint = 'examinations';
        break;
      case 'staff':
        endpoint = 'staff';
        break;
      case 'visitors':
        endpoint = 'visitors';
        break;
      case 'audit':
        endpoint = 'audit';
        break;
    }
    const url = reportsApi.downloadReportCsvUrl(endpoint);
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Institutional Reporting Center</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics, institutional rosters, financial summaries, examination results, and audit trails.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 flex space-x-2 overflow-x-auto">
        {[
          { key: 'students', label: 'Students Roster' },
          { key: 'attendance', label: 'Attendance' },
          { key: 'finance', label: 'Finance & Fees' },
          { key: 'examinations', label: 'Examinations' },
          { key: 'staff', label: 'Staff Roster' },
          { key: 'visitors', label: 'Visitor Logs' },
          { key: 'audit', label: 'Audit Trail' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabType)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
          Loading report data...
        </div>
      ) : reportData ? (
        <div className="space-y-4">
          {/* Summary Cards if available */}
          {reportData.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(reportData.summary).map(([key, val]) => {
                if (typeof val === 'object' || val === null) return null;
                return (
                  <div key={key} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {typeof val === 'number' && key.toLowerCase().includes('amount') ? `₹${val.toLocaleString()}` : String(val)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto shadow-sm">
            {reportData.rows && reportData.rows.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 font-semibold">
                  <tr>
                    {Object.keys(reportData.rows[0]).map((col) => (
                      <th key={col} className="px-4 py-3 whitespace-nowrap">
                        {col.replace(/([A-Z])/g, ' $1')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-700">
                  {reportData.rows.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                      {Object.values(row).map((val: any, j: number) => (
                        <td key={j} className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                No records found for this report.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ReportCenter;
