import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Plus,
  AlertTriangle,
  Users,
  CheckCircle,
  Calendar,
  Loader2,
  AlertCircle,
  Search,
  CheckSquare,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { noticeApi, NoticeItem } from '../../api/notice';

export const NoticeBoard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // New Notice Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    noticeType: 'GENERAL',
    priority: 'MEDIUM',
    publishDate: '',
    expiryDate: '',
    targetAudience: 'ALL',
    departmentId: '',
    classId: '',
    requireAcknowledgment: false,
  });

  // Estimated Recipient Count State
  const [recipientEstimate, setRecipientEstimate] = useState<number | null>(null);
  const [estimating, setEstimating] = useState<boolean>(false);

  // Emergency Broadcast Confirmation Dialog
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState<boolean>(false);

  useEffect(() => {
    fetchNotices();
  }, [selectedType]);

  useEffect(() => {
    if (showCreateModal) {
      handleEstimateRecipients();
    }
  }, [noticeForm.targetAudience, noticeForm.departmentId, noticeForm.classId, showCreateModal]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await noticeApi.getNotices({
        type: selectedType === 'ALL' ? undefined : selectedType,
      });
      setNotices(list || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load notices.');
    } finally {
      setLoading(false);
    }
  };

  const handleEstimateRecipients = async () => {
    try {
      setEstimating(true);
      const res = await noticeApi.estimateRecipients({
        targetAudience: noticeForm.targetAudience,
        departmentId: noticeForm.departmentId || undefined,
        classId: noticeForm.classId || undefined,
      });
      setRecipientEstimate(res.estimatedRecipients);
    } catch (err) {
      console.error(err);
    } finally {
      setEstimating(false);
    }
  };

  const handleSubmitNotice = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Check if emergency notice -> require confirmation dialog first
    if (noticeForm.noticeType === 'EMERGENCY' && !showEmergencyConfirm) {
      setShowEmergencyConfirm(true);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await noticeApi.createNotice(noticeForm);
      setSuccessMsg(`Notice "${noticeForm.title}" published successfully.`);
      setShowCreateModal(false);
      setShowEmergencyConfirm(false);
      fetchNotices();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to publish notice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledge = async (noticeId: string) => {
    try {
      await noticeApi.acknowledgeNotice(noticeId);
      setSuccessMsg('Notice acknowledged successfully.');
      fetchNotices();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to acknowledge notice.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading institutional notice board...</p>
      </div>
    );
  }

  const isAuthorizedPublisher = ['SUPER_ADMIN', 'OFFICE_ADMIN', 'HOD', 'FACULTY'].includes(user?.activeRole || '');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Institutional Notice Board
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Official announcements, academic notices, event alerts, emergency broadcasts, and department communications.
          </p>
        </div>

        {isAuthorizedPublisher && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Publish New Notice
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium text-emerald-800">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Type Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'GENERAL', 'ACADEMIC', 'HOLIDAY', 'EVENT', 'EMERGENCY', 'FEE', 'ATTENDANCE'].map((t) => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap ${
              selectedType === t
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Notices Feed */}
      <div className="space-y-4">
        {notices.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center text-gray-500 font-medium">
            No notices published for this category.
          </div>
        ) : (
          notices.map((n) => (
            <div
              key={n.id}
              className={`bg-white p-6 rounded-2xl border shadow-sm space-y-3 ${
                n.noticeType === 'EMERGENCY'
                  ? 'border-red-300 bg-red-50/40'
                  : n.priority === 'HIGH' || n.priority === 'URGENT'
                  ? 'border-amber-300'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-black text-gray-900">{n.title}</h2>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-black rounded-full ${
                        n.noticeType === 'EMERGENCY'
                          ? 'bg-red-600 text-white'
                          : n.priority === 'HIGH'
                          ? 'bg-amber-500 text-white'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {n.noticeType} ({n.priority})
                    </span>
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
                      Target: {n.targetAudience}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 font-medium">
                    Published by <strong className="text-gray-800">{n.author}</strong> on{' '}
                    {new Date(n.publishDate).toLocaleDateString()}
                  </div>
                </div>

                {n.requireAcknowledgment && (
                  <div>
                    {n.isAcknowledged ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-xl">
                        <CheckSquare className="w-4 h-4" /> Acknowledged
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAcknowledge(n.id)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm"
                      >
                        I Acknowledge
                      </button>
                    )}
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{n.content}</p>
            </div>
          ))
        )}
      </div>

      {/* CREATE NOTICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" /> Publish Institutional Notice
            </h2>

            <form onSubmit={handleSubmitNotice} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="Title of notice..."
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-3 font-semibold text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Notice Category</label>
                  <select
                    value={noticeForm.noticeType}
                    onChange={(e) => setNoticeForm({ ...noticeForm, noticeType: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 font-semibold"
                  >
                    <option value="GENERAL">GENERAL ANNOUNCEMENT</option>
                    <option value="ACADEMIC">ACADEMIC</option>
                    <option value="HOLIDAY">HOLIDAY</option>
                    <option value="EVENT">EVENT</option>
                    <option value="EMERGENCY">EMERGENCY</option>
                    <option value="FEE">FEE NOTICE</option>
                    <option value="ATTENDANCE">ATTENDANCE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Priority</label>
                  <select
                    value={noticeForm.priority}
                    onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 font-semibold"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Target Audience</label>
                <select
                  value={noticeForm.targetAudience}
                  onChange={(e) => setNoticeForm({ ...noticeForm, targetAudience: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 font-semibold"
                >
                  {(user?.activeRole === 'SUPER_ADMIN' || user?.activeRole === 'OFFICE_ADMIN') && (
                    <option value="ALL">ENTIRE INSTITUTION (ALL)</option>
                  )}
                  <option value="STUDENTS">ALL STUDENTS</option>
                  <option value="FACULTY">ALL FACULTY</option>
                  <option value="NON_FACULTY">NON-FACULTY STAFF</option>
                  <option value="DEPARTMENT">SPECIFIC DEPARTMENT</option>
                  <option value="CLASS">SPECIFIC CLASS</option>
                </select>
              </div>

              {/* DYNAMIC RECIPIENT COUNT ESTIMATION DISPLAY */}
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-700" /> Estimated Audience Count:
                </span>
                <span className="font-mono font-black text-indigo-950 text-base">
                  {estimating ? <Loader2 className="w-4 h-4 animate-spin" /> : `${recipientEstimate || 0} Recipients`}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Notice Content</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detailed message content..."
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-3"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="reqAck"
                  checked={noticeForm.requireAcknowledgment}
                  onChange={(e) => setNoticeForm({ ...noticeForm, requireAcknowledgment: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="reqAck" className="font-semibold text-gray-800 text-sm">
                  Require Formal User Read Acknowledgment
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 text-white font-extrabold rounded-lg flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMERGENCY BROADCAST CONFIRMATION DIALOG */}
      {showEmergencyConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="p-3 bg-red-100 text-red-700 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-black text-gray-900">Confirm Emergency Broadcast</h2>

            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-xs text-red-900 text-left space-y-1">
              <p>
                Title: <strong>{noticeForm.title}</strong>
              </p>
              <p>
                Audience: <strong>{noticeForm.targetAudience} ({recipientEstimate || 0} Recipients)</strong>
              </p>
              <p className="font-semibold text-red-800 pt-1">
                This emergency alert will be dispatched immediately across all active user channels.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEmergencyConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmitNotice()}
                disabled={submitting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Confirm Broadcast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;
