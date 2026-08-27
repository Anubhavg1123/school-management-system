import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Loader2,
  AlertCircle,
  Users,
  GraduationCap,
  Calendar,
  Award,
} from 'lucide-react';
import { hodPortalApi } from '../../api/hodPortal';

export const DepartmentReports: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [reportType, setReportType] = useState<'FACULTY' | 'STUDENTS' | 'TIMETABLE' | 'ATTENDANCE'>('FACULTY');
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hodPortalApi.getReport(reportType);
      setReportData(res);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to generate department report.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `department_${reportType.toLowerCase()}_report_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-indigo-600" />
            Department Analytical Reports Hub
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Generate and export department-wide reports for faculty workloads, student attendance, class timetables, and academic allocations from live database records.
          </p>
        </div>

        <button
          onClick={handleExportJSON}
          disabled={!reportData}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Export Report (JSON)
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6 overflow-x-auto">
        <button
          onClick={() => setReportType('FACULTY')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            reportType === 'FACULTY'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" /> Faculty Report
        </button>
        <button
          onClick={() => setReportType('STUDENTS')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            reportType === 'STUDENTS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Student Roster Report
        </button>
        <button
          onClick={() => setReportType('TIMETABLE')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            reportType === 'TIMETABLE'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4" /> Timetable Report
        </button>
        <button
          onClick={() => setReportType('ATTENDANCE')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            reportType === 'ATTENDANCE'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Award className="w-4 h-4" /> Attendance Summary
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-gray-500 font-medium">Generating report data...</p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center text-xs text-gray-500 border-b pb-3">
            <span>
              Department: <strong>{reportData?.department}</strong>
            </span>
            <span>
              Generated At: <strong>{new Date(reportData?.generatedAt).toLocaleString()}</strong>
            </span>
          </div>

          <div className="bg-gray-900 text-gray-100 font-mono p-4 rounded-lg overflow-x-auto text-xs max-h-[500px]">
            <pre>{JSON.stringify(reportData?.data || [], null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentReports;
