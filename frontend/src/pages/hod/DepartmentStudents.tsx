import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  AlertTriangle,
  CheckCircle,
  Loader2,
  AlertCircle,
  BarChart,
} from 'lucide-react';
import {
  hodPortalApi,
  DepartmentStudentItem,
} from '../../api/hodPortal';

export const DepartmentStudents: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [students, setStudents] = useState<DepartmentStudentItem[]>([]);
  const [lowAttendanceList, setLowAttendanceList] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ROSTER' | 'LOW_ATTENDANCE'>('ROSTER');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [search]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [stdRes, lowRes] = await Promise.all([
        hodPortalApi.getStudents({ search }),
        hodPortalApi.getLowAttendance(),
      ]);

      setStudents(stdRes.students || []);
      setLowAttendanceList(lowRes || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load department students.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading department student directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-indigo-600" />
            Department Students & Attendance Governance
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Supervise department student enrollment, monitor class attendance percentages, and identify students falling below the mandatory 75% threshold.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('ROSTER')}
            className={`pb-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'ROSTER'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Student Roster ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('LOW_ATTENDANCE')}
            className={`pb-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'LOW_ATTENDANCE'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Low Attendance Alerts ({lowAttendanceList.length})
          </button>
        </div>

        {activeTab === 'ROSTER' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Tab 1: Student Roster */}
      {activeTab === 'ROSTER' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {students.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No students found in department.</div>
          ) : (
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-100 text-xs font-semibold text-gray-600 uppercase">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Admission # / Roll #</th>
                  <th className="py-3 px-4">Class & Section</th>
                  <th className="py-3 px-4">Attendance %</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {s.firstName} {s.lastName}
                      <div className="text-xs text-gray-500 font-mono">{s.email}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono">
                      <div className="font-semibold text-gray-800">{s.admissionNumber}</div>
                      <div className="text-gray-500">Roll: {s.rollNumber}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-gray-800">
                      {s.className} — {s.sectionName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-extrabold text-sm ${
                            s.isLowAttendance ? 'text-red-600' : 'text-emerald-700'
                          }`}
                        >
                          {s.attendancePercentage}%
                        </span>
                        {s.isLowAttendance && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded-full">
                            Shortage &lt;75%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 2: Low Attendance Dashboard */}
      {activeTab === 'LOW_ATTENDANCE' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-900 font-medium">
                Showing <strong>{lowAttendanceList.length}</strong> student(s) falling below the institutional <strong>75% attendance threshold</strong> requiring administrative attention.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {lowAttendanceList.length === 0 ? (
              <div className="p-8 text-center text-emerald-700 font-bold">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                All department students meet or exceed the 75% attendance requirement!
              </div>
            ) : (
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-100 text-xs font-semibold text-gray-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Class & Section</th>
                    <th className="py-3 px-4">Sessions Logged</th>
                    <th className="py-3 px-4">Present / Absent</th>
                    <th className="py-3 px-4">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lowAttendanceList.map((la) => (
                    <tr key={la.studentId} className="hover:bg-red-50/50">
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {la.studentName}
                        <div className="text-xs text-gray-500 font-mono">{la.admissionNumber}</div>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-gray-800">
                        {la.className} — {la.sectionName}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold">{la.totalSessions} sessions</td>
                      <td className="py-3 px-4 text-xs">
                        <span className="text-emerald-700 font-bold">{la.presentCount} P</span> /{' '}
                        <span className="text-red-700 font-bold">{la.absentCount} A</span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-red-600">{la.attendancePercentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentStudents;
