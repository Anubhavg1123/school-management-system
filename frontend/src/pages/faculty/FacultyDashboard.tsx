import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { attendanceApi } from '../../api/attendance';
import { leaveApi } from '../../api/leave';
import { academicApi } from '../../api/academic';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { FacultyLeave, FacultyAcademicDashboardData } from '../../types';
import {
  Clock,
  BookOpen,
  CheckCircle,
  ArrowRight,
  FileSpreadsheet,
  Calendar,
  PlusCircle,
  MapPin,
  Layers,
  UserCheck,
  Shield,
} from 'lucide-react';

export const FacultyDashboard: React.FC = () => {
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [myLeaves, setMyLeaves] = useState<FacultyLeave[]>([]);
  const [academicData, setAcademicData] = useState<FacultyAcademicDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);

  // Leave Modal
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  const loadFacultyData = async () => {
    setIsLoading(true);
    try {
      const [todayRes, leavesRes, acadRes] = await Promise.all([
        attendanceApi.getTodayStatus(),
        leaveApi.getMyLeaves(),
        academicApi.getFacultyAcademicDashboard(),
      ]);

      if (todayRes.success) setTodayAttendance(todayRes.data);
      if (leavesRes.success && leavesRes.data) setMyLeaves(leavesRes.data);
      if (acadRes.success && acadRes.data) setAcademicData(acadRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFacultyData();
  }, []);

  const handlePunchCheckIn = async () => {
    setIsPunching(true);
    try {
      await attendanceApi.checkIn({ source: 'WEB' });
      loadFacultyData();
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
      loadFacultyData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Check-out failed');
    } finally {
      setIsPunching(false);
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLeave(true);
    try {
      await leaveApi.requestLeave({ leaveType, startDate, endDate, reason });
      setIsLeaveModalOpen(false);
      setReason('');
      setStartDate('');
      setEndDate('');
      loadFacultyData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to submit leave request.');
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading Faculty Portal..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-600" />
            <span>Faculty Academic & Duty Station</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {academicData?.faculty?.department?.name ? `${academicData.faculty.department.name} | ` : ''}
            Teaching Schedule, Assigned Courses & Daily Station Log.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/faculty/my-classes"
            className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold flex items-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5" />
            My Classes & Roster
          </Link>
          <Link
            to="/faculty/assignments"
            className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 rounded-lg text-xs font-bold flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Assignments & Notices
          </Link>
          <Link
            to="/faculty/services"
            className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" />
            Faculty Services
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsLeaveModalOpen(true)}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Request Leave
          </Button>
        </div>
      </div>

      {/* Coordinator Alert If Applicable */}
      {academicData?.isCoordinator && (
        <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Designated Class Coordinator:</span> You are coordinator for{' '}
              {academicData.coordinatedSections.map((c) => `${c.className} (${c.sectionName})`).join(', ')}.
            </div>
          </div>
          <Link to="/academic/students" className="font-bold underline text-indigo-700">
            View Student Roster &rarr;
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Punch In / Out Widget */}
        <Card title="Campus Attendance Punch" headerIcon={<Clock className="w-5 h-5" />}>
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
                  Check In Now
                </Button>
              ) : !todayAttendance?.checkOutTime ? (
                <Button
                  variant="danger"
                  className="flex-1 py-2.5"
                  onClick={handlePunchCheckOut}
                  isLoading={isPunching}
                >
                  Check Out (End of Day)
                </Button>
              ) : (
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg w-full text-center font-bold text-xs">
                  Today's Attendance Completed
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Course / Subject Allocations */}
        <Card title={`Teaching Allocations (${academicData?.subjectAssignments?.length || 0})`} headerIcon={<BookOpen className="w-5 h-5" />} noPadding>
          {!academicData?.subjectAssignments || academicData.subjectAssignments.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No course subjects allocated.</div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {academicData.subjectAssignments.map((a) => (
                <div key={a.id} className="p-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{a.subject?.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                        {a.subject?.code}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Class: <strong>{a.class?.name}</strong> {a.section ? `(${a.section.name})` : ''} | Credits: {a.subject?.credits}
                    </div>
                  </div>
                  <Badge variant="primary">{a.subject?.type || 'THEORY'}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Weekly Timetable Schedule */}
      <Card title={`My Teaching Schedule (${academicData?.timetableEntries?.length || 0} Weekly Periods)`} headerIcon={<Calendar className="w-5 h-5" />} noPadding>
        {!academicData?.timetableEntries || academicData.timetableEntries.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">No regular timetable entries assigned.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Day</th>
                  <th className="p-3.5">Period & Time</th>
                  <th className="p-3.5">Class / Section</th>
                  <th className="p-3.5">Subject</th>
                  <th className="p-3.5">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {academicData.timetableEntries.map((te) => (
                  <tr key={te.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{te.dayOfWeek}</td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-800">{te.timeSlot?.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {te.timeSlot?.startTime} - {te.timeSlot?.endTime}
                      </div>
                    </td>
                    <td className="p-3.5">
                      {te.class?.name} ({te.section?.name})
                    </td>
                    <td className="p-3.5 font-semibold text-indigo-700">
                      {te.subject?.name} ({te.subject?.code})
                    </td>
                    <td className="p-3.5 flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      {te.room?.roomNumber} ({te.room?.name})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Substitute Duties If Any */}
      {academicData?.substituteLectures && academicData.substituteLectures.length > 0 && (
        <Card title={`Substitute Teaching Duties (${academicData.substituteLectures.length})`} headerIcon={<UserCheck className="w-5 h-5 text-amber-600" />} noPadding>
          <div className="divide-y divide-slate-100 text-xs">
            {academicData.substituteLectures.map((sub) => (
              <div key={sub.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">
                    {sub.subject?.name} — {sub.class?.name} ({sub.section?.name})
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Date: <strong>{sub.date}</strong> | Period: {sub.timeSlot?.name} ({sub.timeSlot?.startTime} - {sub.timeSlot?.endTime})
                  </div>
                  <div className="text-[11px] text-amber-700 italic mt-0.5">
                    Substitute for: {sub.originalFaculty?.user?.firstName} {sub.originalFaculty?.user?.lastName} (Reason: {sub.reason})
                  </div>
                </div>
                <Badge variant="warning">{sub.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Leave Application History */}
      <Card title={`My Leave Applications (${myLeaves.length})`} headerIcon={<Calendar className="w-5 h-5" />} noPadding>
        {myLeaves.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">No leave applications submitted.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Dates & Duration</th>
                  <th className="p-3.5">Reason</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Reviewed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myLeaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5">
                      <Badge variant="primary">{l.leaveType.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800">{l.totalDays} Day(s)</div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(l.startDate).toLocaleDateString()} &rarr; {new Date(l.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-xs">{l.reason}</td>
                    <td className="p-3.5">
                      <Badge variant={l.status === 'APPROVED' ? 'success' : l.status === 'REJECTED' ? 'danger' : 'warning'}>
                        {l.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-slate-500 text-[11px]">
                      {l.reviewedBy ? `${l.reviewedBy.firstName} ${l.reviewedBy.lastName}` : 'Pending Review'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* REQUEST LEAVE MODAL */}
      <Modal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title="Submit Faculty Leave Application">
        <form onSubmit={handleLeaveSubmit} className="space-y-4 text-xs">
          <Select
            label="Leave Type *"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            options={[
              { value: 'CASUAL', label: 'Casual Leave' },
              { value: 'MEDICAL', label: 'Medical Leave' },
              { value: 'DUTY', label: 'On-Duty (Conference / Exam)' },
              { value: 'EARNED', label: 'Earned Leave' },
              { value: 'MATERNITY_PATERNITY', label: 'Maternity / Paternity Leave' },
              { value: 'OTHER', label: 'Other Special Leave' },
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date *"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="End Date *"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Reason for Leave *</label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the academic or personal reason..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsLeaveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmittingLeave}>
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
