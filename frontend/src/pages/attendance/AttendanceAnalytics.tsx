import React, { useState, useEffect } from 'react';
import { studentAttendanceApi } from '../../api/studentAttendance';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  TrendingUp,
  AlertOctagon,
  CheckCircle2,
  BookOpen,
  Search,
  Award,
  Calendar,
  AlertTriangle,
  User,
} from 'lucide-react';

export const AttendanceAnalytics: React.FC = () => {
  const [studentIdInput, setStudentIdInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [historyData, setHistoryData] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchStudentHistory = async (id: string) => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await studentAttendanceApi.getStudentHistory(id);
      if (res.success && res.data) {
        setHistoryData(res.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to fetch student attendance history.');
      setHistoryData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnomalies = async () => {
    try {
      const res = await studentAttendanceApi.getAnomalies({ limit: 20 });
      if (res.success && res.data) {
        setAnomalies(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch anomalies:', err);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentIdInput.trim()) {
      fetchStudentHistory(studentIdInput.trim());
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Analytics & Threshold Inspector</h1>
          <p className="text-sm text-gray-500 mt-1">
            Calculate student percentage metrics, detect low attendance warnings, and audit system anomalies.
          </p>
        </div>
      </div>

      {/* Student Lookup Bar */}
      <Card className="p-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              type="text"
              placeholder="Enter Student ID (e.g. cmt8... or Student ID from roster)..."
              value={studentIdInput}
              onChange={(e) => setStudentIdInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="primary" isLoading={loading} className="w-full sm:w-auto">
            Calculate Attendance %
          </Button>
        </form>
      </Card>

      {/* Student Attendance Analysis Report */}
      {historyData && (
        <div className="space-y-6">
          {/* Low Attendance Warning Banner */}
          {historyData.stats.isLowAttendance && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800">
              <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <h3 className="font-bold text-sm">Low Attendance Warning Alert</h3>
                <p className="text-xs text-red-700 mt-0.5">
                  Student's overall attendance rate ({historyData.stats.overallPercentage}%) falls below the minimum
                  institutional requirement of {historyData.stats.minimumThreshold}%. Exam eligibility warning flag raised.
                </p>
              </div>
            </div>
          )}

          {/* Student Profile & Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-3 md:col-span-1">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {historyData.student.firstName} {historyData.student.lastName}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">{historyData.student.admissionNumber}</p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-400">Class & Section:</span>
                  <span className="font-medium text-gray-800">
                    {historyData.student.class} — {historyData.student.section}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Department:</span>
                  <span className="font-medium text-gray-800">{historyData.student.department || 'General'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Roll Number:</span>
                  <span className="font-mono text-gray-800">{historyData.student.rollNumber || '—'}</span>
                </div>
              </div>
            </Card>

            {/* Attendance % Gauge */}
            <Card className="p-6 md:col-span-2 flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" /> Overall Attendance Performance
                </h3>
                <Badge variant={historyData.stats.isLowAttendance ? 'danger' : 'success'}>
                  {historyData.stats.isLowAttendance ? 'SHORTAGE ALERT' : 'ELIGIBLE'}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-gray-600">Overall Attendance Rate</span>
                  <span className="text-2xl font-black text-gray-900">{historyData.stats.overallPercentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      historyData.stats.isLowAttendance ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, historyData.stats.overallPercentage)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 mt-1 block">
                  Institutional Minimum Threshold: {historyData.stats.minimumThreshold}%
                </span>
              </div>

              {/* Counters */}
              <div className="grid grid-cols-5 gap-2 pt-2 border-t border-gray-100 text-center">
                <div>
                  <span className="text-xs text-gray-400 block">Total</span>
                  <span className="font-bold text-gray-900 text-sm">{historyData.stats.totalSessions}</span>
                </div>
                <div>
                  <span className="text-xs text-green-600 block">Present</span>
                  <span className="font-bold text-green-700 text-sm">{historyData.stats.presentCount}</span>
                </div>
                <div>
                  <span className="text-xs text-amber-600 block">Late</span>
                  <span className="font-bold text-amber-700 text-sm">{historyData.stats.lateCount}</span>
                </div>
                <div>
                  <span className="text-xs text-indigo-600 block">Bypass</span>
                  <span className="font-bold text-indigo-700 text-sm">{historyData.stats.academicBypassCount}</span>
                </div>
                <div>
                  <span className="text-xs text-red-600 block">Absent</span>
                  <span className="font-bold text-red-700 text-sm">{historyData.stats.absentCount}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Subject Breakdown Table */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" /> Subject-Wise Attendance Breakdown
            </h3>
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="p-3">Subject Code</th>
                    <th className="p-3">Subject Name</th>
                    <th className="p-3 text-center">Total Sessions</th>
                    <th className="p-3 text-center">Attended</th>
                    <th className="p-3 text-center">Attendance %</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historyData.subjectBreakdown.map((sb: any) => (
                    <tr key={sb.subject.id} className="hover:bg-gray-50/50">
                      <td className="p-3 font-mono text-xs text-gray-600">{sb.subject.code}</td>
                      <td className="p-3 font-medium text-gray-900">{sb.subject.name}</td>
                      <td className="p-3 text-center font-mono">{sb.total}</td>
                      <td className="p-3 text-center font-mono">{sb.present}</td>
                      <td className="p-3 text-center font-bold">
                        <span className={sb.isLow ? 'text-red-600' : 'text-green-600'}>{sb.percentage}%</span>
                      </td>
                      <td className="p-3 text-right">
                        <Badge variant={sb.isLow ? 'danger' : 'success'}>
                          {sb.isLow ? 'SHORTAGE' : 'SATISFACTORY'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* System Attendance Anomalies Log */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-amber-600" /> Recent System Attendance Anomalies
        </h3>
        {anomalies.length === 0 ? (
          <div className="py-6 text-center text-gray-500 bg-gray-50 rounded-lg">No anomalies logged.</div>
        ) : (
          <div className="overflow-x-auto border border-gray-100 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Anomaly Type</th>
                  <th className="p-3">Audit Details</th>
                  <th className="p-3">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {anomalies.map((anom) => (
                  <tr key={anom.id} className="hover:bg-gray-50/50">
                    <td className="p-3 text-xs text-gray-500">{new Date(anom.createdAt).toLocaleString()}</td>
                    <td className="p-3">
                      <Badge variant="warning">{anom.type}</Badge>
                    </td>
                    <td className="p-3 font-medium text-gray-900">{anom.description}</td>
                    <td className="p-3 text-xs text-gray-600">
                      {anom.user ? `${anom.user.firstName} ${anom.user.lastName}` : 'System'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
