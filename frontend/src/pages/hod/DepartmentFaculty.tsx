import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  BookOpen,
  UserCheck,
  ShieldCheck,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  PieChart,
} from 'lucide-react';
import {
  hodPortalApi,
  DepartmentFacultyMember,
  FacultyWorkloadItem,
} from '../../api/hodPortal';

export const DepartmentFaculty: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [faculty, setFaculty] = useState<DepartmentFacultyMember[]>([]);
  const [workload, setWorkload] = useState<FacultyWorkloadItem[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'FACULTY' | 'WORKLOAD'>('FACULTY');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Assign Subject Form
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [assignForm, setAssignForm] = useState({
    facultyId: '',
    classId: '',
    sectionId: '',
    subjectId: '',
  });

  // Assign Coordinator Modal
  const [showCoordModal, setShowCoordModal] = useState<boolean>(false);
  const [coordForm, setCoordForm] = useState({
    sectionId: '',
    facultyId: '',
  });

  useEffect(() => {
    fetchData();
  }, [search]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [facRes, workloadRes, classList] = await Promise.all([
        hodPortalApi.getFaculty({ search }),
        hodPortalApi.getFacultyWorkload(),
        hodPortalApi.getClasses(),
      ]);

      setFaculty(facRes.faculty || []);
      setWorkload(workloadRes || []);
      setClasses(classList || []);

      if (facRes.faculty.length > 0 && classList.length > 0) {
        setAssignForm((prev) => ({
          ...prev,
          facultyId: facRes.faculty[0].id,
          classId: classList[0].id,
        }));
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load department faculty.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await hodPortalApi.assignFacultySubject(assignForm);
      setSuccessMsg('Subject assigned to faculty member successfully.');
      setShowAssignModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to assign subject.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await hodPortalApi.assignClassCoordinator(coordForm.sectionId, coordForm.facultyId);
      setSuccessMsg('Class Coordinator designated successfully!');
      setShowCoordModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to assign coordinator.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading department faculty roster...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            Department Faculty & Workload Governance
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage active department faculty members, assign courses/sections, appoint Class Coordinators, and monitor teaching period workloads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Assign Course
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

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('FACULTY')}
            className={`pb-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'FACULTY'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" /> Faculty Directory ({faculty.length})
          </button>
          <button
            onClick={() => setActiveTab('WORKLOAD')}
            className={`pb-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'WORKLOAD'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <PieChart className="w-4 h-4" /> Workload Summary ({workload.length})
          </button>
        </div>

        {activeTab === 'FACULTY' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search faculty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Tab 1: Faculty Directory */}
      {activeTab === 'FACULTY' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {faculty.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No faculty members found in department.</div>
          ) : (
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-100 text-xs font-semibold text-gray-600 uppercase">
                <tr>
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Code / Email</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Assigned Courses</th>
                  <th className="py-3 px-4">Class Coordinator</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {faculty.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {f.firstName} {f.lastName}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div className="font-mono text-indigo-700 font-semibold">{f.employeeCode}</div>
                      <div className="text-gray-500">{f.email}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-gray-800">{f.designation}</td>
                    <td className="py-3 px-4 text-xs">
                      <span className="font-bold text-gray-900">{f.assignedSubjectsCount} course(s)</span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {f.isCoordinator ? (
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded font-bold">
                          {f.coordinatorSection}
                        </span>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setCoordForm({ sectionId: classes[0]?.sections[0]?.id || '', facultyId: f.id });
                          setShowCoordModal(true);
                        }}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-lg"
                      >
                        Appoint Coordinator
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 2: Workload Summary */}
      {activeTab === 'WORKLOAD' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-100 text-xs font-semibold text-gray-600 uppercase">
              <tr>
                <th className="py-3 px-4">Faculty Member</th>
                <th className="py-3 px-4">Weekly Periods</th>
                <th className="py-3 px-4">Assigned Courses</th>
                <th className="py-3 px-4">Approved Extra Classes</th>
                <th className="py-3 px-4">Workload Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {workload.map((w) => (
                <tr key={w.facultyId} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-bold text-gray-900">
                    {w.facultyName} <span className="text-xs font-mono text-gray-500">({w.employeeCode})</span>
                  </td>
                  <td className="py-3 px-4 font-extrabold text-indigo-600">{w.weeklyPeriodCount} periods</td>
                  <td className="py-3 px-4 text-xs font-semibold">{w.assignedCoursesCount} courses</td>
                  <td className="py-3 px-4 text-xs font-semibold text-emerald-700">{w.approvedExtraClassesCount} sessions</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        w.workloadStatus === 'HIGH_WORKLOAD'
                          ? 'bg-red-100 text-red-800'
                          : w.workloadStatus === 'UNDER_UTILIZED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {w.workloadStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Subject Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Assign Subject to Faculty</h2>
            <form onSubmit={handleAssignSubject} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Faculty Member</label>
                <select
                  value={assignForm.facultyId}
                  onChange={(e) => setAssignForm({ ...assignForm, facultyId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium"
                >
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.firstName} {f.lastName} ({f.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Class</label>
                <select
                  value={assignForm.classId}
                  onChange={(e) => setAssignForm({ ...assignForm, classId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Subject ID / Code</label>
                <input
                  type="text"
                  required
                  placeholder="Subject ID"
                  value={assignForm.subjectId}
                  onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Assign Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Coordinator Modal */}
      {showCoordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Appoint Class Coordinator</h2>
            <form onSubmit={handleAssignCoordinator} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Section</label>
                <select
                  value={coordForm.sectionId}
                  onChange={(e) => setCoordForm({ ...coordForm, sectionId: e.target.value })}
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
                <label className="block font-semibold text-gray-700 mb-1">Faculty Member</label>
                <select
                  value={coordForm.facultyId}
                  onChange={(e) => setCoordForm({ ...coordForm, facultyId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium"
                >
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.firstName} {f.lastName} ({f.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCoordModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Appoint Coordinator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentFaculty;
