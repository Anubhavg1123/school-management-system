import React, { useState, useEffect } from 'react';
import { supportApi, SupportTicket } from '../../api/support';

export const SupportTicketPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // New ticket form
  const [showNewModal, setShowNewModal] = useState(false);
  const [category, setCategory] = useState('GENERAL');
  const [priority, setPriority] = useState('NORMAL');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await supportApi.getTickets();
      setTickets(res.tickets);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load support tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await supportApi.createTicket({ category, description, priority });
      setShowNewModal(false);
      setDescription('');
      fetchTickets();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to create ticket.');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectTicket = async (id: string) => {
    try {
      const fullTicket = await supportApi.getTicketById(id);
      setSelectedTicket(fullTicket);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load ticket details.');
    }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await supportApi.addComment(selectedTicket.id, { comment: commentText });
      setCommentText('');
      handleSelectTicket(selectedTicket.id);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to submit comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Helpdesk & Support Center</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Submit service requests, academic queries, IT help tickets, and track administrative resolutions.
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
        >
          + New Support Ticket
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Ticket Grid & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Your Support Tickets</h2>
          </div>
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading tickets...</div>
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
                        t.status === 'RESOLVED' || t.status === 'CLOSED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">{t.category}</p>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{t.description}</p>
                  <p className="text-[10px] text-slate-400 mt-2">{new Date(t.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No support tickets submitted yet.</div>
          )}
        </div>

        {/* Selected Ticket Thread */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 flex flex-col justify-between">
          {selectedTicket ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono font-bold text-indigo-600">{selectedTicket.ticketNumber}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-semibold">
                      {selectedTicket.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Submitted on {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  {selectedTicket.status}
                </span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm text-slate-800 dark:text-slate-200">
                <p className="font-semibold text-xs text-slate-500 mb-1">Issue Description:</p>
                {selectedTicket.description}
              </div>

              {selectedTicket.resolution && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-800 dark:text-emerald-200">
                  <p className="font-semibold text-xs text-emerald-600 dark:text-emerald-400 mb-1">Administrative Resolution:</p>
                  {selectedTicket.resolution}
                </div>
              )}

              {/* Comments */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conversation Log</h3>
                {(selectedTicket as any).comments && (selectedTicket as any).comments.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(selectedTicket as any).comments.map((c: any) => (
                      <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {c.user?.firstName} {c.user?.lastName} ({c.user?.activeRole})
                          </span>
                          <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{c.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No responses yet.</p>
                )}
              </div>

              {/* Add Comment Input */}
              {selectedTicket.status !== 'CLOSED' && (
                <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Type a response or follow-up..."
                    className="flex-1 text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={submittingComment || !commentText.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition"
                  >
                    {submittingComment ? 'Sending...' : 'Send'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-12 text-center text-xs text-slate-400">
              Select a ticket from the left panel to inspect resolution details and message history.
            </div>
          )}
        </div>
      </div>

      {/* Modal for New Ticket */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Create Support Request</h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  <option value="GENERAL">General Query</option>
                  <option value="LOGIN">Account / Login Issues</option>
                  <option value="ATTENDANCE">Attendance Inaccuracy</option>
                  <option value="FEE">Fees & Payment Issues</option>
                  <option value="ASSIGNMENT">Assignments / Timetable</option>
                  <option value="RESULT">Exam Results</option>
                  <option value="PROFILE">Profile Corrections</option>
                  <option value="OTHER">Other Issues</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                  placeholder="Provide precise details of the issue..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !description.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition"
                >
                  {creating ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTicketPage;
