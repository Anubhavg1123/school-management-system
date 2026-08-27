import React, { useState } from 'react';
import { getStudentAttendance, requestStudentLeave } from '../../api/student-portal';
import { Calendar, CheckCircle2, AlertTriangle, Plus, FileText } from 'lucide-react';

export const StudentAttendanceView: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleFetchAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage(null);
      const res = await getStudentAttendance(studentId);
      setAttendanceData(res.data);
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error?.message || 'Failed to fetch attendance.', type: 'error' });
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!studentId) {
        setMessage({ text: 'Student ID is required.', type: 'error' });
        return;
      }
      await requestStudentLeave(studentId, { startDate, endDate, reason });
      setMessage({ text: 'Student Leave Request submitted successfully for review.', type: 'success' });
      setShowLeaveModal(false);
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error?.message || 'Failed to submit leave request.', type: 'error' });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-indigo-600" />
            Student Attendance & Leave Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View attendance breakdown, subject sessions, and submit formal leave requests.
          </p>
        </div>
        <button onClick={() => setShowLeaveModal(true)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-md flex items-center gap-2">
          <Plus className="w-4 h-4" /> Request Leave
        </button>
      </div>

      <form onSubmit={handleFetchAttendance} className="bg-white p-4 rounded-2xl border shadow-sm flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs font-semibold text-gray-600 uppercase">Student ID</label>
          <input type="text" required value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="std_123" className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
        </div>
        <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-md">
          Load Attendance
        </button>
      </form>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {attendanceData && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4 bg-white p-5 rounded-2xl border shadow-sm text-center">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase">Total Sessions</span>
              <p className="text-2xl font-black text-gray-900">{attendanceData.summary.totalSessions}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase">Present</span>
              <p className="text-2xl font-black text-emerald-600">{attendanceData.summary.present}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase">Absent</span>
              <p className="text-2xl font-black text-red-600">{attendanceData.summary.absent}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase">Percentage</span>
              <p className="text-2xl font-black text-indigo-600">{attendanceData.summary.percentage}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleLeaveSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Submit Student Leave Request</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Start Date</label>
                <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">End Date</label>
                <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Reason</label>
              <textarea required value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Provide reason for absence..." className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setShowLeaveModal(false)} className="px-4 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">Submit Request</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
