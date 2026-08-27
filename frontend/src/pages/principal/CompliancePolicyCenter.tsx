import React, { useState, useEffect } from 'react';
import { grievancePolicyApi, InstitutionalPolicy, ComplianceItem } from '../../api/grievancePolicy';
import { intelligenceApi, InstitutionalIncident } from '../../api/intelligence';
import { ShieldCheck, BookOpen, CheckSquare, AlertOctagon, Plus, FileText, CheckCircle2, History } from 'lucide-react';

export const CompliancePolicyCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'POLICIES' | 'COMPLIANCE' | 'INCIDENTS'>('POLICIES');
  const [policies, setPolicies] = useState<InstitutionalPolicy[]>([]);
  const [complianceList, setComplianceList] = useState<ComplianceItem[]>([]);
  const [incidents, setIncidents] = useState<InstitutionalIncident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Policy Modal
  const [showPolicyModal, setShowPolicyModal] = useState<boolean>(false);
  const [policyCode, setPolicyCode] = useState('');
  const [policyTitle, setPolicyTitle] = useState('');
  const [policyCategory, setPolicyCategory] = useState('GENERAL');
  const [policyContent, setPolicyContent] = useState('');

  // Compliance Modal
  const [showComplianceModal, setShowComplianceModal] = useState<boolean>(false);
  const [compTitle, setCompTitle] = useState('');
  const [compCategory, setCompCategory] = useState('BACKUP');
  const [compFrequency, setCompFrequency] = useState('MONTHLY');
  const [compDueDate, setCompDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);

  // Incident Modal
  const [showIncidentModal, setShowIncidentModal] = useState<boolean>(false);
  const [incTitle, setIncTitle] = useState('');
  const [incSeverity, setIncSeverity] = useState('P2_HIGH');
  const [incCategory, setIncCategory] = useState('SYSTEM_OUTAGE');
  const [incDesc, setIncDesc] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [polData, compData, incData] = await Promise.all([
        grievancePolicyApi.getPolicies(),
        grievancePolicyApi.getComplianceChecklist(),
        intelligenceApi.getIncidents(),
      ]);
      setPolicies(polData);
      setComplianceList(compData);
      setIncidents(incData);
    } catch (err) {
      console.error('Failed to fetch compliance & policy data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePublishPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await grievancePolicyApi.publishPolicy({
        policyCode,
        title: policyTitle,
        category: policyCategory,
        effectiveDate: new Date().toISOString(),
        content: policyContent,
      });
      setShowPolicyModal(false);
      fetchData();
    } catch (err) {
      console.error('Failed to publish policy', err);
    }
  };

  const handleCreateCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await grievancePolicyApi.createComplianceItem({
        title: compTitle,
        category: compCategory,
        frequency: compFrequency,
        dueDate: `${compDueDate}T00:00:00.000Z`,
      });
      setShowComplianceModal(false);
      fetchData();
    } catch (err) {
      console.error('Failed to create compliance item', err);
    }
  };

  const handleVerifyCompliance = async (id: string) => {
    try {
      await grievancePolicyApi.verifyComplianceItem(id);
      fetchData();
    } catch (err) {
      console.error('Failed to verify compliance item', err);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await intelligenceApi.createIncident({
        title: incTitle,
        severity: incSeverity,
        category: incCategory,
        description: incDesc,
      });
      setShowIncidentModal(false);
      fetchData();
    } catch (err) {
      console.error('Failed to record incident', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            Compliance, Versioned Policies & Incident Governance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Institutional policy repository with version history, recurring compliance verification checks, and Root Cause Analysis (RCA) records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'POLICIES' && (
            <button
              onClick={() => setShowPolicyModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              Publish Policy
            </button>
          )}
          {activeTab === 'COMPLIANCE' && (
            <button
              onClick={() => setShowComplianceModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              Add Compliance Item
            </button>
          )}
          {activeTab === 'INCIDENTS' && (
            <button
              onClick={() => setShowIncidentModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-semibold transition"
            >
              <AlertOctagon className="w-4 h-4" />
              Report Incident
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('POLICIES')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === 'POLICIES'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Versioned Institutional Policies ({policies.length})
        </button>
        <button
          onClick={() => setActiveTab('COMPLIANCE')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === 'COMPLIANCE'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Compliance Checklists ({complianceList.length})
        </button>
        <button
          onClick={() => setActiveTab('INCIDENTS')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === 'INCIDENTS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Incident Registry & RCA ({incidents.length})
        </button>
      </div>

      {/* Tab 1: Policies */}
      {activeTab === 'POLICIES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policies.map((pol) => (
              <div key={pol.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {pol.policyCode}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      <History className="w-3 h-3" />
                      Version {pol.version}.0
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base mt-2">{pol.title}</h3>
                  <div className="text-xs text-slate-500 mt-1">Category: {pol.category}</div>
                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 font-serif leading-relaxed line-clamp-3">
                    {pol.content}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Effective: {new Date(pol.effectiveDate).toLocaleDateString()}</span>
                  <span>{pol.acknowledgements?.length || 0} User Acknowledgements</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Compliance */}
      {activeTab === 'COMPLIANCE' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100">
            {complianceList.map((comp) => (
              <div key={comp.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {comp.category}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm">{comp.title}</h3>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Frequency: {comp.frequency} • Due: {new Date(comp.dueDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {comp.status === 'COMPLETED' ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  ) : (
                    <button
                      onClick={() => handleVerifyCompliance(comp.id)}
                      className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 transition"
                    >
                      Verify & Sign Off
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Incidents & RCA */}
      {activeTab === 'INCIDENTS' && (
        <div className="space-y-4">
          {incidents.map((inc) => (
            <div key={inc.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {inc.incidentCode}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      inc.severity === 'P1_CRITICAL'
                        ? 'bg-rose-100 text-rose-800'
                        : inc.severity === 'P2_HIGH'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {inc.severity}
                  </span>
                  <h3 className="font-bold text-slate-800 text-base">{inc.title}</h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                  {inc.status}
                </span>
              </div>

              <p className="text-xs text-slate-600">{inc.description}</p>

              {inc.rootCauseAnalysis && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div className="text-xs font-bold text-slate-700">Root Cause Analysis (RCA):</div>
                  <div className="text-xs text-slate-600">{inc.rootCauseAnalysis}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Publish Institutional Policy</h3>
            <form onSubmit={handlePublishPolicy} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Policy Code</label>
                  <input
                    type="text"
                    required
                    value={policyCode}
                    onChange={(e) => setPolicyCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                    placeholder="POL-ATT-01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={policyCategory}
                    onChange={(e) => setPolicyCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="ATTENDANCE">Attendance & Leave</option>
                    <option value="EXAMINATION">Examinations & Grading</option>
                    <option value="DATA_PRIVACY">Data Privacy & Security</option>
                    <option value="CONDUCT">Student & Staff Conduct</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={policyTitle}
                  onChange={(e) => setPolicyTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g. Student Code of Academic Integrity"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Policy Content / Terms</label>
                <textarea
                  required
                  rows={4}
                  value={policyContent}
                  onChange={(e) => setPolicyContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Detail the mandatory institutional policy terms..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Publish Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
