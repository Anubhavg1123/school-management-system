import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Calendar,
  Clock,
  Car,
  CheckCircle,
  AlertCircle,
  Plus,
  Loader2,
  PieChart,
  ShieldAlert,
} from 'lucide-react';
import {
  facultyPortalApi,
  FacultyLeave,
  ExtraClass,
  FacultyVehicle,
  AssignedClass,
} from '../../api/facultyPortal';

export const FacultyServices: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([]);
  const [leaves, setLeaves] = useState<FacultyLeave[]>([]);
  const [extraClasses, setExtraClasses] = useState<ExtraClass[]>([]);
  const [vehicles, setVehicles] = useState<FacultyVehicle[]>([]);
  const [workload, setWorkload] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'LEAVE' | 'EXTRA_CLASS' | 'VEHICLE' | 'WORKLOAD'>('LEAVE');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form States
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Leave Form
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'CASUAL',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Extra Class Form
  const [showExtraModal, setShowExtraModal] = useState<boolean>(false);
  const [extraForm, setExtraForm] = useState({
    sectionId: '',
    roomId: 'R-FAC-101', // Fallback room ID
    date: '',
    startTime: '14:00',
    endTime: '15:00',
    reason: '',
  });

  // Vehicle Form
  const [showVehicleModal, setShowVehicleModal] = useState<boolean>(false);
  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: '',
    vehicleType: 'FOUR_WHEELER',
    makeModel: '',
    color: '',
    registrationDetails: '',
  });

  useEffect(() => {
    fetchServicesData();
  }, []);

  const fetchServicesData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [classesRes, leaveList, extraList, vehicleList, workloadData] = await Promise.all([
        facultyPortalApi.getAssignedClasses(),
        facultyPortalApi.getLeaves(),
        facultyPortalApi.getExtraClasses(),
        facultyPortalApi.getVehicles(),
        facultyPortalApi.getWorkload(),
      ]);

      const loadedClasses = classesRes.subjectAssignments || [];
      setAssignedClasses(loadedClasses);
      if (loadedClasses.length > 0) {
        setExtraForm((prev) => ({ ...prev, sectionId: loadedClasses[0].sectionId }));
      }

      setLeaves(leaveList);
      setExtraClasses(extraList);
      setVehicles(vehicleList);
      setWorkload(workloadData);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load faculty services data.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await facultyPortalApi.requestLeave(leaveForm);
      setSuccessMsg('Leave application submitted for administrative review.');
      setShowLeaveModal(false);
      setLeaveForm({ leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' });
      const updated = await facultyPortalApi.getLeaves();
      setLeaves(updated);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit leave application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestExtraClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const targetClass = assignedClasses.find((c) => c.sectionId === extraForm.sectionId);
      if (!targetClass) throw new Error('Selected class section not found.');

      await facultyPortalApi.requestExtraClass({
        classId: targetClass.classId,
        sectionId: targetClass.sectionId,
        subjectId: targetClass.subjectId,
        roomId: extraForm.roomId,
        date: extraForm.date,
        startTime: extraForm.startTime,
        endTime: extraForm.endTime,
        reason: extraForm.reason,
      });

      setSuccessMsg('Extra class request submitted with conflict checking!');
      setShowExtraModal(false);
      setExtraForm({
        sectionId: assignedClasses[0]?.sectionId || '',
        roomId: 'R-FAC-101',
        date: '',
        startTime: '14:00',
        endTime: '15:00',
        reason: '',
      });
      const updated = await facultyPortalApi.getExtraClasses();
      setExtraClasses(updated);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to request extra class.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await facultyPortalApi.registerVehicle(vehicleForm);
      setSuccessMsg('Vehicle registered successfully! Pending parking permit review.');
      setShowVehicleModal(false);
      setVehicleForm({
        vehicleNumber: '',
        vehicleType: 'FOUR_WHEELER',
        makeModel: '',
        color: '',
        registrationDetails: '',
      });
      const updated = await facultyPortalApi.getVehicles();
      setVehicles(updated);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to register vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading faculty administrative services...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-indigo-600" />
            Faculty Administrative Services
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Self-service portal for leave applications, extra/remedial class scheduling, campus vehicle registration, and workload analytics.
          </p>
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
          onClick={() => setActiveTab('LEAVE')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'LEAVE'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4" /> Leave Management ({leaves.length})
        </button>
        <button
          onClick={() => setActiveTab('EXTRA_CLASS')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'EXTRA_CLASS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4" /> Remedial / Extra Classes ({extraClasses.length})
        </button>
        <button
          onClick={() => setActiveTab('VEHICLE')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'VEHICLE'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Car className="w-4 h-4" /> Vehicle Registration ({vehicles.length})
        </button>
        <button
          onClick={() => setActiveTab('WORKLOAD')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'WORKLOAD'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <PieChart className="w-4 h-4" /> Workload Summary
        </button>
      </div>

      {/* Tab 1: Leave Management */}
      {activeTab === 'LEAVE' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowLeaveModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Apply for Leave
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {leaves.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No leave records submitted yet.</div>
            ) : (
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-100 text-xs font-semibold text-gray-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Total Days</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaves.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-gray-900">{l.leaveType}</td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-800">{l.totalDays} day(s)</td>
                      <td className="py-3 px-4 text-xs text-gray-700">{l.reason}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            l.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : l.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Extra Classes */}
      {activeTab === 'EXTRA_CLASS' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowExtraModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Request Extra Class
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {extraClasses.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No extra class requests submitted.</div>
            ) : (
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-100 text-xs font-semibold text-gray-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">Class & Section</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Room</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {extraClasses.map((ec) => (
                    <tr key={ec.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {ec.class?.name} — {ec.section?.name}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-gray-800">{ec.subject?.name}</td>
                      <td className="py-3 px-4 text-xs font-mono text-gray-600">
                        {ec.date} ({ec.startTime} - {ec.endTime})
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-700">{ec.room?.roomNumber}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            ec.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ec.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Vehicle Registration */}
      {activeTab === 'VEHICLE' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowVehicleModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Register Vehicle
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {vehicles.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No vehicles registered yet.</div>
            ) : (
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-100 text-xs font-semibold text-gray-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">Vehicle Number</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Make / Model</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">{v.vehicleNumber}</td>
                      <td className="py-3 px-4 text-xs font-medium text-gray-800">{v.vehicleType}</td>
                      <td className="py-3 px-4 text-xs text-gray-700">{v.makeModel || 'N/A'}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            v.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : v.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Workload Analytics */}
      {activeTab === 'WORKLOAD' && workload && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Weekly Periods Taught
              </p>
              <p className="text-3xl font-extrabold text-indigo-600 mt-1">
                {workload.weeklyPeriodCount || 0} Periods
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-4">Calculated from institutional active timetable grid.</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Assigned Subject Courses
              </p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">
                {workload.totalAssignedClasses || 0} Courses
              </p>
            </div>
            <p className="text-xs text-indigo-600 font-medium mt-4">
              Subjects: {workload.subjectsTaught?.join(', ') || 'None'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Approved Extra Classes
              </p>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                {workload.approvedExtraClassesCount || 0} Sessions
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-4">Approved remedial lectures.</p>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Apply for Faculty Leave</h2>
            <form onSubmit={handleApplyLeave} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Leave Type</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="MEDICAL">Medical Leave</option>
                  <option value="DUTY">On-Duty Sabbatical</option>
                  <option value="EARNED">Earned Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Reason</label>
                <textarea
                  rows={3}
                  required
                  placeholder="State reason for absence..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extra Class Modal */}
      {showExtraModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Request Extra / Remedial Class</h2>
            <form onSubmit={handleRequestExtraClass} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Target Section</label>
                <select
                  value={extraForm.sectionId}
                  onChange={(e) => setExtraForm({ ...extraForm, sectionId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium"
                >
                  {assignedClasses.map((ac) => (
                    <option key={ac.id} value={ac.sectionId}>
                      {ac.className} — {ac.sectionName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={extraForm.date}
                  onChange={(e) => setExtraForm({ ...extraForm, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={extraForm.startTime}
                    onChange={(e) => setExtraForm({ ...extraForm, startTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={extraForm.endTime}
                    onChange={(e) => setExtraForm({ ...extraForm, endTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Reason</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Remedial / Revision class..."
                  value={extraForm.reason}
                  onChange={(e) => setExtraForm({ ...extraForm, reason: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowExtraModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Registration Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Register Vehicle</h2>
            <form onSubmit={handleRegisterVehicle} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Vehicle Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-01-FC-2026"
                  value={vehicleForm.vehicleNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Vehicle Type</label>
                <select
                  value={vehicleForm.vehicleType}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2"
                >
                  <option value="FOUR_WHEELER">4-Wheeler (Car)</option>
                  <option value="TWO_WHEELER">2-Wheeler (Motorcycle/Scooter)</option>
                  <option value="BICYCLE">Bicycle</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Make / Model (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Honda City"
                  value={vehicleForm.makeModel}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, makeModel: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyServices;
