import React, { useState, useEffect } from 'react';
import { supportApi, SupportTicket } from '../../api/support';

export const SupportManagement: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [internalNote, setInternalNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ticketRes, statRes] = await Promise.all([
        supportApi.getTickets({ status: statusFilter || undefined, category: categoryFilter || undefined }),
        supportApi.getStats(),
      ]);
      setTickets(ticketRes.tickets);
      setStats(statRes);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, categoryFilter]);

  const handleSelectTicket = async (id: string) => {
    try {
      const fullTicket = await supportApi.getTicketById(id);
      setSelectedTicket(fullTicket);
      setNewStatus(fullTicket.status);
      setResolutionText(fullTicket.resolution || '');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load ticket details.');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedTicket) return;
    setUpdating(true);
    try {
      await supportApi.updateTicket(selectedTicket.id, {
        status: newStatus,
        resolution: resolutionText || undefined,
      });
      handleSelectTicket(selectedTicket.id);
      fetchTickets();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to update ticket status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddInternalNote = async () => {
    if (!selectedTicket || !internalNote.trim()) return;
    setAddingNote(true);
    try {
      await supportApi.addComment(selectedTicket.id, {
        comment: internalNote,
        isInternal: true,
      });
      setInternalNote('');
      handleSelectTicket(selectedTicket.id);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to add internal note.');
    } finally {
      setAddingNote(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Central Helpdesk Operations</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Triage, assign, and resolve user tickets across students, parents, faculty, and administrative staff.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 font-medium">Total Open</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.statusSummary.open}</p>
          </div>
          <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-800/40">
            <p className="text-xs text-amber-600 font-medium">In Progress</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.statusSummary.inProgress}</p>
          </div>
          <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-800/40">
            <p className="text-xs text-blue-600 font-medium">Waiting</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.statusSummary.waiting}</p>
          </div>
          <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
            <p className="text-xs text-emerald-600 font-medium">Resolved</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.statusSummary.resolved}</p>
          </div>
          <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 font-medium">Closed</p>
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">{stats.statusSummary.closed}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Status Filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING">Waiting</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Category Filter</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          >
            <option value="">All Categories</option>
            <option value="LOGIN">Account / Login</option>
            <option value="ATTENDANCE">Attendance</option>
            <option value="FEE">Fee & Payment</option>
            <option value="ASSIGNMENT">Assignments</option>
            <option value="RESULT">Exam Results</option>
            <option value="PROFILE">Profile Corrections</option>
            <option value="GENERAL">General</option>
          </select>
        </div>
      </div>

      {/* Operational Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Incoming Queue ({tickets.length})</h2>
          </div>
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading queue...</div>
          ) : tickets.length > 0 ? (
            <div className="divide-y divide-slate-150 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectTicket(t.id)}
                  className={`p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors ${
                    selectedTicket?.id === t.id ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">{t.ticketNumber}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        t.priority === 'URGENT'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                          : t.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {t.user?.firstName} {t.user?.lastName} ({t.user?.activeRole})
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{t.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No tickets found in this queue.</div>
          )}
        </div>

        {/* Selected Ticket Action Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
          {selectedTicket ? (
            <>
              {/* Ticket Meta */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{selectedTicket.ticketNumber}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Requester: {selectedTicket.user?.firstName} {selectedTicket.user?.lastName} ({selectedTicket.user?.email})
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedTicket.category}</span>
                  <p className="text-[10px] text-slate-400">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm text-slate-800 dark:text-slate-200">
                <p className="font-semibold text-xs text-slate-500 mb-1">Issue Details:</p>
                {selectedTicket.description}
              </div>

              {/* Resolution & Status Form */}
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">Administrative Resolution & Status</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Transition Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="WAITING">WAITING ON USER</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Official Resolution Message</label>
                  <textarea
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    rows={3}
                    placeholder="Document the resolution provided to the user..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleUpdateStatus}
                    disabled={updating}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition"
                  >
                    {updating ? 'Saving...' : 'Update Status & Resolution'}
                  </button>
                </div>
              </div>

              {/* Internal Notes / Staff Notes */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add Internal Note (Staff Only)</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Add private staff note (invisible to user)..."
                    className="flex-1 text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                  <button
                    onClick={handleAddInternalNote}
                    disabled={addingNote || !internalNote.trim()}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition"
                  >
                    {addingNote ? 'Saving...' : 'Add Note'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center p-12 text-center text-xs text-slate-400">
              Select a ticket from the queue to process resolution workflows.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportManagement;
