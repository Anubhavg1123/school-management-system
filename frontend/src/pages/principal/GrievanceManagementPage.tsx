import React, { useState, useEffect } from 'react';
import { grievancePolicyApi, Grievance } from '../../api/grievancePolicy';
import { MessageSquareWarning, Star, Lock, EyeOff, ShieldCheck, CheckCircle2, Search, Filter } from 'lucide-react';

export const GrievanceManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GRIEVANCES' | 'FEEDBACK'>('GRIEVANCES');
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [feedbackMetrics, setFeedbackMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Resolution modal
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newStatus, setNewStatus] = useState('RESOLVED');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [grvData, fbData] = await Promise.all([
        grievancePolicyApi.getGrievances(),
        grievancePolicyApi.getFeedbackMetrics(),
      ]);
      setGrievances(grvData);
      setFeedbackMetrics(fbData);
    } catch (err) {
      console.error('Failed to fetch grievance and feedback data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrievance) return;
    try {
      await grievancePolicyApi.updateGrievanceStatus(selectedGrievance.id, {
        status: newStatus,
        resolutionNotes,
      });
      setSelectedGrievance(null);
      fetchData();
    } catch (err) {
      console.error('Failed to update grievance', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <MessageSquareWarning className="w-7 h-7 text-indigo-600" />
          Institutional Grievances & Stakeholder Feedback Center
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Confidentiality-tiered grievance tracking with anonymous submitter privacy and aggregated academic quality feedback metrics.
        </p>

        {/* Tab switcher */}
        <div className="flex gap-2 mt-5 border-b border-slate-100">
          <button
            onClick={() => setActiveTab('GRIEVANCES')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
              activeTab === 'GRIEVANCES'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Confidential Grievances ({grievances.length})
          </button>
          <button
            onClick={() => setActiveTab('FEEDBACK')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
              activeTab === 'FEEDBACK'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Academic Feedback Analytics
          </button>
        </div>
      </div>

      {/* Tab 1: Grievances */}
      {activeTab === 'GRIEVANCES' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading grievances...</div>
          ) : grievances.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No grievances submitted.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {grievances.map((grv) => (
                <div key={grv.id} className="p-5 hover:bg-slate-50 transition space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {grv.trackingNumber}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          grv.privacyLevel === 'CONFIDENTIAL'
                            ? 'bg-rose-100 text-rose-800'
                            : grv.privacyLevel === 'RESTRICTED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                        {grv.privacyLevel}
                      </span>
                      <h3 className="font-bold text-slate-800 text-base">{grv.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                          grv.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {grv.status}
                      </span>
                      {grv.status !== 'RESOLVED' && (
                        <button
                          onClick={() => {
                            setSelectedGrievance(grv);
                            setNewStatus('RESOLVED');
                            setResolutionNotes('');
                          }}
                          className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 transition"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {grv.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div>
                      {grv.isAnonymous ? (
                        <span className="flex items-center gap-1 text-slate-500 font-medium">
                          <EyeOff className="w-3.5 h-3.5" /> Anonymous Submitter
                        </span>
                      ) : (
                        <span>
                          Submitted by: {grv.submittedByUser?.firstName} {grv.submittedByUser?.lastName}
                        </span>
                      )}
                    </div>
                    <div>Submitted: {new Date(grv.createdAt).toLocaleDateString()}</div>
                  </div>

                  {grv.resolutionNotes && (
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs">
                      <span className="font-bold text-emerald-800">Resolution:</span> {grv.resolutionNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Feedback Analytics */}
      {activeTab === 'FEEDBACK' && feedbackMetrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 uppercase font-semibold">Total Survey Responses</div>
              <div className="text-3xl font-black text-slate-800 mt-2">{feedbackMetrics.totalResponses}</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 uppercase font-semibold">Average Institutional Rating</div>
              <div className="text-3xl font-black text-indigo-600 mt-2 flex items-center gap-2">
                {feedbackMetrics.averageRating} <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 uppercase font-semibold">Satisfaction Index</div>
              <div className="text-3xl font-black text-emerald-600 mt-2">
                {feedbackMetrics.averageRating ? Math.round((feedbackMetrics.averageRating / 5) * 100) : 0}%
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-4">Rating Breakdown</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = feedbackMetrics.breakdown?.[stars] || 0;
                const pct = feedbackMetrics.totalResponses ? Math.round((count / feedbackMetrics.totalResponses) * 100) : 0;
                return (
                  <div key={stars} className="flex items-center gap-3 text-xs">
                    <span className="w-12 font-medium text-slate-700">{stars} Stars</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-16 text-right text-slate-500">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {selectedGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Resolve Grievance: {selectedGrievance.trackingNumber}</h3>
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="INVESTIGATING">INVESTIGATING</option>
                  <option value="ACTION_REQUIRED">ACTION_REQUIRED</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution & Corrective Actions</label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Record corrective actions taken..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedGrievance(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Save Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
