import React, { useState, useEffect } from 'react';
import { intelligenceApi, OperationsDailySummary, OperationalRecommendation, DataCorrectionRequest } from '../../api/intelligence';
import { Activity, Sparkles, Database, UserCheck, ShieldAlert, CheckCircle, XCircle, Search, RefreshCw } from 'lucide-react';

export const OperationsIntelligenceHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'RECOMMENDATIONS' | 'CORRECTIONS' | 'STUDENT360'>('SUMMARY');
  const [dailySummary, setDailySummary] = useState<OperationsDailySummary | null>(null);
  const [recommendations, setRecommendations] = useState<OperationalRecommendation[]>([]);
  const [corrections, setCorrections] = useState<DataCorrectionRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Student 360 search
  const [studentSearchId, setStudentSearchId] = useState('');
  const [student360Data, setStudent360Data] = useState<any>(null);
  const [student360Loading, setStudent360Loading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumData, recData, corrData] = await Promise.all([
        intelligenceApi.getDailySummary(),
        intelligenceApi.getRecommendations(),
        intelligenceApi.getDataCorrections(),
      ]);
      setDailySummary(sumData);
      setRecommendations(recData);
      setCorrections(corrData);
    } catch (err) {
      console.error('Failed to fetch operations intelligence', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateRec = async (id: string, status: string) => {
    try {
      await intelligenceApi.updateRecommendationStatus(id, { status });
      fetchData();
    } catch (err) {
      console.error('Failed to update recommendation', err);
    }
  };

  const handleProcessCorrection = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await intelligenceApi.processDataCorrection(id, { status });
      fetchData();
    } catch (err) {
      console.error('Failed to process data correction', err);
    }
  };

  const handleSearchStudent360 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentSearchId) return;
    try {
      setStudent360Loading(true);
      const data = await intelligenceApi.getStudent360(studentSearchId);
      setStudent360Data(data);
    } catch (err) {
      console.error('Failed to get student 360 profile', err);
      setStudent360Data(null);
    } finally {
      setStudent360Loading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-7 h-7 text-indigo-600" />
            Institutional Operations Intelligence & Executive Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time daily operations briefings, explainable recommendations, Student 360° analytics, and audited data correction workflows.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Live Metrics
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('SUMMARY')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === 'SUMMARY'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Daily Executive Briefing
        </button>
        <button
          onClick={() => setActiveTab('RECOMMENDATIONS')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === 'RECOMMENDATIONS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          AI Operational Recommendations ({recommendations.filter((r) => r.status === 'NEW').length})
        </button>
        <button
          onClick={() => setActiveTab('CORRECTIONS')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === 'CORRECTIONS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Data Governance & Corrections ({corrections.filter((c) => c.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setActiveTab('STUDENT360')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === 'STUDENT360'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Student 360° Profile Inspector
        </button>
      </div>

      {/* Tab 1: Executive Summary */}
      {activeTab === 'SUMMARY' && dailySummary && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-xl text-white shadow-md flex items-center justify-between">
            <div>
              <div className="text-xs text-indigo-300 font-semibold uppercase">Daily Briefing Date: {dailySummary.date}</div>
              <h2 className="text-xl font-bold mt-1">Campus Operational Status: {dailySummary.healthSummary.status}</h2>
              <p className="text-xs text-slate-300 mt-1">{dailySummary.healthSummary.notes}</p>
            </div>
            <div className="text-xs text-slate-400">Generated: {new Date(dailySummary.generatedAt).toLocaleTimeString()}</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 uppercase font-semibold">Active Students</div>
              <div className="text-2xl font-black text-slate-800 mt-1">
                {dailySummary.metrics.activeStudents} <span className="text-xs text-slate-400 font-normal">/ {dailySummary.metrics.totalStudents} total</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 uppercase font-semibold">Active Faculty Members</div>
              <div className="text-2xl font-black text-slate-800 mt-1">
                {dailySummary.metrics.activeFaculty} <span className="text-xs text-slate-400 font-normal">/ {dailySummary.metrics.totalFaculty} total</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 uppercase font-semibold">Today's Staff Check-Ins</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {dailySummary.metrics.todayStaffAttendanceCheckIns}
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 uppercase font-semibold">Pending User Applications</div>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {dailySummary.metrics.pendingUserRegistrations}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Recommendations */}
      {activeTab === 'RECOMMENDATIONS' && (
        <div className="space-y-4">
          {recommendations.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
              No operational recommendations at this time. All audited institutional parameters within normal thresholds.
            </div>
          ) : (
            recommendations.map((rec) => (
              <div key={rec.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        rec.priority === 'HIGH'
                          ? 'bg-rose-100 text-rose-800'
                          : rec.priority === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {rec.priority} PRIORITY
                    </span>
                    <h3 className="font-bold text-slate-800 text-base">{rec.observation}</h3>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {rec.status}
                  </span>
                </div>

                <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-xs">
                  <span className="font-bold text-indigo-900">Suggested Action:</span> {rec.suggestedAction}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400 font-mono">
                    Evidence: {rec.evidenceJson}
                  </span>
                  {rec.status === 'NEW' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateRec(rec.id, 'ACKNOWLEDGED')}
                        className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 transition"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => handleUpdateRec(rec.id, 'DISMISSED')}
                        className="px-3 py-1 border border-slate-300 text-slate-600 rounded text-xs font-semibold hover:bg-slate-50 transition"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Data Corrections */}
      {activeTab === 'CORRECTIONS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100">
            {corrections.map((corr) => (
              <div key={corr.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {corr.entityType}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm">Field: {corr.fieldName}</h3>
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="line-through text-slate-400 mr-2">{corr.oldValue || '(Empty)'}</span>
                    <span className="font-bold text-emerald-700 font-mono">→ {corr.newValue}</span>
                  </div>
                  <div className="text-xs text-slate-500">Reason: {corr.reason}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                      corr.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : corr.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {corr.status}
                  </span>
                  {corr.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleProcessCorrection(corr.id, 'APPROVED')}
                        className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700"
                      >
                        Approve & Execute
                      </button>
                      <button
                        onClick={() => handleProcessCorrection(corr.id, 'REJECTED')}
                        className="px-3 py-1 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Student 360 */}
      {activeTab === 'STUDENT360' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Search Student 360° Comprehensive Profile</h2>
            <p className="text-xs text-slate-500 mb-4">
              Inspect student's full historical record: demographic details, academic enrolment, attendance records, fee assignments, examination marks, and alumni status.
            </p>

            <form onSubmit={handleSearchStudent360} className="flex gap-3">
              <input
                type="text"
                required
                value={studentSearchId}
                onChange={(e) => setStudentSearchId(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Enter Student ID"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                Inspect Student 360°
              </button>
            </form>
          </div>

          {student360Loading && (
            <div className="p-8 text-center text-slate-400 text-sm">Retrieving Student 360° timeline...</div>
          )}

          {student360Data && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {student360Data.user?.firstName} {student360Data.user?.lastName}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Admission #: {student360Data.admissionNumber} • Email: {student360Data.user?.email}
                  </div>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {student360Data.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400">Department</span>
                  <div className="font-semibold text-slate-700 mt-0.5">{student360Data.department?.name || '—'}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400">Section</span>
                  <div className="font-semibold text-slate-700 mt-0.5">{student360Data.section?.name || '—'}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400">Guardians</span>
                  <div className="font-semibold text-slate-700 mt-0.5">{student360Data.guardians?.length || 0} Listed</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400">Exit Status</span>
                  <div className="font-semibold text-slate-700 mt-0.5">{student360Data.exitChecklist?.status || 'Active Enrolment'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
