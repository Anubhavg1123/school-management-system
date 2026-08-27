import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  LogOut,
  AlertTriangle,
  Search,
  Truck,
  CheckCircle,
  Loader2,
  AlertCircle,
  QrCode,
  GraduationCap,
} from 'lucide-react';
import { visitorSecurityApi, ActiveVisitorItem } from '../../api/visitorSecurity';

export const SecurityPortal: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [activeVisitors, setActiveVisitors] = useState<ActiveVisitorItem[]>([]);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'NEW_ENTRY' | 'VEHICLE_VERIFY' | 'HISTORY'>('ACTIVE');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // New Visitor Form State
  const [showEntryModal, setShowEntryModal] = useState<boolean>(false);
  const [entryForm, setEntryForm] = useState({
    fullName: '',
    contactNumber: '',
    visitorType: 'PARENT',
    studentRelationship: 'FATHER',
    studentId: '',
    personToMeetName: '',
    purpose: '',
    vehicleNumber: '',
    vehicleType: 'CAR',
    isEmergency: false,
    emergencyReason: '',
    remarks: '',
  });

  // Student Search Results for Parent Entry
  const [studentQuery, setStudentQuery] = useState<string>('');
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Vehicle Verification State
  const [verifyRegNo, setVerifyRegNo] = useState<string>('');
  const [vehicleCheckResult, setVehicleCheckResult] = useState<any>(null);

  // Visitor Pass Modal State
  const [createdPass, setCreatedPass] = useState<any>(null);
  const [showPassModal, setShowPassModal] = useState<boolean>(false);

  useEffect(() => {
    fetchActiveVisitors();
  }, []);

  const fetchActiveVisitors = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await visitorSecurityApi.getActiveVisitors();
      setActiveVisitors(list || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load active visitors.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSearch = async (query: string) => {
    setStudentQuery(query);
    if (!query || query.length < 2) {
      setStudentResults([]);
      return;
    }
    try {
      const results = await visitorSecurityApi.searchStudents(query);
      setStudentResults(results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const pass = await visitorSecurityApi.createVisitorEntry({
        ...entryForm,
        studentId: selectedStudent?.id || undefined,
      });

      setCreatedPass(pass);
      setShowPassModal(true);
      setShowEntryModal(false);
      setSuccessMsg(`Visitor entry logged! Pass #${pass.passNumber} generated.`);
      fetchActiveVisitors();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to log visitor entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkExit = async (passNumber: string) => {
    try {
      setSubmitting(true);
      setError(null);
      await visitorSecurityApi.markVisitorExit(passNumber, 'Cleared security gate exit');
      setSuccessMsg(`Visitor pass ${passNumber} marked EXITED.`);
      fetchActiveVisitors();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to mark visitor exit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyRegNo) return;
    try {
      setSubmitting(true);
      setError(null);
      const res = await visitorSecurityApi.verifyVehicle(verifyRegNo);
      setVehicleCheckResult(res);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Vehicle verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading security operations hub...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
            Campus Gate Security Command Center
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage visitor entry/exit passes, parent/guardian links, active campus overstay alerts, and gate vehicle verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEntryModal(true)}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" /> Log New Visitor
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

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ACTIVE'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Active Visitors Inside Campus ({activeVisitors.length})
        </button>
        <button
          onClick={() => setActiveTab('VEHICLE_VERIFY')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'VEHICLE_VERIFY'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Truck className="w-4 h-4 text-indigo-600" /> Gate Vehicle Check
        </button>
      </div>

      {/* TAB 1: ACTIVE VISITORS LIST */}
      {activeTab === 'ACTIVE' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {activeVisitors.length === 0 ? (
              <div className="p-8 text-center text-gray-500 font-medium">No visitors currently inside campus.</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {activeVisitors.map((v) => (
                  <div key={v.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${v.isOverstay ? 'bg-red-50/70 border-l-4 border-red-500' : ''}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-gray-900 text-base">{v.visitorName}</span>
                        <span className="px-2.5 py-0.5 bg-gray-100 text-gray-800 text-xs font-mono font-bold rounded-full">
                          {v.passNumber}
                        </span>
                        {v.isOverstay && (
                          <span className="px-2.5 py-0.5 bg-red-600 text-white text-[11px] font-extrabold rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> OVERSTAY ({v.durationHours}h)
                          </span>
                        )}
                        {v.isEmergency && (
                          <span className="px-2.5 py-0.5 bg-amber-500 text-white text-[11px] font-extrabold rounded-full">
                            EMERGENCY
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-600">
                        Visitor Type: <strong className="text-indigo-700">{v.visitorType}</strong> | Meeting:{' '}
                        <strong>{v.personToMeet}</strong> {v.studentName ? `(Student: ${v.studentName})` : ''}
                      </div>

                      <div className="text-xs text-gray-500">
                        Purpose: "{v.purpose}" {v.vehicleNumber ? `| Vehicle: ${v.vehicleNumber}` : ''} | Entry:{' '}
                        {new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <button
                      onClick={() => handleMarkExit(v.passNumber)}
                      disabled={submitting}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-4 h-4" /> Mark Exit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GATE VEHICLE VERIFICATION */}
      {activeTab === 'VEHICLE_VERIFY' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Verify Vehicle Registration at Gate</h2>
          <form onSubmit={handleVerifyVehicle} className="flex gap-3">
            <input
              type="text"
              required
              placeholder="Enter Vehicle Number (e.g. KA-01-AB-1234)"
              value={verifyRegNo}
              onChange={(e) => setVerifyRegNo(e.target.value)}
              className="flex-1 border border-gray-300 rounded-xl p-3 text-base font-mono uppercase font-bold"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-sm flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />} Verify
            </button>
          </form>

          {vehicleCheckResult && (
            <div
              className={`p-5 rounded-2xl border-2 space-y-2 ${
                vehicleCheckResult.isApproved
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xl font-black">{vehicleCheckResult.registrationNumber}</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black ${
                    vehicleCheckResult.isApproved ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  }`}
                >
                  {vehicleCheckResult.isApproved ? 'APPROVED VEHICLE' : 'UNREGISTERED TEMPORARY'}
                </span>
              </div>
              <p className="text-sm font-semibold">Owner / Category: {vehicleCheckResult.ownerName}</p>
              <p className="text-xs">Category Type: {vehicleCheckResult.category}</p>
            </div>
          )}
        </div>
      )}

      {/* NEW VISITOR ENTRY MODAL */}
      {showEntryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" /> Log Visitor Campus Entry
            </h2>
            <form onSubmit={handleCreateVisitor} className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Visitor Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Visitor Name"
                    value={entryForm.fullName}
                    onChange={(e) => setEntryForm({ ...entryForm, fullName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Contact Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="Contact Number"
                    value={entryForm.contactNumber}
                    onChange={(e) => setEntryForm({ ...entryForm, contactNumber: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Visitor Category</label>
                <select
                  value={entryForm.visitorType}
                  onChange={(e) => setEntryForm({ ...entryForm, visitorType: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 font-semibold"
                >
                  <option value="PARENT">PARENT / GUARDIAN</option>
                  <option value="VENDOR">VENDOR / SUPPLIER</option>
                  <option value="DELIVERY">DELIVERY AGENT</option>
                  <option value="GUEST">INSTITUTIONAL GUEST</option>
                  <option value="CONTRACTOR">CONTRACTOR</option>
                  <option value="OFFICIAL">OFFICIAL INSPECTION</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              {/* Parent Student Lookup */}
              {entryForm.visitorType === 'PARENT' && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                  <label className="block font-semibold text-indigo-900 text-xs flex items-center gap-1">
                    <GraduationCap className="w-4 h-4 text-indigo-700" /> Link Student Record
                  </label>
                  <input
                    type="text"
                    placeholder="Search student by name or roll number..."
                    value={studentQuery}
                    onChange={(e) => handleStudentSearch(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs"
                  />
                  {studentResults.length > 0 && (
                    <div className="bg-white border rounded-lg max-h-32 overflow-y-auto divide-y text-xs">
                      {studentResults.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedStudent(s);
                            setEntryForm({ ...entryForm, personToMeetName: `${s.user.firstName} ${s.user.lastName}` });
                            setStudentResults([]);
                          }}
                          className="p-2 hover:bg-indigo-100 cursor-pointer font-medium"
                        >
                          {s.user.firstName} {s.user.lastName} ({s.admissionNumber})
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedStudent && (
                    <div className="text-xs font-bold text-emerald-700">
                      Linked Student: {selectedStudent.user.firstName} {selectedStudent.user.lastName} ({selectedStudent.admissionNumber})
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Person Being Visited</label>
                <input
                  type="text"
                  required
                  placeholder="Person / Staff / Student to meet"
                  value={entryForm.personToMeetName}
                  onChange={(e) => setEntryForm({ ...entryForm, personToMeetName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Purpose of Visit</label>
                <input
                  type="text"
                  required
                  placeholder="State visit purpose"
                  value={entryForm.purpose}
                  onChange={(e) => setEntryForm({ ...entryForm, purpose: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Vehicle Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. KA-01-XX-1234"
                    value={entryForm.vehicleNumber}
                    onChange={(e) => setEntryForm({ ...entryForm, vehicleNumber: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Vehicle Type</label>
                  <select
                    value={entryForm.vehicleType}
                    onChange={(e) => setEntryForm({ ...entryForm, vehicleType: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5"
                  >
                    <option value="CAR">CAR / 4-WHEELER</option>
                    <option value="TWO_WHEELER">BIKE / TWO-WHEELER</option>
                    <option value="VAN">VAN / MINI BUS</option>
                    <option value="TRUCK">TRUCK / DELIVERY</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEntryModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 text-white font-extrabold rounded-lg flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Issue Visitor Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VISITOR PASS GENERATED MODAL */}
      {showPassModal && createdPass && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-black text-gray-900">Campus Visitor Pass</h2>
            <div className="font-mono text-2xl font-black text-indigo-700 bg-indigo-50 p-2 rounded-lg">
              {createdPass.passNumber}
            </div>

            <div className="text-xs text-gray-600 text-left space-y-1 bg-gray-50 p-3 rounded-xl">
              <p>
                Visitor: <strong>{createdPass.visitor.fullName}</strong>
              </p>
              <p>
                Meeting: <strong>{createdPass.personToMeetName}</strong>
              </p>
              <p>
                Purpose: <strong>{createdPass.purpose}</strong>
              </p>
              <p>
                Entry Time: <strong>{new Date(createdPass.entryTime).toLocaleTimeString()}</strong>
              </p>
            </div>

            <button
              onClick={() => setShowPassModal(false)}
              className="w-full py-3 bg-indigo-600 text-white font-extrabold text-sm rounded-xl shadow-md"
            >
              Done / Print Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityPortal;
