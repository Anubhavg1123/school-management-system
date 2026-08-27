import React, { useState, useEffect } from 'react';
import { workflowApi, ApprovalDelegation, WorkflowSlaConfig, SlaStatusReport } from '../../api/workflows';
import { GitBranch, Clock, AlertTriangle, ShieldCheck, UserCheck, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export const AdvancedWorkflowsPage: React.FC = () => {
  const [delegations, setDelegations] = useState<ApprovalDelegation[]>([]);
  const [slaConfigs, setSlaConfigs] = useState<WorkflowSlaConfig[]>([]);
  const [slaReport, setSlaReport] = useState<SlaStatusReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Delegation Modal State
  const [showDelegationModal, setShowDelegationModal] = useState<boolean>(false);
  const [delegateUserId, setDelegateUserId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [scope, setScope] = useState('ALL');

  // SLA Modal State
  const [showSlaModal, setShowSlaModal] = useState<boolean>(false);
  const [workflowType, setWorkflowType] = useState('USER_APPROVAL');
  const [targetHours, setTargetHours] = useState<number>(48);
  const [reminderHours, setReminderHours] = useState<number>(24);
  const [escalateToRole, setEscalateToRole] = useState('SUPER_ADMIN');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [delData, slaData, repData] = await Promise.all([
        workflowApi.getDelegations(),
        workflowApi.getSlaConfigs(),
        workflowApi.getSlaStatus(),
      ]);
      setDelegations(delData);
      setSlaConfigs(slaData);
      setSlaReport(repData);
    } catch (err) {
      console.error('Failed to fetch workflow data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workflowApi.createDelegation({
        delegateUserId,
        startDate: `${startDate}T00:00:00.000Z`,
        endDate: `${endDate}T23:59:59.000Z`,
        reason,
        scope,
      });
      setShowDelegationModal(false);
      fetchData();
    } catch (err) {
      console.error('Failed to create delegation', err);
    }
  };

  const handleRevokeDelegation = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this approval delegation?')) return;
    try {
      await workflowApi.revokeDelegation(id);
      fetchData();
    } catch (err) {
      console.error('Failed to revoke delegation', err);
    }
  };

  const handleSaveSla = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workflowApi.configureSla({
        workflowType,
        targetHours: Number(targetHours),
        reminderHours: Number(reminderHours),
        escalateToRole,
      });
      setShowSlaModal(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save SLA configuration', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <GitBranch className="w-7 h-7 text-indigo-600" />
            Institutional Workflow & SLA Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage multi-tier approval delegations, time-to-decision SLAs, and automated operational escalations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSlaModal(true)}
            className="flex items-center gap-2 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition"
          >
            <Clock className="w-4 h-4" />
            Configure SLA
          </button>
          <button
            onClick={() => setShowDelegationModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Delegate Approval Authority
          </button>
        </div>
      </div>

      {/* SLA Metric Cards */}
      {slaReport && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase">Total Pending Approvals</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{slaReport.summary.totalPending}</div>
            <div className="text-xs text-slate-400 mt-1">Across all institutional workflows</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-emerald-600 font-semibold uppercase">On Track (Within SLA)</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{slaReport.summary.onTrackCount}</div>
            <div className="text-xs text-emerald-600/80 mt-1">Normal turnaround time</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-amber-600 font-semibold uppercase">SLA Warning Window</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{slaReport.summary.warningCount}</div>
            <div className="text-xs text-amber-600/80 mt-1">Reminder alerts dispatched</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-rose-600 font-semibold uppercase">Overdue SLA Breaches</div>
            <div className="text-2xl font-black text-rose-700 mt-1">{slaReport.summary.overdueCount}</div>
            <div className="text-xs text-rose-600/80 mt-1">Escalated to administration</div>
          </div>
        </div>
      )}

      {/* Delegations Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Active Approval Delegations ({delegations.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading delegations...</div>
        ) : delegations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No active approval delegations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-semibold">Original Approver</th>
                  <th className="px-6 py-3 font-semibold">Delegate User</th>
                  <th className="px-6 py-3 font-semibold">Validity Period</th>
                  <th className="px-6 py-3 font-semibold">Scope</th>
                  <th className="px-6 py-3 font-semibold">Reason</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {delegations.map((del) => (
                  <tr key={del.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-medium">
                      {del.originalApprover?.firstName} {del.originalApprover?.lastName}
                      <div className="text-xs text-slate-400">{del.originalApprover?.email}</div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {del.delegateUser?.firstName} {del.delegateUser?.lastName}
                      <div className="text-xs text-slate-400">{del.delegateUser?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {new Date(del.startDate).toLocaleDateString()} – {new Date(del.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {del.scope}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">{del.reason}</td>
                    <td className="px-6 py-4">
                      {del.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {del.isCurrentlyEffective ? 'Active Now' : 'Scheduled'}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                          Revoked
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {del.isActive && (
                        <button
                          onClick={() => handleRevokeDelegation(del.id)}
                          className="text-rose-600 hover:text-rose-800 font-medium text-xs flex items-center gap-1 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Revoke
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

      {/* SLA Monitored Items */}
      {slaReport && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-base">Pending Workflow Item Turnaround Times</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {slaReport.items.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{item.item}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Workflow: {item.workflow} • Elapsed: {item.elapsedHours}h / Target: {item.targetHours}h
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                    item.status === 'OVERDUE'
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : item.status === 'WARNING'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Delegation Modal */}
      {showDelegationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Delegate Approval Authority</h3>
            <form onSubmit={handleCreateDelegation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Delegate User ID</label>
                <input
                  type="text"
                  required
                  value={delegateUserId}
                  onChange={(e) => setDelegateUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Enter User ID of designated delegate"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Delegation Scope</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="ALL">ALL — Full Approval Authority</option>
                  <option value="LEAVE">LEAVE — Staff & Faculty Leaves Only</option>
                  <option value="MARKS">MARKS — Grade & Marks Verification Only</option>
                  <option value="ADMISSION">ADMISSION — Applicant Review Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Delegation</label>
                <textarea
                  required
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g. Sabbatical Leave / Annual Conference"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDelegationModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Confirm Delegation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Configure SLA Modal */}
      {showSlaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Configure Workflow SLA</h3>
            <form onSubmit={handleSaveSla} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Workflow Type</label>
                <select
                  value={workflowType}
                  onChange={(e) => setWorkflowType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="USER_APPROVAL">User Registration Approval</option>
                  <option value="GENERIC_APPROVAL">Generic Institutional Approvals</option>
                  <option value="STUDENT_EXIT">Student Exit Clearance</option>
                  <option value="STAFF_HANDOVER">Staff Responsibility Handover</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Hours (SLA)</label>
                  <input
                    type="number"
                    required
                    value={targetHours}
                    onChange={(e) => setTargetHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reminder Warning (Hours)</label>
                  <input
                    type="number"
                    required
                    value={reminderHours}
                    onChange={(e) => setReminderHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Escalate Breach To Role</label>
                <select
                  value={escalateToRole}
                  onChange={(e) => setEscalateToRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Principal)</option>
                  <option value="OFFICE_ADMIN">OFFICE_ADMIN (Registrar)</option>
                  <option value="HOD">HOD (Department Head)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSlaModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Save SLA Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
