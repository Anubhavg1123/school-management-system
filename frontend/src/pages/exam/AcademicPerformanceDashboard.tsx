import React, { useState } from 'react';
import { getStudentPerformanceTrend, getClassPerformance } from '../../api/performance';
import { TrendingUp, BarChart2, Award, AlertCircle } from 'lucide-react';

export const AcademicPerformanceDashboard: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [trendData, setTrendData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetchTrend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const res = await getStudentPerformanceTrend(studentId);
      setTrendData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch performance trend analytics.');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-indigo-600" />
          Student Academic Performance Analytics
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Track exam-to-exam percentage trends, subject strength/weakness matrices, and academic progress.
        </p>
      </div>

      <form onSubmit={handleFetchTrend} className="bg-white p-4 rounded-2xl border shadow-sm flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs font-semibold text-gray-600 uppercase">Student ID</label>
          <input type="text" required value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="std_123" className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
        </div>
        <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-md">
          Analyze Performance
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {trendData && (
        <div className="space-y-6">
          {!trendData.hasEnoughData ? (
            <div className="p-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-center text-sm font-semibold flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span>{trendData.message}</span>
            </div>
          ) : (
            <>
              {/* Trend Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Exam Progress Trend</h3>
                  <div className="space-y-2">
                    {trendData.examTrends?.map((t: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl text-xs">
                        <span className="font-semibold text-gray-900">{t.examName}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-600">{t.percentage}%</span>
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-extrabold rounded-full">{t.grade}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subject Performance Matrix</h3>
                  <div className="space-y-2">
                    {trendData.subjectAverages?.map((s: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl text-xs">
                        <span className="font-semibold text-gray-900">{s.subjectName}</span>
                        <span className={`font-bold ${s.averagePercentage >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {s.averagePercentage}% Avg
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
