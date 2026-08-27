import React, { useState } from 'react';
import { updateGuardianPreferences } from '../../api/guardian-portal';
import { Settings, MessageSquare, Mail, Bell, CheckCircle2 } from 'lucide-react';

export const GuardianPreferences: React.FC = () => {
  const [whatsAppEnabled, setWhatsAppEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateGuardianPreferences({
        whatsAppEnabled,
        emailEnabled,
        inAppEnabled,
        smsEnabled,
      });
      setMessage({ text: 'Communication preferences updated successfully.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error?.message || 'Failed to save preferences.', type: 'error' });
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-600" />
          Guardian Communication Preferences
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure notification delivery channels for attendance alerts, exam results, fee reminders, and notices.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl cursor-pointer">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="text-sm font-bold text-gray-900">WhatsApp Delivery</h4>
                <p className="text-xs text-gray-500">Receive official Meta WhatsApp messages for emergency alerts & results.</p>
              </div>
            </div>
            <input type="checkbox" checked={whatsAppEnabled} onChange={(e) => setWhatsAppEnabled(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded" />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl cursor-pointer">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-indigo-600" />
              <div>
                <h4 className="text-sm font-bold text-gray-900">Email Notifications</h4>
                <p className="text-xs text-gray-500">Receive official fee receipts and academic reports via email.</p>
              </div>
            </div>
            <input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded" />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl cursor-pointer">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-rose-600" />
              <div>
                <h4 className="text-sm font-bold text-gray-900">In-App Notifications</h4>
                <p className="text-xs text-gray-500">Receive real-time alerts in the Guardian Portal inbox.</p>
              </div>
            </div>
            <input type="checkbox" checked={inAppEnabled} onChange={(e) => setInAppEnabled(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded" />
          </label>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-md">
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
