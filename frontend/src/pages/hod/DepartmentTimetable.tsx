import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  UserCheck,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { hodPortalApi } from '../../api/hodPortal';

export const DepartmentTimetable: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Substitute Modal State
  const [showSubModal, setShowSubModal] = useState<boolean>(false);
  const [subForm, setSubForm] = useState({
    originalFacultyId: '',
    substituteFacultyId: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    timeSlotId: '',
    date: new Date().toISOString().split('T')[0],
    reason: '',
  });

  // WhatsApp Config Modal State
  const [showWaModal, setShowWaModal] = useState<boolean>(false);
  const [waForm, setWaForm] = useState({
    sectionId: '',
    whatsAppGroupId: '',
    whatsAppGroupStatus: 'ACTIVE',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ttList, classList, facRes] = await Promise.all([
        hodPortalApi.getTimetable(),
        hodPortalApi.getClasses(),
        hodPortalApi.getFaculty(),
      ]);

      setTimetable(ttList || []);
      setClasses(classList || []);
      setFaculty(facRes.faculty || []);

      if (classList.length > 0 && classList[0].sections.length > 0) {
        setWaForm((prev) => ({
          ...prev,
          sectionId: classList[0].sections[0].id,
          whatsAppGroupId: classList[0].sections[0].whatsAppGroupId || '',
        }));
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load department timetable data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubstitute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await hodPortalApi.assignSubstitute(subForm);
      setSuccessMsg('Substitute faculty assigned successfully!');
      setShowSubModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to assign substitute faculty.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await hodPortalApi.updateWhatsAppConfig(waForm.sectionId, {
        whatsAppGroupId: waForm.whatsAppGroupId,
        whatsAppGroupStatus: waForm.whatsAppGroupStatus,
      });
      setSuccessMsg('WhatsApp communication group settings updated successfully.');
      setShowWaModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update WhatsApp group settings.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading department timetable schedule...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-indigo-600" />
            Department Timetable & Substitute Governance
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage weekly teaching schedules, assign substitute teachers with 5-way conflict validation, and configure section-wise official WhatsApp communication groups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSubModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <UserCheck className="w-4 h-4" /> Assign Substitute
          </button>
          <button
            onClick={() => setShowWaModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <MessageSquare className="w-4 h-4" /> WhatsApp Config
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

      {/* Timetable Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {timetable.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No active timetable entries configured for department.</div>
        ) : (
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-100 text-xs font-semibold text-gray-600 uppercase">
              <tr>
                <th className="py-3 px-4">Day</th>
                <th className="py-3 px-4">Period & Time</th>
                <th className="py-3 px-4">Class & Section</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Assigned Faculty</th>
                <th className="py-3 px-4">Room</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {timetable.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-bold text-gray-900">{t.dayOfWeek}</td>
                  <td className="py-3 px-4 text-xs">
                    <div className="font-semibold text-gray-800">{t.timeSlot?.name}</div>
                    <div className="text-gray-500 font-mono">
                      {t.timeSlot?.startTime} - {t.timeSlot?.endTime}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs font-bold text-indigo-700">
                    {t.class?.name} ({t.section?.name})
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-gray-800">
                    {t.subject?.name} <span className="font-mono text-gray-500">({t.subject?.code})</span>
                  </td>
                  <td className="py-3 px-4 text-xs font-semibold text-gray-900">
                    {t.faculty?.user?.firstName} {t.faculty?.user?.lastName}
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-emerald-700">{t.room?.roomNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Assign Substitute Modal */}
      {showSubModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Assign Substitute Faculty</h2>
            <form onSubmit={handleAssignSubstitute} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Timetable Session</label>
                <select
                  onChange={(e) => {
                    const selectedEntry = timetable.find((t) => t.id === e.target.value);
                    if (selectedEntry) {
                      setSubForm({
                        ...subForm,
                        originalFacultyId: selectedEntry.facultyId,
                        classId: selectedEntry.classId,
                        sectionId: selectedEntry.sectionId,
                        subjectId: selectedEntry.subjectId,
                        timeSlotId: selectedEntry.timeSlotId,
                      });
                    }
                  }}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium"
                >
                  <option value="">Select session to cover...</option>
                  {timetable.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.dayOfWeek} — {t.class?.name} ({t.subject?.name}) with {t.faculty?.user?.firstName} {t.faculty?.user?.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Substitute Faculty</label>
                <select
                  value={subForm.substituteFacultyId}
                  onChange={(e) => setSubForm({ ...subForm, substituteFacultyId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium"
                >
                  <option value="">Select substitute teacher...</option>
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.firstName} {f.lastName} ({f.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={subForm.date}
                  onChange={(e) => setSubForm({ ...subForm, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Original teacher on casual leave"
                  value={subForm.reason}
                  onChange={(e) => setSubForm({ ...subForm, reason: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Confirm Substitute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Config Modal */}
      {showWaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Configure Section WhatsApp Group</h2>
            <form onSubmit={handleUpdateWhatsApp} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Target Section</label>
                <select
                  value={waForm.sectionId}
                  onChange={(e) => {
                    const secId = e.target.value;
                    const sec = classes.flatMap((c) => c.sections).find((s) => s.id === secId);
                    setWaForm({
                      ...waForm,
                      sectionId: secId,
                      whatsAppGroupId: sec?.whatsAppGroupId || '',
                      whatsAppGroupStatus: sec?.whatsAppGroupStatus || 'ACTIVE',
                    });
                  }}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium"
                >
                  {classes.flatMap((c) =>
                    c.sections.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {c.name} — {s.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Official Group Identifier / Link</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WA-GRP-CS-10A"
                  value={waForm.whatsAppGroupId}
                  onChange={(e) => setWaForm({ ...waForm, whatsAppGroupId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Group Status</label>
                <select
                  value={waForm.whatsAppGroupStatus}
                  onChange={(e) => setWaForm({ ...waForm, whatsAppGroupStatus: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING_SETUP">PENDING SETUP</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowWaModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Save WhatsApp Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentTimetable;
