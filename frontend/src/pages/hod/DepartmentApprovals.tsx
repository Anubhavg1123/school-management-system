import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Calendar,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { hodPortalApi } from '../../api/hodPortal';

export const DepartmentApprovals: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'LEAVES' | 'CORRECTIONS' | 'BYPASSES' | 'EXTRA_CLASSES'>('LEAVES');

  const [leaves, setLeaves] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [bypasses, setBypasses] = useState<any[]>([]);
  const [extraClasses, setExtraClasses] = useState<any[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [leaveImpactWarning, setLeaveImpactWarning] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const [leaveList, corrList, bypassList, extraList] = await Promise.all([
        hodPortalApi.getLeaves(),
        hodPortalApi.getCorrections(),
        hodPortalApi.getBypasses(),
        hodPortalApi.getExtraClasses(),
      ]);

      setLeaves(leaveList || []);
      setCorrections(corrList || []);
      setBypasses(bypassList || []);
      setExtraClasses(extraList || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load department approval petitions.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewLeave = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      setSubmitting(true);
      setError(null);
      setLeaveImpactWarning(null);

      const res = await hodPortalApi.reviewFacultyLeave(id, action, `HOD ${action.toLowerCase()}`);
      setSuccessMsg(`Faculty leave application ${action.toLowerCase()} successfully.`);

      if (res.warning) {
        setLeaveImpactWarning(res);
      }
      fetchApprovals();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to review faculty leave.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewCorrection = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      setSubmitting(true);
      setError(null);
      await hodPortalApi.reviewCorrection(id, action, `HOD ${action.toLowerCase()}`);
      setSuccessMsg(`Attendance correction ${action.toLowerCase()} successfully.`);
      fetchApprovals();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to review attendance correction.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewBypass = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      setSubmitting(true);
      setError(null);
      await hodPortalApi.reviewBypass(id, action, `HOD ${action.toLowerCase()}`);
      setSuccessMsg(`Academic activity bypass ${action.toLowerCase()} successfully.`);
      fetchApprovals();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to review academic bypass.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewExtraClass = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      setSubmitting(true);
      setError(null);
      await hodPortalApi.reviewExtraClass(id, action, `HOD ${action.toLowerCase()}`);
      setSuccessMsg(`Extra class request ${action.toLowerCase()} successfully.`);
      fetchApprovals();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to review extra class.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading department approval hub...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            Department Approvals Command Center
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Review faculty leave applications with automated timetable conflict analysis, process attendance correction petitions, approve academic bypasses, and authorize remedial extra classes.
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

      {/* Leave Timetable Impact Warning Banner */}
      {leaveImpactWarning && leaveImpactWarning.warning && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl space-y-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">{leaveImpactWarning.warning}</h3>
              <p className="text-xs text-amber-800 mt-0.5">
                The approved leave affects <strong>{leaveImpactWarning.affectedTimetableSessions?.length || 0}</strong> scheduled timetable sessions. Assign substitute faculty from the Timetable portal.
              </p>
            </div>
          </div>

          {leaveImpactWarning.affectedTimetableSessions && leaveImpactWarning.affectedTimetableSessions.length > 0 && (
            <div className="bg-white/80 p-3 rounded-lg border border-amber-200 text-xs space-y-1">
              <span className="font-bold text-gray-800">Affected Class Sessions:</span>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {leaveImpactWarning.affectedTimetableSessions.map((s: any, idx: number) => (
                  <li key={idx}>
                    {s.dayOfWeek} ({s.periodName}): <strong>{s.className} ({s.sectionName})</strong> — {s.subjectName} (Room {s.room})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('LEAVES')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'LEAVES'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4" /> Faculty Leaves ({leaves.length})
        </button>
        <button
          onClick={() => setActiveTab('CORRECTIONS')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'CORRECTIONS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Award className="w-4 h-4" /> Attendance Corrections ({corrections.length})
        </button>
        <button
          onClick={() => setActiveTab('BYPASSES')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'BYPASSES'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Award className="w-4 h-4 text-emerald-600" /> Academic Bypasses ({bypasses.length})
        </button>
        <button
          onClick={() => setActiveTab('EXTRA_CLASSES')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'EXTRA_CLASSES'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" /> Extra Classes ({extraClasses.length})
        </button>
      </div>

      {/* Tab 1: Faculty Leaves */}
      {activeTab === 'LEAVES' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {leaves.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No faculty leave requests found.</div>
          ) : (
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-100 text-xs font-semibold text-gray-600 uppercase">
                <tr>
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {l.user?.firstName} {l.user?.lastName}
                      <div className="text-xs font-mono text-gray-500">{l.user?.email}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-700 text-xs">{l.leaveType}</td>
                    <td className="py-3 px-4 text-xs">
                      <div className="font-semibold">{l.totalDays} day(s)</div>
                      <div className="text-gray-500">
                        {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-700">{l.reason}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          l.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : l.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {l.status === 'PENDING' ? (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleReviewLeave(l.id, 'APPROVED')}
                            disabled={submitting}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleReviewLeave(l.id, 'REJECTED')}
                            disabled={submitting}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 2: Attendance Corrections */}
      {activeTab === 'CORRECTIONS' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {corrections.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No attendance correction requests.</div>
          ) : (
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-100 text-xs font-semibold text-gray-600 uppercase">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class & Subject</th>
                  <th className="py-3 px-4">Correction</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {corrections.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {c.studentAttendance?.student?.user?.firstName} {c.studentAttendance?.student?.user?.lastName}
                      <div className="text-xs font-mono text-gray-500">{c.studentAttendance?.student?.admissionNumber}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium">
                      {c.studentAttendance?.attendanceSlot?.class?.name} — {c.studentAttendance?.attendanceSlot?.subject?.name}
                    </td>
                    <td className="py-3 px-4 text-xs font-bold">
                      <span className="text-red-600">{c.originalStatus}</span> &rarr;{' '}
                      <span className="text-emerald-700">{c.proposedStatus}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-700">{c.reason}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          c.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {c.status === 'PENDING' ? (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleReviewCorrection(c.id, 'APPROVED')}
                            disabled={submitting}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewCorrection(c.id, 'REJECTED')}
                            disabled={submitting}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 3: Academic Bypasses */}
      {activeTab === 'BYPASSES' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {bypasses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No academic activity bypass requests.</div>
          ) : (
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-100 text-xs font-semibold text-gray-600 uppercase">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Activity Name</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bypasses.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {b.student?.user?.firstName} {b.student?.user?.lastName}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-800 text-xs">{b.activityName}</td>
                    <td className="py-3 px-4 text-xs font-mono text-gray-600">{b.date}</td>
                    <td className="py-3 px-4 text-xs text-gray-700">{b.reason}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          b.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {b.status === 'PENDING' ? (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleReviewBypass(b.id, 'APPROVED')}
                            disabled={submitting}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewBypass(b.id, 'REJECTED')}
                            disabled={submitting}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 4: Extra Classes */}
      {activeTab === 'EXTRA_CLASSES' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {extraClasses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No remedial extra class requests.</div>
          ) : (
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-100 text-xs font-semibold text-gray-600 uppercase">
                <tr>
                  <th className="py-3 px-4">Faculty & Class</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {extraClasses.map((ec) => (
                  <tr key={ec.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {ec.faculty?.user?.firstName} {ec.faculty?.user?.lastName}
                      <div className="text-xs font-semibold text-indigo-700">
                        {ec.class?.name} — {ec.section?.name}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold">{ec.subject?.name}</td>
                    <td className="py-3 px-4 text-xs font-mono text-gray-600">
                      {ec.date} ({ec.startTime} - {ec.endTime})
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-700">{ec.room?.roomNumber}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          ec.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ec.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {ec.status === 'PENDING' ? (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleReviewExtraClass(ec.id, 'APPROVED')}
                            disabled={submitting}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewExtraClass(ec.id, 'REJECTED')}
                            disabled={submitting}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default DepartmentApprovals;
