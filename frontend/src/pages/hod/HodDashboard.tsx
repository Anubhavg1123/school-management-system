import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usersApi } from '../../api/users';
import { academicApi } from '../../api/academic';
import { attendanceApi } from '../../api/attendance';
import { leaveApi } from '../../api/leave';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { FacultyLeave, User, HodDashboardData } from '../../types';
import {
  Building2,
  Users,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  AlertCircle,
  ShieldCheck,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const HodDashboard: React.FC = () => {
  const { user } = useAuth();
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<FacultyLeave[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [hodDashboardData, setHodDashboardData] = useState<HodDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);

  // Leave Action Modal
  const [selectedLeave, setSelectedLeave] = useState<FacultyLeave | null>(null);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isProcessingLeave, setIsProcessingLeave] = useState(false);

  const loadHodData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, leavesRes, todayAttRes, dashRes] = await Promise.all([
        usersApi.getUsers({ departmentId: user?.departmentId || undefined, role: 'FACULTY' }),
        leaveApi.getPendingLeaves(),
        attendanceApi.getTodayStatus(),
        user?.departmentId ? academicApi.getHodDashboard(user.departmentId) : Promise.resolve({ success: false }),
      ]);

      if (usersRes.success && usersRes.data) setFacultyList(usersRes.data);
      if (leavesRes.success && leavesRes.data) setPendingLeaves(leavesRes.data);
      if (todayAttRes.success) setTodayAttendance(todayAttRes.data);
      if (dashRes && dashRes.success && dashRes.data) setHodDashboardData(dashRes.data);
    } catch (err) {
      console.error('Failed to load HOD data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHodData();
  }, [user?.departmentId]);

  const handlePunchCheckIn = async () => {
    setIsPunching(true);
    try {
      await attendanceApi.checkIn({ source: 'WEB' });
      loadHodData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Check-in failed');
    } finally {
      setIsPunching(false);
    }
  };

  const handlePunchCheckOut = async () => {
    setIsPunching(true);
    try {
      await attendanceApi.checkOut({ source: 'WEB' });
      loadHodData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Check-out failed');
    } finally {
      setIsPunching(false);
    }
  };

  const handleApproveLeave = async (leaveId: string) => {
    setIsProcessingLeave(true);
    try {
      await leaveApi.reviewLeave(leaveId, 'APPROVED');
      await loadHodData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to approve leave.');
    } finally {
      setIsProcessingLeave(false);
    }
  };

  const handleDeclineLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave) return;

    setIsProcessingLeave(true);
    try {
      await leaveApi.reviewLeave(selectedLeave.id, 'REJECTED', declineReason);
      setIsDeclineModalOpen(false);
      await loadHodData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to decline leave.');
    } finally {
      setIsProcessingLeave(false);
    }
  };

  const handleReviewExtraClass = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      await academicApi.reviewExtraClass(id, { action, reviewNotes: `HOD review: ${action}` });
      loadHodData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to review extra class.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading Department Command Hub..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-600" />
            <span>Head of Department (HOD) Portal</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {hodDashboardData?.department?.name
              ? `${hodDashboardData.department.name} (${hodDashboardData.department.code}) — Faculty Supervision & Academic Operations`
              : 'Department-scoped governance: manage faculty members, review departmental leave applications, and supervise timetable.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/hod/faculty"
            className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            Department Faculty
          </Link>
          <Link
            to="/hod/students"
            className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 rounded-lg text-xs font-bold flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Students & Low Attendance
          </Link>
          <Link
            to="/hod/approvals"
            className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Approvals Hub
          </Link>
          <Link
            to="/hod/timetable"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5" />
            Department Timetable
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Department Faculty"
          value={hodDashboardData?.stats?.facultyCount ?? facultyList.length}
          subtitle="Active teaching staff"
          icon={<Users className="w-6 h-6" />}
          variant="primary"
        />
        <StatCard
          title="Subjects Taught"
          value={hodDashboardData?.stats?.subjectsCount ?? 0}
          subtitle="Department course catalog"
          icon={<BookOpen className="w-6 h-6" />}
          variant="default"
        />
        <StatCard
          title="Pending Faculty Leaves"
          value={pendingLeaves.length}
          subtitle="Applications awaiting review"
          icon={<Calendar className="w-6 h-6" />}
          variant={pendingLeaves.length > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title="Special Class Requests"
          value={hodDashboardData?.pendingExtraClasses?.length ?? 0}
          subtitle="Remedial / Extra sessions"
          icon={<Layers className="w-6 h-6" />}
          variant={hodDashboardData?.pendingExtraClasses && hodDashboardData.pendingExtraClasses.length > 0 ? 'warning' : 'success'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* HOD Personal Punch Station */}
        <Card title="HOD Campus Attendance Punch" headerIcon={<Clock className="w-5 h-5" />}>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Today's Punch Status:</span>
              {todayAttendance?.checkInTime ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Present (In: {new Date(todayAttendance.checkInTime).toLocaleTimeString()})
                </span>
              ) : (
                <span className="text-amber-700 font-medium">Pending Check-in</span>
              )}
            </div>

            <div className="flex gap-3">
              {!todayAttendance?.checkInTime ? (
                <Button
                  variant="success"
                  className="flex-1 py-2.5"
                  onClick={handlePunchCheckIn}
                  isLoading={isPunching}
                >
                  Punch Check-In
                </Button>
              ) : !todayAttendance?.checkOutTime ? (
                <Button
                  variant="danger"
                  className="flex-1 py-2.5"
                  onClick={handlePunchCheckOut}
                  isLoading={isPunching}
                >
                  Punch Check-Out
                </Button>
              ) : (
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg w-full text-center font-bold text-xs">
                  Today's Attendance Completed
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Pending Department Faculty Leaves */}
        <Card title={`Pending Faculty Leave Petitions (${pendingLeaves.length})`} headerIcon={<Calendar className="w-5 h-5" />} noPadding>
          {pendingLeaves.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No pending leave applications.</div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {pendingLeaves.map((l) => (
                <div key={l.id} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">
                        {l.user?.firstName} {l.user?.lastName}
                      </span>
                      <span className="ml-2 text-slate-500 text-[11px] font-mono">{l.user?.email}</span>
                    </div>
                    <Badge variant="warning">{l.leaveType.replace(/_/g, ' ')}</Badge>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Duration: <strong>{l.totalDays} Day(s)</strong> ({new Date(l.startDate).toLocaleDateString()} &rarr; {new Date(l.endDate).toLocaleDateString()})
                  </div>
                  <div className="text-[11px] text-slate-500 italic">Reason: "{l.reason}"</div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleApproveLeave(l.id)}
                      isLoading={isProcessingLeave}
                      leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setSelectedLeave(l);
                        setDeclineReason('');
                        setIsDeclineModalOpen(true);
                      }}
                      leftIcon={<XCircle className="w-3.5 h-3.5" />}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Pending Special/Extra Classes For Approval */}
      {hodDashboardData?.pendingExtraClasses && hodDashboardData.pendingExtraClasses.length > 0 && (
        <Card title={`Pending Remedial / Extra Class Approvals (${hodDashboardData.pendingExtraClasses.length})`} headerIcon={<Layers className="w-5 h-5 text-indigo-600" />} noPadding>
          <div className="divide-y divide-slate-100 text-xs">
            {hodDashboardData.pendingExtraClasses.map((ec) => (
              <div key={ec.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{ec.subject?.name} ({ec.subject?.code})</span>
                    <Badge variant="warning">{ec.date}</Badge>
                    <span className="text-slate-500 text-[11px]">
                      {ec.startTime} - {ec.endTime}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    Class: <strong>{ec.class?.name} ({ec.section?.name})</strong> | Faculty: <strong>{ec.faculty?.user?.firstName} {ec.faculty?.user?.lastName}</strong> | Room: <strong>{ec.room?.roomNumber}</strong>
                  </div>
                  <div className="text-slate-500 italic text-[11px]">
                    Objective: "{ec.reason}"
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleReviewExtraClass(ec.id, 'APPROVED')}
                    leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleReviewExtraClass(ec.id, 'REJECTED')}
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Department Faculty Roster */}
      <Card title={`Department Faculty Roster (${facultyList.length})`} headerIcon={<Users className="w-5 h-5" />} noPadding>
        {facultyList.length === 0 ? (
          <EmptyState
            title="No Faculty Assigned"
            description="There are currently no faculty members assigned to your department."
            icon={<Users className="w-12 h-12 text-slate-300" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Faculty Name</th>
                  <th className="p-3.5">WhatsApp / Phone</th>
                  <th className="p-3.5">Designation</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facultyList.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">
                        {f.firstName} {f.lastName}
                      </div>
                      <div className="text-slate-500 text-[11px] font-mono">{f.email}</div>
                    </td>
                    <td className="p-3.5 font-mono text-emerald-700">
                      {f.whatsAppNumber || f.phone || '—'}
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">
                      {f.facultyProfile?.designation?.replace(/_/g, ' ') || 'FACULTY'}
                    </td>
                    <td className="p-3.5">
                      <Badge variant={f.status === 'ACTIVE' ? 'success' : 'default'} dot>
                        {f.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* DECLINE LEAVE MODAL */}
      <Modal isOpen={isDeclineModalOpen} onClose={() => setIsDeclineModalOpen(false)} title="Decline Faculty Leave Application">
        <form onSubmit={handleDeclineLeaveSubmit} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Provide the administrative reason for declining leave for <strong>{selectedLeave?.user?.firstName} {selectedLeave?.user?.lastName}</strong>.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Decline Reason</label>
            <textarea
              rows={3}
              required
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="State reason..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsDeclineModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" isLoading={isProcessingLeave}>
              Confirm Decline
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
