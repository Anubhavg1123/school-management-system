import React, { useState, useEffect } from 'react';
import { studentCaseApi, StudentCase } from '../../api/studentCase';

export const StudentCaseManagement: React.FC = () => {
  const [cases, setCases] = useState<StudentCase[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Selected case modal
  const [selectedCase, setSelectedCase] = useState<StudentCase | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter, typeFilter, priorityFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [casesRes, statsRes] = await Promise.all([
        studentCaseApi.getCases({
          status: statusFilter || undefined,
          caseType: typeFilter || undefined,
          priority: priorityFilter || undefined,
        }),
        studentCaseApi.getStats(),
      ]);
      setCases(casesRes.data.cases);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load case data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCase = async (id: string) => {
    try {
      const res = await studentCaseApi.getCaseById(id);
      setSelectedCase(res.data);
      setNewStatus(res.data.status);
      setResolutionText(res.data.resolution || '');
    } catch (err) {
      alert('Failed to load case details.');
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    setUpdating(true);
    try {
      await studentCaseApi.updateStatus(selectedCase.id, {
        status: newStatus,
        resolution: resolutionText || undefined,
        note: actionNote || undefined,
      });
      setActionNote('');
      const refreshed = await studentCaseApi.getCaseById(selectedCase.id);
      setSelectedCase(refreshed.data);
      loadData();
      alert('Case status updated successfully.');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update case.');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddActionNote = async () => {
    if (!selectedCase || !actionNote.trim()) return;
    try {
      await studentCaseApi.addAction(selectedCase.id, actionNote);
      setActionNote('');
      const refreshed = await studentCaseApi.getCaseById(selectedCase.id);
      setSelectedCase(refreshed.data);
      loadData();
    } catch (err: any) {
      alert('Failed to add note.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>📁</span> Student Support & Case Management Hub
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Track, triage, and resolve student attendance, academic, fee, and behavioral concerns with audited case histories.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 font-semibold">Total Cases</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalCases}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-xs text-amber-600 font-semibold">Open & Active Cases</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{stats.openCases}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-xs text-emerald-600 font-semibold">Resolved Cases</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.resolvedCases}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-xs text-indigo-600 font-semibold">Academic Cases</div>
            <div className="text-2xl font-bold text-indigo-600 mt-1">{stats.typeCounts?.ACADEMIC || 0}</div>
          </div>
        </div>
      )}

      {/* Filters & Case Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap gap-3 mb-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs bg-white dark:bg-gray-700"
            >
              <option value="">All Statuses</option>
              <option value="CREATED">CREATED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
              <option value="ACTION_REQUIRED">ACTION REQUIRED</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs bg-white dark:bg-gray-700"
            >
              <option value="">All Case Types</option>
              <option value="ACADEMIC">ACADEMIC</option>
              <option value="ATTENDANCE">ATTENDANCE</option>
              <option value="FEE">FEE</option>
              <option value="DOCUMENT">DOCUMENT</option>
              <option value="PARENT_COMMUNICATION">PARENT COMMUNICATION</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs bg-white dark:bg-gray-700"
            >
              <option value="">All Priorities</option>
              <option value="LOW">LOW</option>
              <option value="NORMAL">NORMAL</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>

          <button
            onClick={loadData}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-xs font-semibold rounded-lg"
          >
            🔄 Refresh Cases
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading cases...</div>
        ) : cases.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No student cases matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 uppercase">
                <tr>
                  <th className="px-4 py-3">Case Number</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Subject / Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600">{c.caseNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {c.student?.user.firstName} {c.student?.user.lastName}
                      </div>
                      <div className="text-gray-400">{c.student?.admissionNumber}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{c.title}</td>
                    <td className="px-4 py-3">{c.caseType}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-xs ${
                          c.priority === 'URGENT' || c.priority === 'HIGH'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-xs ${
                          c.status === 'RESOLVED' || c.status === 'CLOSED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.assignedTo ? `${c.assignedTo.firstName} ${c.assignedTo.lastName}` : 'Unassigned'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenCase(c.id)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
                      >
                        View & Triage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Case Details Drawer / Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs font-mono text-indigo-600 font-bold">{selectedCase.caseNumber}</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedCase.title}</h3>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <div>
                <strong className="text-gray-500">Student:</strong> {selectedCase.student?.user.firstName}{' '}
                {selectedCase.student?.user.lastName} ({selectedCase.student?.admissionNumber})
              </div>
              <div>
                <strong className="text-gray-500">Class:</strong> {selectedCase.student?.section?.class.name || '—'} -{' '}
                {selectedCase.student?.section?.name || '—'}
              </div>
              <div>
                <strong className="text-gray-500">Type:</strong> {selectedCase.caseType}
              </div>
              <div>
                <strong className="text-gray-500">Priority:</strong> {selectedCase.priority}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-1">Description</h4>
              <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                {selectedCase.description}
              </p>
            </div>

            {/* Action History Thread */}
            <div>
              <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Audit & Action History</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedCase.actions?.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-xs"
                  >
                    <div className="flex justify-between font-semibold text-gray-700 dark:text-gray-300">
                      <span>
                        {act.performedBy.firstName} {act.performedBy.lastName} ({act.performedBy.activeRole})
                      </span>
                      <span className="text-gray-400 font-mono">{new Date(act.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{act.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Update Status / Resolution Form */}
            <form onSubmit={handleUpdateStatus} className="space-y-3 pt-3 border-t">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs bg-white dark:bg-gray-700"
                  >
                    <option value="CREATED">CREATED</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW</option>
                    <option value="ACTION_REQUIRED">ACTION REQUIRED</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Resolution Summary</label>
                  <input
                    type="text"
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="Enter formal resolution note..."
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Add Action Note</label>
                <textarea
                  rows={2}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Record intervention note..."
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs bg-white dark:bg-gray-700"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleAddActionNote}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-semibold"
                >
                  Post Note Only
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  {updating ? 'Saving...' : 'Update Status & Resolve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
