import React, { useState, useEffect } from 'react';
import { lifecycleApi, AlumniProfile, StudentExitChecklist, StaffHandoverResponsibilities } from '../../api/lifecycle';
import { UserCheck, GraduationCap, ArrowRightCircle, ShieldAlert, CheckCircle, FileText, Search } from 'lucide-react';

export const StudentStaffLifecyclePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'STUDENT' | 'STAFF' | 'ALUMNI'>('STUDENT');
  const [alumniList, setAlumniList] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Student Exit Clearance Form State
  const [studentId, setStudentId] = useState('');
  const [feeClearance, setFeeClearance] = useState(true);
  const [libraryClearance, setLibraryClearance] = useState(true);
  const [assetClearance, setAssetClearance] = useState(true);
  const [documentClearance, setDocumentClearance] = useState(true);
  const [idCardReturned, setIdCardReturned] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [exitResult, setExitResult] = useState<StudentExitChecklist | null>(null);

  // Staff Handover Form State
  const [staffUserId, setStaffUserId] = useState('');
  const [handoverData, setHandoverData] = useState<StaffHandoverResponsibilities | null>(null);
  const [staffExitSuccess, setStaffExitSuccess] = useState(false);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      const data = await lifecycleApi.getAlumni();
      setAlumniList(data);
    } catch (err) {
      console.error('Failed to fetch alumni', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ALUMNI') {
      fetchAlumni();
    }
  }, [activeTab]);

  const handleProcessStudentExit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await lifecycleApi.processStudentExit(studentId, {
        feeClearance,
        libraryClearance,
        assetClearance,
        documentClearance,
        idCardReturned,
        remarks,
      });
      setExitResult(res);
    } catch (err) {
      console.error('Failed to process student exit', err);
    }
  };

  const handleCheckStaffResponsibilities = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await lifecycleApi.getStaffHandoverResponsibilities(staffUserId);
      setHandoverData(res);
      setStaffExitSuccess(false);
    } catch (err) {
      console.error('Failed to check staff responsibilities', err);
    }
  };

  const handleFinalizeStaffExit = async () => {
    try {
      await lifecycleApi.processStaffExit(staffUserId, {
        exitDate: new Date().toISOString(),
        classesReassigned: true,
        pendingMarksReassigned: true,
        approvalsReassigned: true,
        assetsReturned: true,
      });
      setStaffExitSuccess(true);
    } catch (err) {
      console.error('Failed to finalize staff exit', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <UserCheck className="w-7 h-7 text-indigo-600" />
          Institutional Student & Staff Lifecycle Center
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage institutional transitions: Student Admissions → Clearances → Graduation → Alumni, and Staff Onboarding → Handover Responsibility Verification → Exit.
        </p>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-5 border-b border-slate-100">
          <button
            onClick={() => setActiveTab('STUDENT')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
              activeTab === 'STUDENT'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Student Exit Clearance
          </button>
          <button
            onClick={() => setActiveTab('STAFF')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
              activeTab === 'STAFF'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Staff Responsibility Handover
          </button>
          <button
            onClick={() => setActiveTab('ALUMNI')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
              activeTab === 'ALUMNI'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Graduation & Alumni Registry
          </button>
        </div>
      </div>

      {/* Tab 1: Student Exit Clearance */}
      {activeTab === 'STUDENT' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-2xl">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Process Student Clearance & Exit</h2>
          <p className="text-xs text-slate-500 mb-5">
            Verify institutional departments have cleared the student before updating status to LEFT_INSTITUTION.
          </p>

          <form onSubmit={handleProcessStudentExit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Student Record ID</label>
              <input
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Enter Student ID"
              />
            </div>

            <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={feeClearance}
                  onChange={(e) => setFeeClearance(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Finance / Tuition Fee Clearance (Zero dues outstanding)
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={libraryClearance}
                  onChange={(e) => setLibraryClearance(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Library Clearance (All issued books returned or replaced)
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={assetClearance}
                  onChange={(e) => setAssetClearance(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Lab & Institutional Asset Clearance (No unreturned lab equipment)
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={documentClearance}
                  onChange={(e) => setDocumentClearance(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Original Document & Transfer Certificate (TC) Verified
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={idCardReturned}
                  onChange={(e) => setIdCardReturned(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Physical Student ID Card Surrendered
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Administrative Remarks</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Clearance approved by Dean / Registrar"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
            >
              Verify & Record Clearance
            </button>
          </form>

          {exitResult && (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Clearance Processed Successfully: {exitResult.status}
              </div>
              <p className="text-xs text-emerald-700 mt-1">
                Student status updated and clearance certificate recorded in institutional registry.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Staff Exit & Responsibility Handover */}
      {activeTab === 'STAFF' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Scan Departing Staff Responsibilities</h2>
            <p className="text-xs text-slate-500 mb-4">
              Automatically discovers active class assignments, timetable allocations, pending marks submissions, and issued assets.
            </p>

            <form onSubmit={handleCheckStaffResponsibilities} className="flex gap-3">
              <input
                type="text"
                required
                value={staffUserId}
                onChange={(e) => setStaffUserId(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Enter Departing Staff User ID"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
              >
                Inspect Handover
              </button>
            </form>
          </div>

          {handoverData && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800">Handover Obligation Checklist</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500">Assigned Classes</div>
                  <div className="text-xl font-black text-slate-800">{handoverData.classesCount}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500">Timetable Slots</div>
                  <div className="text-xl font-black text-slate-800">{handoverData.timetableEntriesCount}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500">Pending Marks Entries</div>
                  <div className="text-xl font-black text-rose-700">{handoverData.pendingMarksCount}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500">Issued Assets</div>
                  <div className="text-xl font-black text-slate-800">{handoverData.assignedAssetsCount}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Finalizing will record the exit handover and deactivate staff account upon clearance.
                </p>
                <button
                  onClick={handleFinalizeStaffExit}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 transition"
                >
                  Finalize Staff Handover & Exit
                </button>
              </div>

              {staffExitSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800">
                  Staff exit handover finalized and user account safely transitioned.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Alumni Registry */}
      {activeTab === 'ALUMNI' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-base flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              Institutional Alumni Registry ({alumniList.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading alumni records...</div>
          ) : alumniList.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No alumni records registered yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {alumniList.map((alm) => (
                <div key={alm.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition">
                  <div>
                    <div className="font-bold text-slate-800 text-base">
                      {alm.student?.user?.firstName} {alm.student?.user?.lastName}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Class of {alm.graduationYear} • {alm.programName}
                    </div>
                    {(alm.currentCompany || alm.currentRole) && (
                      <div className="text-xs text-indigo-700 font-medium mt-1">
                        {alm.currentRole} at {alm.currentCompany}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <div>{alm.student?.user?.email}</div>
                    <div>{alm.student?.user?.phone || 'No phone'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
