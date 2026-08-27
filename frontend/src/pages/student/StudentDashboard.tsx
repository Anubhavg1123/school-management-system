import React, { useEffect, useState } from 'react';
import { getStudentDashboard } from '../../api/student-portal';
import { GraduationCap, Calendar, Clock, BookOpen, AlertTriangle, CheckCircle2, Award, Bell } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await getStudentDashboard();
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load Student Dashboard.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 font-medium">
        Loading Student Dashboard...
      </div>
    );
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

  const { student, todaySchedule, attendance, pendingAssignmentsCount, upcomingExamsCount, latestResult, unreadNotificationsCount } = data;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
            Student Academic Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold">{student.fullName}</h1>
          <div className="flex flex-wrap gap-4 text-xs font-medium text-indigo-100 pt-1">
            <span>Admission No: <strong className="text-white">{student.admissionNumber}</strong></span>
            <span>Class: <strong className="text-white">{student.class} ({student.section})</strong></span>
            <span>Department: <strong className="text-white">{student.department}</strong></span>
          </div>
        </div>
      </div>

      {/* Low Attendance Warning Alert */}
      {attendance.isLowAttendance && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-sm text-amber-900">Attendance Warning</h4>
            <p className="mt-0.5">{attendance.warningMessage}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attendance %</span>
          <p className={`text-2xl font-black ${attendance.isLowAttendance ? 'text-amber-600' : 'text-emerald-600'}`}>
            {attendance.attendancePercentage}%
          </p>
          <p className="text-[11px] text-gray-500">{attendance.presentSessions} / {attendance.totalSessions} Sessions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Tasks</span>
          <p className="text-2xl font-black text-indigo-600">{pendingAssignmentsCount}</p>
          <p className="text-[11px] text-gray-500">Assignments Due</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Upcoming Exams</span>
          <p className="text-2xl font-black text-purple-600">{upcomingExamsCount}</p>
          <p className="text-[11px] text-gray-500">Scheduled Papers</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Notifications</span>
          <p className="text-2xl font-black text-rose-600">{unreadNotificationsCount}</p>
          <p className="text-[11px] text-gray-500">Unread Alerts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Today's Class Schedule
            </h3>
            <span className="text-xs font-semibold text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>

          {todaySchedule.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 font-medium bg-gray-50 rounded-xl">
              No classes scheduled for today.
            </div>
          ) : (
            <div className="space-y-3">
              {todaySchedule.map((slot: any) => (
                <div key={slot.id} className="p-3.5 bg-gray-50 rounded-xl border flex justify-between items-center text-xs">
                  <div>
                    <span className="font-extrabold text-gray-900 text-sm">{slot.subjectName}</span>
                    <p className="text-gray-500 mt-0.5">Faculty: {slot.facultyName} • Room: {slot.room}</p>
                  </div>
                  <div className="text-right font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                    {slot.startTime} - {slot.endTime}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Published Result Card */}
        <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
              <Award className="w-5 h-5 text-indigo-600" />
              Latest Exam Result
            </h3>
            {latestResult ? (
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">{latestResult.examName}</span>
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-black text-gray-900">{latestResult.overallPercentage}%</span>
                  <span className="px-3 py-1 bg-emerald-600 text-white font-extrabold rounded-full text-xs">
                    {latestResult.grade} ({latestResult.overallResult})
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-gray-400 font-medium bg-gray-50 rounded-xl">
                No published exam results available yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
