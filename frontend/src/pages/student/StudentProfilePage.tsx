import React, { useState } from 'react';
import { requestProfileUpdate } from '../../api/student-portal';
import { UserCheck, ShieldCheck, Edit3, CheckCircle2 } from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [reason, setReason] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!studentId) {
        setMessage({ text: 'Student ID is required.', type: 'error' });
        return;
      }
      await requestProfileUpdate(studentId, {
        fieldChanges: { address, emergencyContact },
        reason,
      });
      setMessage({ text: 'Profile Update Request submitted successfully for Central Office review.', type: 'success' });
      setShowUpdateModal(false);
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error?.message || 'Failed to submit profile update request.', type: 'error' });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-indigo-600" />
            Student Master Profile & Governance
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View student master details and submit managed profile update requests.
          </p>
        </div>
        <button onClick={() => setShowUpdateModal(true)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-md flex items-center gap-2">
          <Edit3 className="w-4 h-4" /> Update Request
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUpdateSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Submit Managed Profile Update Request</h3>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Student ID</label>
              <input type="text" required value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="std_123" className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">New Address</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="New residence address" className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Emergency Contact</label>
              <input type="text" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="+1-555-0199" className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Reason for Change</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Reason..." className="w-full mt-1 p-2.5 border rounded-xl text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setShowUpdateModal(false)} className="px-4 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">Submit Request</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
