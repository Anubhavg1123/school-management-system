import React, { useState } from 'react';
import { verifySubjectMarks, reviewMarksCorrection } from '../../api/marks';
import { CheckCircle2, XCircle, ShieldAlert, FileCheck } from 'lucide-react';

export const MarksVerificationHub: React.FC = () => {
  const [subjectId, setSubjectId] = useState('');
  const [correctionRequestId, setCorrectionRequestId] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleVerify = async (action: 'VERIFIED' | 'RETURNED_FOR_CORRECTION') => {
    try {
      if (!subjectId) {
        setMessage({ text: 'Subject Paper ID is required.', type: 'error' });
        return;
      }
      await verifySubjectMarks(subjectId, action);
      setMessage({ text: `Subject marks status updated to ${action}.`, type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error?.message || 'Failed to verify marks.', type: 'error' });
    }
  };

  const handleReviewCorrection = async (action: 'APPROVED' | 'REJECTED') => {
    try {
      if (!correctionRequestId) {
        setMessage({ text: 'Correction Request ID is required.', type: 'error' });
        return;
      }
      await reviewMarksCorrection(correctionRequestId, action);
      setMessage({ text: `Marks correction request ${action}. New result version generated if approved.`, type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error?.message || 'Failed to review correction request.', type: 'error' });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <FileCheck className="w-7 h-7 text-indigo-600" />
          HOD & Principal Marks Verification Hub
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Verify submitted subject marks batches and review post-publication marks correction requests.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verification Queue */}
        <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900 border-b pb-2">Subject Marks Batch Verification</h3>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase">Exam Subject Paper ID</label>
            <input type="text" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} placeholder="ex_subj_123" className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => handleVerify('RETURNED_FOR_CORRECTION')} className="flex-1 py-2 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold rounded-xl hover:bg-amber-100 flex items-center justify-center gap-1">
              <XCircle className="w-4 h-4" /> Return to Faculty
            </button>
            <button onClick={() => handleVerify('VERIFIED')} className="flex-1 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-md flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Approve & Verify
            </button>
          </div>
        </div>

        {/* Post-Publication Correction Reviewer */}
        <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            Marks Correction Requests
          </h3>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase">Correction Request ID</label>
            <input type="text" value={correctionRequestId} onChange={(e) => setCorrectionRequestId(e.target.value)} placeholder="corr_123" className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => handleReviewCorrection('REJECTED')} className="flex-1 py-2 bg-red-50 text-red-700 border border-red-200 text-xs font-semibold rounded-xl hover:bg-red-100 flex items-center justify-center gap-1">
              <XCircle className="w-4 h-4" /> Reject Request
            </button>
            <button onClick={() => handleReviewCorrection('APPROVED')} className="flex-1 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 shadow-md flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Approve & Version
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
