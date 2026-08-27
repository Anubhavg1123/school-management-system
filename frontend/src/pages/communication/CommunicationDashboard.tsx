import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Mail,
  Smartphone,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Search,
  Send,
  Layers,
} from 'lucide-react';
import { communicationApi, CommunicationDeliveryItem } from '../../api/communication';

export const CommunicationDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [logsData, setLogsData] = useState<{ providerConfigured: boolean; deliveries: CommunicationDeliveryItem[] } | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'DELIVERIES' | 'TEMPLATES'>('DELIVERIES');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Send WhatsApp Template Modal State
  const [showSendModal, setShowSendModal] = useState<boolean>(false);
  const [sendForm, setSendForm] = useState({
    recipientPhone: '',
    templateCode: 'student_absence',
    variables: {
      parent_name: 'David Patel',
      student_name: 'Alex Patel',
      date: new Date().toISOString().split('T')[0],
      school_name: 'St. Lawrence School',
    },
  });

  useEffect(() => {
    fetchData();
  }, [channelFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [logs, tmpl] = await Promise.all([
        communicationApi.getLogs({ channel: channelFilter === 'ALL' ? undefined : channelFilter }),
        communicationApi.getTemplates(),
      ]);

      setLogsData(logs);
      setTemplates(tmpl || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load communication platform logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerQueue = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await communicationApi.triggerQueueWorker();
      setSuccessMsg(`Queue worker executed. Processed ${res.processed} delivery tasks.`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to trigger queue worker.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendWhatsAppTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await communicationApi.sendWhatsAppTemplate(sendForm);
      setSuccessMsg('WhatsApp template message dispatched successfully!');
      setShowSendModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'WhatsApp message dispatch failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading communication platform hub...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-emerald-600" />
            Communication & WhatsApp Platform Command
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Official Meta WhatsApp Business API integration, message delivery status tracking, templates, and background queue workers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerQueue}
            disabled={submitting}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} /> Run Queue Worker
          </button>
          <button
            onClick={() => setShowSendModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" /> Send WhatsApp Message
          </button>
        </div>
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

      {/* PROVIDER CONFIGURATION STATUS CARD (ZERO FAKE DELIVERY POLICY) */}
      <div
        className={`p-5 rounded-2xl border-2 flex items-center justify-between ${
          logsData?.providerConfigured
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-amber-50 border-amber-300 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <MessageSquare className="w-7 h-7 flex-shrink-0" />
          <div>
            <h3 className="text-base font-extrabold">
              WhatsApp Business API Provider Status:{' '}
              {logsData?.providerConfigured ? 'CONNECTED & ACTIVE' : 'NOT CONFIGURED'}
            </h3>
            <p className="text-xs mt-0.5 opacity-90 font-medium">
              {logsData?.providerConfigured
                ? 'Official Meta Graph API credentials active. Messages will be dispatched to real WhatsApp numbers.'
                : 'Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in environment to enable real WhatsApp dispatch.'}
            </p>
          </div>
        </div>

        <span
          className={`px-3 py-1.5 rounded-full text-xs font-black ${
            logsData?.providerConfigured ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
          }`}
        >
          {logsData?.providerConfigured ? 'META API ACTIVE' : 'UNCONFIGURED'}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('DELIVERIES')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'DELIVERIES'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers className="w-4 h-4" /> Delivery Logs ({logsData?.deliveries?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('TEMPLATES')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'TEMPLATES'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Message Templates ({templates.length})
        </button>
      </div>

      {/* TAB 1: DELIVERY LOGS */}
      {activeTab === 'DELIVERIES' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {['ALL', 'WHATSAPP', 'EMAIL', 'SMS'].map((c) => (
              <button
                key={c}
                onClick={() => setChannelFilter(c)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${
                  channelFilter === c ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {logsData?.deliveries?.length === 0 ? (
              <div className="p-8 text-center text-gray-500 font-medium">No communication delivery logs recorded.</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {logsData?.deliveries?.map((d) => (
                  <div key={d.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900 text-sm">{d.recipientContact}</span>
                        <span className="px-2 py-0.5 bg-gray-100 font-mono font-bold text-[11px] rounded">
                          {d.channel} ({d.provider})
                        </span>
                        <span
                          className={`px-2.5 py-0.5 text-[11px] font-extrabold rounded-full ${
                            d.status === 'DELIVERED' || d.status === 'READ'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.status === 'SENT'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>
                      <div className="text-gray-500 font-mono">
                        Msg ID: {d.providerMessageId || 'N/A'} | Template: {d.templateCode || 'Inline'}
                      </div>
                      {d.failureReason && <div className="text-red-700 font-medium">Failure: {d.failureReason}</div>}
                    </div>

                    <div className="text-gray-400 font-mono text-[11px]">
                      {new Date(d.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MESSAGE TEMPLATES */}
      {activeTab === 'TEMPLATES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {templates.map((t) => (
              <div key={t.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-sm text-indigo-700">{t.code}</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-black rounded-full">
                    {t.providerStatus}
                  </span>
                </div>
                <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-200 font-mono">
                  "{t.bodyPattern}"
                </p>
                <div className="text-[11px] text-gray-500 font-semibold">
                  Provider Template: <strong className="text-gray-800">{t.providerTemplateName}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEND WHATSAPP TEMPLATE MODAL */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600" /> Send WhatsApp Template Message
            </h2>
            <form onSubmit={handleSendWhatsAppTemplate} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Recipient Mobile Number</label>
                <input
                  type="text"
                  required
                  placeholder="+91 9876543210"
                  value={sendForm.recipientPhone}
                  onChange={(e) => setSendForm({ ...sendForm, recipientPhone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Template Code</label>
                <select
                  value={sendForm.templateCode}
                  onChange={(e) => setSendForm({ ...sendForm, templateCode: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 font-mono font-semibold"
                >
                  {templates.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 text-white font-extrabold rounded-lg flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Dispatch Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationDashboard;
