import React, { useState } from 'react';
import { getStudentResults } from '../../api/result';
import { Award, FileText, QrCode, CheckCircle, ShieldCheck } from 'lucide-react';

export const StudentResultView: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFetchResults = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const res = await getStudentResults(studentId);
      setResults(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch student results.');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <Award className="w-7 h-7 text-indigo-600" />
          Official Report Card & Published Results Portal
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          View official published examination results, grade breakdown, and secure QR verification badges.
        </p>
      </div>

      <form onSubmit={handleFetchResults} className="bg-white p-4 rounded-2xl border shadow-sm flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs font-semibold text-gray-600 uppercase">Student ID</label>
          <input type="text" required value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="std_123" className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
        </div>
        <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-md">
          Fetch Report Cards
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {results.map((r) => (
          <div key={r.id} className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Result Snapshot (Version {r.version})</span>
                <h3 className="text-lg font-extrabold text-gray-900">{r.examination?.name}</h3>
                <p className="text-xs text-gray-500">Result Number: {r.resultNumber}</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 text-xs font-extrabold rounded-full ${r.overallResult === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  {r.overallResult} ({r.grade})
                </span>
                <p className="text-lg font-black text-gray-900 mt-1">{r.overallPercentage}%</p>
              </div>
            </div>

            {/* Subject Details Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
                  <tr>
                    <th className="p-2.5">Subject</th>
                    <th className="p-2.5">Obtained Marks</th>
                    <th className="p-2.5">Max Marks</th>
                    <th className="p-2.5">Grade</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {r.subjectDetails?.map((sd: any) => (
                    <tr key={sd.id}>
                      <td className="p-2.5 font-medium text-gray-900">{sd.subjectName}</td>
                      <td className="p-2.5 font-bold">{sd.obtainedMarks}</td>
                      <td className="p-2.5">{sd.maxMarks}</td>
                      <td className="p-2.5 font-semibold text-indigo-600">{sd.grade}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${sd.passFailStatus === 'PASS' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {sd.passFailStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Verification Badge */}
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border text-xs">
              <div className="flex items-center gap-2 text-gray-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verification Code: <code className="bg-gray-200 px-1.5 py-0.5 rounded font-mono">{r.verificationToken}</code></span>
              </div>
              <span className="text-gray-400">Published on {new Date(r.publishedDate).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
