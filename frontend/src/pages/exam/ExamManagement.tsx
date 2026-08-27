import React, { useState } from 'react';
import { createExam, scheduleExamSubject, resolveExamEligibility } from '../../api/exam';
import { Calendar, Plus, ShieldCheck, Clock, BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const ExamManagement: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'EXAMS' | 'TIMETABLE' | 'ELIGIBILITY'>('EXAMS');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [examType, setExamType] = useState('MID_TERM');
  const [academicYearId, setAcademicYearId] = useState('');
  const [term, setTerm] = useState('SEM-1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [classIds, setClassIds] = useState('');

  // Schedule states
  const [examinationId, setExaminationId] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('09:30');
  const [endTime, setEndTime] = useState('12:30');
  const [roomId, setRoomId] = useState('');

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const clsList = classIds.split(',').map((c) => c.trim()).filter(Boolean);
      await createExam({
        name,
        code: code || undefined,
        examType,
        academicYearId,
        term,
        startDate,
        endDate,
        classIds: clsList,
      });
      setMessage({ text: 'Examination created successfully in DRAFT status.', type: 'success' });
      setShowCreateModal(false);
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error?.message || 'Failed to create examination.', type: 'error' });
    }
  };

  const handleScheduleSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await scheduleExamSubject({
        examinationId,
        classId,
        subjectId,
        examDate,
        startTime,
        endTime,
        roomId: roomId || undefined,
      });
      setMessage({ text: 'Subject paper scheduled successfully.', type: 'success' });
      setShowScheduleModal(false);
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error?.message || 'Failed to schedule subject paper (Schedule/Room Conflict).', type: 'error' });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            Examination Master & Timetable Engine
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure examination lifecycles, schedule papers with 4-way conflict protection, and resolve eligibility.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-semibold rounded-xl hover:bg-indigo-100 flex items-center gap-2"
          >
            <Clock className="w-4 h-4" /> Schedule Paper
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Examination
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab('EXAMS')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'EXAMS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Active Examinations
        </button>
        <button
          onClick={() => setActiveTab('TIMETABLE')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'TIMETABLE' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Exam Timetable
        </button>
        <button
          onClick={() => setActiveTab('ELIGIBILITY')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'ELIGIBILITY' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Student Eligibility Engine
        </button>
      </div>

      {/* Create Examination Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateExam} className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Create New Examination</h3>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Exam Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mid-Term Examination 2026" className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Exam Type</label>
                <select value={examType} onChange={(e) => setExamType(e.target.value)} className="w-full mt-1 p-2.5 border rounded-xl text-sm">
                  <option value="UNIT_TEST">Unit Test</option>
                  <option value="MID_TERM">Mid-Term</option>
                  <option value="SEMESTER">Semester Exam</option>
                  <option value="FINAL">Final Examination</option>
                  <option value="PRACTICAL">Practical / Viva</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Academic Year ID</label>
                <input type="text" required value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} placeholder="AY-XXXX" className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
              </div>
            </div>
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
              <label className="text-xs font-semibold text-gray-600 uppercase">Class IDs (Comma Separated)</label>
              <input type="text" required value={classIds} onChange={(e) => setClassIds(e.target.value)} placeholder="cls_1, cls_2" className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">Create Exam</button>
            </div>
          </form>
        </div>
      )}

      {/* Schedule Subject Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleScheduleSubject} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Schedule Examination Paper</h3>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Examination ID</label>
              <input type="text" required value={examinationId} onChange={(e) => setExaminationId(e.target.value)} className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Class ID</label>
                <input type="text" required value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Subject ID</label>
                <input type="text" required value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Exam Date</label>
                <input type="date" required value={examDate} onChange={(e) => setExamDate(e.target.value)} className="w-full mt-1 p-2 border rounded-xl text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Start Time</label>
                <input type="text" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full mt-1 p-2 border rounded-xl text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">End Time</label>
                <input type="text" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full mt-1 p-2 border rounded-xl text-xs" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Room ID (Optional)</label>
              <input type="text" value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="rm_101" className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setShowScheduleModal(false)} className="px-4 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">Schedule Paper</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
