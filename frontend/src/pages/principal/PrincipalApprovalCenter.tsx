import React, { useEffect, useState } from 'react';
import { getPendingApprovals, reviewApprovalRequest } from '../../api/approval';
import { CheckCircle2, XCircle, RotateCcw, Clock, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export const PrincipalApprovalCenter: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewReason, setReviewReason] = useState('');
  const [actioning, setActioning] = useState(false);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const data = await getPendingApprovals();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load pending approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleReview = async (action: 'APPROVED' | 'REJECTED' | 'RETURNED_FOR_CORRECTION') => {
    if (!selectedRequest) return;
    setActioning(true);
    try {
      await reviewApprovalRequest(selectedRequest.id, { action, reason: reviewReason });
      setSelectedRequest(null);
      setReviewReason('');
      await fetchApprovals();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Approval review failed.');
    } finally {
      setActioning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unified Institutional Approval Center</h1>
          <p className="text-gray-500 text-sm mt-1">
            Centralized Queue for Registrations, Admissions, Leaves, Attendance Bypasses, Vehicles & Refunds
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-800 font-semibold text-xs rounded-full">
          {requests.length} Pending Approval Requests
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading pending approval queue...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={36} />
            <p className="font-semibold text-gray-700">All pending approvals cleared!</p>
            <p className="text-xs text-gray-400 mt-1">No outstanding administrative requests require action.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((r) => (
              <div key={r.id} className="p-5 hover:bg-gray-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-indigo-100 text-indigo-700 uppercase">
                      {r.requestType}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      Step {r.currentStepOrder} ({r.currentApproverRole})
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900">
                    Requester: {r.requestedByUser?.firstName} {r.requestedByUser?.lastName} ({r.requestedByUser?.email})
                  </h4>
                  <p className="text-xs text-gray-500">
                    Entity: <span className="font-medium text-gray-700">{r.entityType}</span> (#{r.entityId}) | Department: {r.department?.name || 'Institution-wide'}
                  </p>
                  {r.reason && (
                    <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-100 mt-2">
                      Reason/Notes: {r.reason}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedRequest(r)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition"
                  >
                    Review Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
              Review Approval Request (#{selectedRequest.id})
            </h3>
            <div className="text-xs space-y-2 bg-gray-50 p-3 rounded-lg">
              <p><span className="font-semibold">Type:</span> {selectedRequest.requestType}</p>
              <p><span className="font-semibold">Requester:</span> {selectedRequest.requestedByUser?.firstName} {selectedRequest.requestedByUser?.lastName}</p>
              <p><span className="font-semibold">Current Approver Role:</span> {selectedRequest.currentApproverRole}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Decision Reason / Feedback</label>
              <textarea
                rows={3}
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                placeholder="Enter mandatory reason for approval, rejection, or return..."
                className="w-full text-xs p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                disabled={actioning}
                onClick={() => setSelectedRequest(null)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={actioning}
                onClick={() => handleReview('RETURNED_FOR_CORRECTION')}
                className="px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold"
              >
                Return for Correction
              </button>
              <button
                disabled={actioning}
                onClick={() => handleReview('REJECTED')}
                className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold"
              >
                Reject
              </button>
              <button
                disabled={actioning}
                onClick={() => handleReview('APPROVED')}
                className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
