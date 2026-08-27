import React, { useState, useEffect } from 'react';
import { adminApi, FinanceReconciliationResult, EnrollmentReconciliationResult, AttendanceReconciliationResult } from '../../api/admin';

export const ReconciliationDashboard: React.FC = () => {
  const [finance, setFinance] = useState<FinanceReconciliationResult | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentReconciliationResult | null>(null);
  const [attendance, setAttendance] = useState<AttendanceReconciliationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReconciliation = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const [fin, enr, att] = await Promise.all([
        adminApi.getFinanceReconciliation(),
        adminApi.getEnrollmentReconciliation(),
        adminApi.getAttendanceReconciliation(),
      ]);
      setFinance(fin);
      setEnrollment(enr);
      setAttendance(att);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load reconciliation data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReconciliation();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        <div className="animate-pulse h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Data Integrity & Reconciliation Center</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automated relational reconciliation across Fee Payments, Student Enrollments, and Attendance Slots.
          </p>
        </div>
        <button
          onClick={fetchReconciliation}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50 transition"
        >
          {refreshing ? 'Reconciling...' : '↻ Run Reconciliation'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Finance Reconciliation Card */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Fee Ledgers</h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                finance?.summary.status === 'BALANCED'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
              }`}
            >
              {finance?.summary.status === 'BALANCED' ? '✓ BALANCED' : '⚠ DISCREPANCIES'}
            </span>
          </div>
          <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
            <p>Total Fee Assignments: <span className="font-semibold">{finance?.summary.totalAssignments}</span></p>
            <p>Reconciled Clean: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{finance?.summary.totalOk}</span></p>
            <p>Discrepant Accounts: <span className="font-semibold text-rose-600 dark:text-rose-400">{finance?.summary.totalDiscrepant}</span></p>
          </div>
        </div>

        {/* Enrollment Card */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Enrollment Integrity</h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                enrollment?.summary.status === 'ALL_ENROLLED'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
              }`}
            >
              {enrollment?.summary.status === 'ALL_ENROLLED' ? '✓ ALL ENROLLED' : '⚠ ENROLLMENT GAPS'}
            </span>
          </div>
          <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
            <p>Total Active Students: <span className="font-semibold">{enrollment?.summary.totalActiveStudents}</span></p>
            <p>Properly Enrolled: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{enrollment?.summary.enrolledOk}</span></p>
            <p>Unassigned / Gaps: <span className="font-semibold text-amber-600 dark:text-amber-400">{enrollment?.summary.enrollmentIssues}</span></p>
          </div>
        </div>

        {/* Attendance Card */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Attendance Completeness</h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                attendance?.summary.status === 'ATTENDANCE_CONSISTENT'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
              }`}
            >
              {attendance?.summary.status === 'ATTENDANCE_CONSISTENT' ? '✓ CONSISTENT' : '⚠ GAPS FOUND'}
            </span>
          </div>
          <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
            <p>Empty Finalized Slots: <span className="font-semibold">{attendance?.summary.finalizedSlotsWithNoRecords}</span></p>
            <p>Stale Scheduled Slots: <span className="font-semibold">{attendance?.summary.staleScheduledSlots}</span></p>
          </div>
        </div>
      </div>

      {/* Discrepancy Detail Tables */}
      {finance && finance.discrepancies.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-rose-50/50 dark:bg-rose-950/20">
            <h3 className="font-semibold text-sm text-rose-800 dark:text-rose-200">Financial Ledger Discrepancies</h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-2.5">Admission No</th>
                <th className="px-4 py-2.5">Student</th>
                <th className="px-4 py-2.5">Fee Structure</th>
                <th className="px-4 py-2.5">Recorded Paid</th>
                <th className="px-4 py-2.5">Verified Payments</th>
                <th className="px-4 py-2.5">Discrepancy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-700">
              {finance.discrepancies.map((d, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                  <td className="px-4 py-2.5 font-mono">{d.admissionNumber}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{d.studentName}</td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{d.feeTitle}</td>
                  <td className="px-4 py-2.5">₹{d.recordedPaidAmount.toLocaleString()}</td>
                  <td className="px-4 py-2.5">₹{d.actualVerifiedPayments.toLocaleString()}</td>
                  <td className="px-4 py-2.5 font-semibold text-rose-600 dark:text-rose-400">₹{d.discrepancy.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {enrollment && enrollment.issues.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-amber-50/50 dark:bg-amber-950/20">
            <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-200">Enrollment Integrity Warnings</h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-2.5">Admission No</th>
                <th className="px-4 py-2.5">Student</th>
                <th className="px-4 py-2.5">Integrity Issue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-700">
              {enrollment.issues.map((iss, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                  <td className="px-4 py-2.5 font-mono">{iss.admissionNumber}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{iss.studentName}</td>
                  <td className="px-4 py-2.5 text-amber-700 dark:text-amber-300">{iss.issue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReconciliationDashboard;
