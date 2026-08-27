import React, { useState, useEffect } from 'react';
import { emergencyApi, EmergencyAlert, CampusStatus } from '../../api/emergency';

export const EmergencyBroadcastPage: React.FC = () => {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [campusStatus, setCampusStatus] = useState<CampusStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'EMERGENCY'>('EMERGENCY');
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['IN_APP', 'WHATSAPP']);
  const [submitting, setSubmitting] = useState(false);

  // Campus status change state
  const [newStatus, setNewStatus] = useState<'NORMAL' | 'WARNING' | 'EMERGENCY'>('NORMAL');
  const [statusReason, setStatusReason] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [alertsRes, statusRes] = await Promise.all([
        emergencyApi.getAlerts(),
        emergencyApi.getCampusStatus(),
      ]);
      setAlerts(alertsRes.data.alerts);
      setCampusStatus(statusRes.data);
      setNewStatus(statusRes.data.currentStatus);
    } catch (err: any) {
      console.error('Failed to load emergency data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    if (!window.confirm('Are you sure you want to broadcast this emergency alert to the entire selected audience?')) {
      return;
    }

    setSubmitting(true);
    try {
      await emergencyApi.createAlert({
        title,
        message,
        priority,
        targetAudience,
        channels: selectedChannels,
      });
      setTitle('');
      setMessage('');
      loadData();
      alert('Emergency alert broadcast dispatched successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to dispatch alert.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAlert = async (alertId: string) => {
    const reason = window.prompt('Please enter the cancellation reason:');
    if (!reason) return;

    try {
      await emergencyApi.cancelAlert(alertId, reason);
      loadData();
      alert('Emergency alert cancelled.');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to cancel alert.');
    }
  };

  const handleUpdateCampusStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusUpdating(true);
    try {
      await emergencyApi.updateCampusStatus({ status: newStatus, reason: statusReason });
      setStatusReason('');
      loadData();
      alert(`Campus operational status updated to ${newStatus}.`);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update campus status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const toggleChannel = (ch: string) => {
    if (selectedChannels.includes(ch)) {
      setSelectedChannels(selectedChannels.filter((c) => c !== ch));
    } else {
      setSelectedChannels([...selectedChannels, ch]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>🚨</span> Emergency Communication & Campus Safety
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          High-priority emergency alerts, multi-channel dispatch, and live campus operational state management.
        </p>
      </div>

      {/* Live Campus Status Banner */}
      <div
        className={`p-6 rounded-xl border shadow-sm flex flex-col md:flex-row md:items-center md:justify-between ${
          campusStatus?.currentStatus === 'EMERGENCY'
            ? 'bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800'
            : campusStatus?.currentStatus === 'WARNING'
            ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800'
            : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {campusStatus?.currentStatus === 'EMERGENCY'
                ? '🔴'
                : campusStatus?.currentStatus === 'WARNING'
                ? '🟡'
                : '🟢'}
            </span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Campus Status: {campusStatus?.currentStatus || 'NORMAL'}
            </h2>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            <strong>Reason:</strong> {campusStatus?.lastReason}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Updated by {campusStatus?.updatedBy} on{' '}
            {campusStatus?.updatedAt ? new Date(campusStatus.updatedAt).toLocaleString() : '—'}
          </p>
        </div>

        {/* Status Switcher Form */}
        <form onSubmit={handleUpdateCampusStatus} className="mt-4 md:mt-0 flex flex-wrap gap-2 items-center">
          <select
            value={newStatus}
            onChange={(e: any) => setNewStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold bg-white dark:bg-gray-800"
          >
            <option value="NORMAL">🟢 NORMAL</option>
            <option value="WARNING">🟡 WARNING</option>
            <option value="EMERGENCY">🔴 EMERGENCY</option>
          </select>
          <input
            type="text"
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            placeholder="Reason for change..."
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white dark:bg-gray-800"
            required
          />
          <button
            type="submit"
            disabled={statusUpdating}
            className="px-3 py-1.5 bg-gray-800 hover:bg-black text-white rounded-lg text-xs font-semibold"
          >
            {statusUpdating ? 'Updating...' : 'Set Status'}
          </button>
        </form>
      </div>

      {/* Broadcast Creation Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>📢</span> Create Emergency Alert Broadcast
        </h2>

        <form onSubmit={handleCreateAlert} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Alert Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sudden Campus Closure due to Cyclone Warning"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm font-semibold text-red-600"
              >
                <option value="EMERGENCY">🔴 EMERGENCY (Instant Push & Banner)</option>
                <option value="HIGH">🟡 HIGH (Important Notice)</option>
                <option value="NORMAL">🔵 NORMAL</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Alert Message</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Detailed instructions for students, parents, and faculty..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
              >
                <option value="ALL">All Campus Community (Students, Parents, Staff)</option>
                <option value="STUDENTS">Students Only</option>
                <option value="PARENTS">Parents / Guardians Only</option>
                <option value="FACULTY">Faculty Only</option>
                <option value="STAFF">Non-Faculty Staff Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Delivery Channels</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {['IN_APP', 'WHATSAPP', 'EMAIL', 'SMS', 'PUSH'].map((ch) => (
                  <button
                    type="button"
                    key={ch}
                    onClick={() => toggleChannel(ch)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      selectedChannels.includes(ch)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow transition"
            >
              {submitting ? 'Broadcasting...' : '🚨 Broadcast Emergency Alert'}
            </button>
          </div>
        </form>
      </div>

      {/* Alerts Log Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Broadcast History & Delivery Tracking
        </h2>

        {loading ? (
          <div className="text-center py-6 text-gray-500">Loading alerts history...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-6 text-gray-500">No emergency alerts recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 uppercase">
                <tr>
                  <th className="px-4 py-3">Alert Title</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Audience</th>
                  <th className="px-4 py-3">Channels</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent Time</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {alerts.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900 dark:text-white">{a.title}</div>
                      <div className="text-gray-500 line-clamp-1">{a.message}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded font-bold text-xs bg-red-100 text-red-700">
                        {a.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">{a.targetAudience}</td>
                    <td className="px-4 py-3 font-mono">{a.channels}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-xs ${
                          a.status === 'SENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{new Date(a.sentAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      {a.status === 'SENT' && (
                        <button
                          onClick={() => handleCancelAlert(a.id)}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-semibold"
                        >
                          Cancel Alert
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
