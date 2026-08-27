import React, { useState } from 'react';
import { calculateExamResults, publishExamResults } from '../../api/result';
import { Cpu, Send, CheckCircle2, Award } from 'lucide-react';

export const ResultPublicationHub: React.FC = () => {
  const [examId, setExamId] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [calcSummary, setCalcSummary] = useState<any>(null);

  const handleCalculate = async () => {
    try {
      if (!examId) {
        setMessage({ text: 'Examination ID is required.', type: 'error' });
        return;
      }
      const data = await calculateExamResults(examId);
      setCalcSummary(data);
      setMessage({ text: `Result calculation completed. Processed ${data.data?.length || 0} student result snapshots.`, type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error?.message || 'Failed to calculate results.', type: 'error' });
    }
  };

  const handlePublish = async () => {
    try {
      if (!examId) {
        setMessage({ text: 'Examination ID is required.', type: 'error' });
        return;
      }
      const data = await publishExamResults(examId);
      setMessage({ text: `Results published! ${data.data?.publishedCount || 0} students notified via WhatsApp & In-App notifications.`, type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error?.message || 'Failed to publish results.', type: 'error' });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <Cpu className="w-7 h-7 text-indigo-600" />
          Authoritative Result Calculation & Publication Engine
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Execute centralized result calculation, grade assignment, pass/fail evaluation, and trigger publication with Phase 10 parent notifications.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase">Target Examination ID</label>
          <input type="text" value={examId} onChange={(e) => setExamId(e.target.value)} placeholder="EXAM-2026-MT1" className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={handleCalculate} className="flex-1 py-3 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-sm rounded-xl hover:bg-indigo-100 flex items-center justify-center gap-2">
            <Cpu className="w-4 h-4" /> 1. Calculate Results & Grades
          </button>
          <button onClick={handlePublish} className="flex-1 py-3 bg-emerald-600 text-white font-semibold text-sm rounded-xl hover:bg-emerald-700 shadow-md flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> 2. Approve & Publish Results
          </button>
        </div>
      </div>
    </div>
  );
};
