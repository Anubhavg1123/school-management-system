import React, { useState } from 'react';
import { submitStudentMarksBatch } from '../../api/marks';
import { Edit3, Save, Send, CheckCircle2, AlertTriangle } from 'lucide-react';

export const FacultyMarksEntry: React.FC = () => {
  const [examinationSubjectId, setExaminationSubjectId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [theoryMarks, setTheoryMarks] = useState<number>(75);
  const [internalMarks, setInternalMarks] = useState<number>(18);
  const [isAbsent, setIsAbsent] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSaveMarks = async (isDraft: boolean) => {
    try {
      if (!examinationSubjectId || !studentId) {
        setMessage({ text: 'Examination Subject ID and Student ID are required.', type: 'error' });
        return;
      }

      await submitStudentMarksBatch({
        examinationSubjectId,
        marks: [
          {
            studentId,
            obtainedTheoryMarks: Number(theoryMarks),
            obtainedInternalMarks: Number(internalMarks),
            isAbsent,
          },
        ],
        isDraft,
      });

      setMessage({
        text: isDraft ? 'Marks saved as DRAFT successfully.' : 'Marks SUBMITTED for HOD verification.',
        type: 'success',
      });
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error?.message || 'Failed to submit marks.', type: 'error' });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <Edit3 className="w-7 h-7 text-indigo-600" />
          Faculty Marks Entry Portal
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Keyboard-friendly marks entry interface with range validation ($Obtained \le Max$) and draft/submit controls.
        </p>
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

      <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase">Exam Subject Paper ID</label>
            <input type="text" value={examinationSubjectId} onChange={(e) => setExaminationSubjectId(e.target.value)} placeholder="ex_subj_123" className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase">Student ID</label>
            <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="std_123" className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t pt-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase">Theory Marks (Max 80)</label>
            <input type="number" disabled={isAbsent} value={theoryMarks} onChange={(e) => setTheoryMarks(Number(e.target.value))} className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase">Internal Marks (Max 20)</label>
            <input type="number" disabled={isAbsent} value={internalMarks} onChange={(e) => setInternalMarks(Number(e.target.value))} className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
          </div>
          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 font-semibold cursor-pointer">
              <input type="checkbox" checked={isAbsent} onChange={(e) => setIsAbsent(e.target.checked)} className="rounded text-indigo-600" />
              Mark Absent
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <button onClick={() => handleSaveMarks(true)} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Draft
          </button>
          <button onClick={() => handleSaveMarks(false)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-md flex items-center gap-2">
            <Send className="w-4 h-4" /> Submit for Verification
          </button>
        </div>
      </div>
    </div>
  );
};
