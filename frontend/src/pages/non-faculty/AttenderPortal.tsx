import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Loader2,
  AlertCircle,
  Users,
} from 'lucide-react';
import { nonFacultyApi } from '../../api/nonFaculty';

export const AttenderPortal: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [search, setSearch] = useState<string>('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAttenderData();
  }, []);

  const fetchAttenderData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await nonFacultyApi.getAttenderDashboard();
      setDashboardData(res);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load attender dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleAttenderAction = async (targetUserId: string, action: 'CHECK_IN' | 'CHECK_OUT') => {
    try {
      setSubmittingId(targetUserId);
      setError(null);
      await nonFacultyApi.attenderMarkAttendance({ targetUserId, action });
      setSuccessMsg(`Attendance ${action.toLowerCase()} recorded by Attender successfully.`);
      fetchAttenderData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to record attendance.');
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading attender assisted entry hub...</p>
      </div>
    );
  }

  const roster = (dashboardData?.roster || []).filter((r: any) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
    r.employeeCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-amber-600" />
            Attender Assisted Attendance Portal
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Record campus check-in and check-out on behalf of operational non-faculty staff members with audit trailing.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-xs font-extrabold text-amber-900">
          Today: {dashboardData?.todayDate}
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

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium text-emerald-800">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Operational KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 text-center shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase">Total Staff</span>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{dashboardData?.summary?.totalStaff || 0}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center shadow-sm">
          <span className="text-xs font-bold text-emerald-700 uppercase">Present</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{dashboardData?.summary?.presentCount || 0}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center shadow-sm">
          <span className="text-xs font-bold text-amber-800 uppercase">Not Checked In</span>
          <p className="text-2xl font-extrabold text-amber-800 mt-1">{dashboardData?.summary?.absentCount || 0}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-center shadow-sm">
          <span className="text-xs font-bold text-purple-800 uppercase">Missing Out</span>
          <p className="text-2xl font-extrabold text-purple-800 mt-1">{dashboardData?.summary?.missingCheckoutCount || 0}</p>
        </div>
      </div>

      {/* Staff Search Filter */}
      <div className="relative">
        <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Search staff by name, employee ID, job title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-amber-500 focus:outline-none"
        />
      </div>

      {/* Staff Roster Cards with Large Touch Buttons */}
      <div className="space-y-3">
        {roster.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500 font-medium">
            No matching staff members found.
          </div>
        ) : (
          roster.map((s: any) => (
            <div key={s.userId} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-gray-900">{s.name}</h3>
                  <span className="px-2.5 py-0.5 bg-gray-100 text-gray-800 font-mono text-xs font-bold rounded-full">
                    {s.jobTitle}
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-mono mt-1">
                  ID: {s.employeeCode} | {s.email}
                </div>
                {s.enteredBy && (
                  <div className="text-[11px] font-bold text-amber-700 mt-1">
                    Entered by Attender: {s.enteredBy}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!s.checkInTime ? (
                  <button
                    onClick={() => handleAttenderAction(s.userId, 'CHECK_IN')}
                    disabled={submittingId === s.userId}
                    className="flex-1 sm:flex-none px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {submittingId === s.userId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                    Mark Check-In
                  </button>
                ) : !s.checkOutTime ? (
                  <button
                    onClick={() => handleAttenderAction(s.userId, 'CHECK_OUT')}
                    disabled={submittingId === s.userId}
                    className="flex-1 sm:flex-none px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {submittingId === s.userId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                    Mark Check-Out
                  </button>
                ) : (
                  <span className="px-4 py-2 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-xl">
                    Shift Completed
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AttenderPortal;
