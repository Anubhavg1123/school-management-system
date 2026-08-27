import React, { useEffect, useState } from 'react';
import { getGuardianDashboard } from '../../api/guardian-portal';
import { Users, Calendar, Award, Wallet, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const GuardianDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard(selectedStudentId);
  }, [selectedStudentId]);

  const fetchDashboard = async (studentId?: string) => {
    try {
      setLoading(true);
      const res = await getGuardianDashboard(studentId);
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load Guardian Dashboard.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Loading Guardian Dashboard...</div>;
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-2xl text-sm font-medium">
          {error || 'Failed to load data.'}
        </div>
      </div>
    );
  }

  const { wards, activeWard } = data;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
              Parent & Guardian Monitoring Hub
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">Ward Academic Monitor</h1>
          </div>
        </div>

        {/* Multi-Ward Switcher Tabs */}
        {wards.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/20">
            <span className="text-xs text-purple-200 font-semibold self-center mr-2">Select Ward:</span>
            {wards.map((w: any) => (
              <button
                key={w.id}
                onClick={() => setSelectedStudentId(w.id)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                  activeWard?.id === w.id ? 'bg-white text-purple-900 shadow-md scale-105' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{w.fullName} ({w.className})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {activeWard ? (
        <div className="space-y-6">
          {/* Active Ward Banner */}
          <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">{activeWard.fullName}</h3>
              <p className="text-gray-500">Admission No: <strong>{activeWard.admissionNumber}</strong> • Class: <strong>{activeWard.class} ({activeWard.section})</strong></p>
            </div>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-100">
              {activeWard.department}
            </span>
          </div>

          {/* KPI Cards for Selected Ward */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attendance %</span>
              <p className={`text-2xl font-black ${activeWard.attendance.isLowAttendance ? 'text-amber-600' : 'text-emerald-600'}`}>
                {activeWard.attendance.attendancePercentage}%
              </p>
              <p className="text-[11px] text-gray-500">{activeWard.attendance.presentSessions} / {activeWard.attendance.totalSessions} Sessions</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fee Outstanding</span>
              <p className="text-2xl font-black text-rose-600">${activeWard.finance.totalFeeOutstanding}</p>
              <p className="text-[11px] text-gray-500">Paid: ${activeWard.finance.totalFeePaid}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Published Results</span>
              <p className="text-2xl font-black text-indigo-600">{activeWard.results.length}</p>
              <p className="text-[11px] text-gray-500">Official Report Cards</p>
            </div>
          </div>

          {/* Published Results Table for Ward */}
          <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
              <Award className="w-5 h-5 text-indigo-600" />
              Published Academic Results
            </h3>
            {activeWard.results.length === 0 ? (
              <p className="text-xs text-gray-400 font-medium text-center py-4">No published exam results available for this ward.</p>
            ) : (
              <div className="space-y-3">
                {activeWard.results.map((r: any) => (
                  <div key={r.id} className="p-3.5 bg-gray-50 rounded-xl border flex justify-between items-center text-xs">
                    <div>
                      <span className="font-extrabold text-gray-900 text-sm">{r.examName}</span>
                      <p className="text-gray-500 mt-0.5">Verification Code: <code className="bg-gray-200 px-1 rounded">{r.verificationToken}</code></p>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold rounded-full">{r.grade} ({r.overallResult})</span>
                      <p className="font-black text-gray-900 text-sm mt-1">{r.overallPercentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-sm font-semibold text-gray-500 bg-white rounded-2xl border">
          No linked child profiles found.
        </div>
      )}
    </div>
  );
};
