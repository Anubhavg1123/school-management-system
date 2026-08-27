import React, { useState, useEffect } from 'react';
import { registrationsApi } from '../../api/registrations';
import { leaveApi } from '../../api/leave';
import { attendanceApi } from '../../api/attendance';
import { academicApi } from '../../api/academic';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { RegistrationRequest, FacultyLeave, Department, AttendanceStatusEnum } from '../../types';
import {
  UserCheck,
  CheckCircle,
  XCircle,
  Eye,
  Building2,
  Calendar,
  Phone,
  Mail,
  User,
  Clock,
  FileSpreadsheet,
  AlertTriangle,
  History,
  Archive,
  RefreshCw,
  Search,
} from 'lucide-react';

export const RegistrationApprovals: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'REGISTRATIONS' | 'LEAVES' | 'CORRECTIONS' | 'ARCHIVE'>('REGISTRATIONS');

  // Registrations state
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<RegistrationRequest | null>(null);

  // Approval Modal State
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [approveRole, setApproveRole] = useState('OFFICE_ADMIN');
  const [approveStaffDesignation, setApproveStaffDesignation] = useState('OFFICE_SUPPORT');
  const [approveDeptId, setApproveDeptId] = useState('');
  const [approveCode, setApproveCode] = useState('');
  const [approveDesignation, setApproveDesignation] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  const [deferRoleAssignment, setDeferRoleAssignment] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Rejection Modal State
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Under Review Action
  const [isReviewing, setIsReviewing] = useState(false);

  // Leave Requests state
  const [leaves, setLeaves] = useState<FacultyLeave[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<FacultyLeave | null>(null);
  const [isLeaveRejectOpen, setIsLeaveRejectOpen] = useState(false);
  const [leaveRejectReason, setLeaveRejectReason] = useState('');

  // Attendance Corrections state
  const [corrections, setCorrections] = useState<any[]>([]);

  // Archive (Recently Approved & Rejected)
  const [recentApproved, setRecentApproved] = useState<RegistrationRequest[]>([]);
  const [recentRejected, setRecentRejected] = useState<RegistrationRequest[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pendingRegs, depts, pendingLeaves, recentData] = await Promise.all([
        registrationsApi.getPending(),
        academicApi.getDepartments(),
        leaveApi.getPendingLeaves(),
        registrationsApi.getRecentlyReviewed(15),
      ]);

      if (pendingRegs.success && pendingRegs.data) setRequests(pendingRegs.data);
      if (depts.success && depts.data) setDepartments(depts.data);
      if (pendingLeaves.success && pendingLeaves.data) setLeaves(pendingLeaves.data);
      if (recentData.success && recentData.data) {
        setRecentApproved(recentData.data.approved || []);
        setRecentRejected(recentData.data.rejected || []);
      }
    } catch (err) {
      console.error('Failed to load approval center data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openApproveModal = (req: RegistrationRequest) => {
    setSelectedReq(req);
    setApproveDeptId(req.departmentId || '');
    setApproveCode(`ID-${Date.now().toString().slice(-5)}`);
    setApproveNotes('');
    setDeferRoleAssignment(false);

    // Smart default based on applicant category
    const cat = req.user.userCategory;
    if (cat === 'ADMINISTRATIVE') {
      setApproveRole('OFFICE_ADMIN');
      setApproveStaffDesignation('OFFICE_SUPPORT');
      setApproveDesignation('Administrative Office Officer');
    } else if (cat === 'NON_TEACHING_STAFF') {
      setApproveRole('NON_FACULTY');
      setApproveStaffDesignation('SECURITY');
      setApproveDesignation('Campus Support Staff');
    } else if (cat === 'TEACHING_STAFF') {
      setApproveRole('FACULTY');
      setApproveStaffDesignation('');
      setApproveDesignation('Teacher / Faculty');
    } else if (cat === 'STUDENT') {
      setApproveRole('STUDENT');
      setApproveStaffDesignation('');
      setApproveDesignation('Student');
    } else {
      setApproveRole('PARENT');
      setApproveStaffDesignation('');
      setApproveDesignation('Parent / Guardian');
    }

    setIsApproveOpen(true);
  };

  const openRejectModal = (req: RegistrationRequest) => {
    setSelectedReq(req);
    setRejectReason('');
    setIsRejectOpen(true);
  };

  const handleMarkUnderReview = async (req: RegistrationRequest) => {
    setIsReviewing(true);
    try {
      await registrationsApi.markUnderReview(req.id, 'Application marked under review by Principal.');
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update review status.');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    setIsApproving(true);
    try {
      const finalRole = deferRoleAssignment ? undefined : approveRole;
      const finalDesignation =
        approveRole === 'NON_FACULTY' ? approveStaffDesignation : approveDesignation;

      await registrationsApi.approve(selectedReq.id, {
        role: finalRole,
        departmentId: approveDeptId || undefined,
        employeeOrAdmissionCode: approveCode || undefined,
        designation: finalDesignation || undefined,
        reviewerNotes: approveNotes || undefined,
      });
      setIsApproveOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Approval failed.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    if (!rejectReason || rejectReason.trim().length < 3) {
      alert('A valid rejection reason must be provided (min 3 chars).');
      return;
    }

    setIsRejecting(true);
    try {
      await registrationsApi.reject(selectedReq.id, rejectReason);
      setIsRejectOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Rejection failed.');
    } finally {
      setIsRejecting(false);
    }
  };

  // Leave Actions
  const handleApproveLeave = async (leaveId: string) => {
    try {
      await leaveApi.reviewLeave(leaveId, 'APPROVED');
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to approve leave.');
    }
  };

  const handleRejectLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave) return;

    try {
      await leaveApi.reviewLeave(selectedLeave.id, 'REJECTED', leaveRejectReason);
      setIsLeaveRejectOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to reject leave.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading Principal Approval Center..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-brand-600" />
            <span>Executive Approval Command Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review applicant identities, faculty leave submissions, and attendance adjustment petitions.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Refresh Queue
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('REGISTRATIONS')}
          className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'REGISTRATIONS'
              ? 'border-brand-600 text-brand-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>User Registrations</span>
          {requests.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-brand-100 text-brand-700 font-bold">
              {requests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('LEAVES')}
          className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'LEAVES'
              ? 'border-brand-600 text-brand-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Faculty Leaves</span>
          {leaves.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700 font-bold">
              {leaves.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ARCHIVE')}
          className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'ARCHIVE'
              ? 'border-brand-600 text-brand-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Recently Reviewed Archive</span>
        </button>
      </div>

      {/* TAB 1: REGISTRATIONS */}
      {activeTab === 'REGISTRATIONS' && (
        <Card title={`Institutional Registration & Role Governance Queue (${requests.length})`} headerIcon={<UserCheck className="w-5 h-5" />} noPadding>
          {requests.length === 0 ? (
            <EmptyState
              title="No Pending Registrations"
              description="There are currently no applicant accounts awaiting review, under examination, or awaiting operational role assignment."
              icon={<UserCheck className="w-12 h-12 text-slate-300" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="p-3.5">User Name & Username</th>
                    <th className="p-3.5">Requested Category</th>
                    <th className="p-3.5">Current Status</th>
                    <th className="p-3.5">Assigned Role</th>
                    <th className="p-3.5">Assignment Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((r) => {
                    const isApprovedPendingRole =
                      r.status === 'APPROVED_PENDING_ROLE' ||
                      r.user.status === 'APPROVED_PENDING_ROLE';
                    const activeRole = r.user.userRoles?.[0]?.role?.displayName || r.user.activeRole || null;

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">
                            {r.user.firstName} {r.user.lastName}
                          </div>
                          <div className="text-slate-500 text-[11px] font-mono">
                            @{r.user.username || 'n/a'} • {r.user.email}
                          </div>
                          {r.applicationNotes && (
                            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 italic">
                              "{r.applicationNotes}"
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                            {r.user.userCategory ? r.user.userCategory.replace(/_/g, ' ') : 'APPLICANT'}
                          </span>
                          {r.department && (
                            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" /> {r.department.name}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          {isApprovedPendingRole ? (
                            <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                              APPROVED — ROLE REQUIRED
                            </span>
                          ) : (
                            <Badge variant={r.status === 'UNDER_REVIEW' ? 'warning' : 'default'}>
                              {r.status.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </td>
                        <td className="p-3.5">
                          {isApprovedPendingRole || !r.user.userRoles?.length ? (
                            <span className="text-amber-700 font-medium text-[11px] italic">
                              None (Assignment Required)
                            </span>
                          ) : (
                            <Badge variant="primary">{activeRole}</Badge>
                          )}
                        </td>
                        <td className="p-3.5">
                          {isApprovedPendingRole ? (
                            <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> Role Assignment Required
                            </span>
                          ) : r.status === 'UNDER_REVIEW' ? (
                            <span className="text-[11px] text-indigo-600 font-medium flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Under Examination
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-medium">
                              Pending Verification
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.status === 'PENDING' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkUnderReview(r)}
                                isLoading={isReviewing}
                              >
                                Review
                              </Button>
                            )}
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => openApproveModal(r)}
                              leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                            >
                              {isApprovedPendingRole ? 'Assign Role' : 'Approve'}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => openRejectModal(r)}
                              leftIcon={<XCircle className="w-3.5 h-3.5" />}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: FACULTY LEAVES */}
      {activeTab === 'LEAVES' && (
        <Card title={`Pending Faculty Leave Petitions (${leaves.length})`} headerIcon={<Calendar className="w-5 h-5" />} noPadding>
          {leaves.length === 0 ? (
            <EmptyState
              title="No Pending Leave Requests"
              description="There are currently no faculty leave applications awaiting executive approval."
              icon={<Calendar className="w-12 h-12 text-slate-300" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="p-3.5">Faculty Member</th>
                    <th className="p-3.5">Leave Type</th>
                    <th className="p-3.5">Duration & Dates</th>
                    <th className="p-3.5">Reason</th>
                    <th className="p-3.5">Submitted</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaves.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">
                          {l.user?.firstName} {l.user?.lastName}
                        </div>
                        <div className="text-slate-500 text-[11px]">{l.user?.email}</div>
                        {l.user?.facultyProfile?.department && (
                          <div className="text-[10px] text-brand-600 font-semibold">
                            {l.user.facultyProfile.department.name}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <Badge variant="warning">{l.leaveType.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{l.totalDays} Day(s)</div>
                        <div className="text-[11px] text-slate-500">
                          {new Date(l.startDate).toLocaleDateString()} &rarr; {new Date(l.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-xs">{l.reason}</td>
                      <td className="p-3.5 text-slate-500 text-[11px]">{new Date(l.createdAt).toLocaleDateString()}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleApproveLeave(l.id)}
                            leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setSelectedLeave(l);
                              setLeaveRejectReason('');
                              setIsLeaveRejectOpen(true);
                            }}
                            leftIcon={<XCircle className="w-3.5 h-3.5" />}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: RECENTLY REVIEWED ARCHIVE */}
      {activeTab === 'ARCHIVE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recently Approved */}
          <Card title={`Recently Approved Users (${recentApproved.length})`} headerIcon={<CheckCircle className="w-5 h-5 text-emerald-600" />} noPadding>
            {recentApproved.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No recently approved accounts.</div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {recentApproved.map((a) => (
                  <div key={a.id} className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">
                        {a.user.firstName} {a.user.lastName}
                      </span>
                      <span className="ml-2 text-slate-500 text-[11px] font-mono">{a.user.email}</span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Category: {a.user.userCategory} {a.department && `• ${a.department.name}`}
                      </div>
                    </div>
                    <Badge variant="success">Approved</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recently Rejected */}
          <Card title={`Recently Rejected Applications (${recentRejected.length})`} headerIcon={<XCircle className="w-5 h-5 text-rose-600" />} noPadding>
            {recentRejected.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No recently rejected applications.</div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {recentRejected.map((r) => (
                  <div key={r.id} className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">
                        {r.user.firstName} {r.user.lastName}
                      </span>
                      <span className="ml-2 text-slate-500 text-[11px] font-mono">{r.user.email}</span>
                      {r.rejectionReason && (
                        <div className="text-[10px] text-rose-600 mt-0.5 font-medium">
                          Reason: {r.rejectionReason}
                        </div>
                      )}
                    </div>
                    <Badge variant="danger">Rejected</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* APPROVE REGISTRATION & ROLE ASSIGNMENT MODAL */}
      <Modal
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        title="Review Applicant & Assign Operational Role"
      >
        <form onSubmit={handleApproveSubmit} className="space-y-4 text-xs">
          {/* Applicant Info */}
          <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl space-y-1">
            <p className="font-bold text-brand-900 text-sm">
              {selectedReq?.user.firstName} {selectedReq?.user.lastName} (@{selectedReq?.user.username})
            </p>
            <p className="text-[11px] text-brand-700">
              Email: <strong>{selectedReq?.user.email}</strong> | Registered Category:{' '}
              <span className="font-bold underline">{selectedReq?.user.userCategory}</span>
            </p>
            {selectedReq?.applicationNotes && (
              <p className="text-[11px] text-slate-600 italic mt-1">
                Statement: "{selectedReq?.applicationNotes}"
              </p>
            )}
          </div>

          {/* Role Assignment Option Toggle */}
          <div className="p-3 border border-amber-200 bg-amber-50/60 rounded-xl space-y-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={deferRoleAssignment}
                onChange={(e) => setDeferRoleAssignment(e.target.checked)}
                className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="font-bold text-amber-900">
                  Approve Application without Operational Role
                </span>
                <p className="text-[11px] text-amber-700 leading-snug">
                  Sets account status to <strong>APPROVED — ROLE ASSIGNMENT REQUIRED</strong>. The applicant will be blocked from logging in until an authorized administrator assigns an operational role.
                </p>
              </div>
            </label>
          </div>

          {/* Operational Role Selectors (Active when not deferred) */}
          {!deferRoleAssignment && (
            <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-brand-600" />
                <span>Operational Role & Permissions Mapping</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Operational Login Role *"
                  required
                  value={approveRole}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setApproveRole(newRole);
                    if (newRole === 'NON_FACULTY') setApproveStaffDesignation('SECURITY');
                  }}
                  options={[
                    { value: 'OFFICE_ADMIN', label: 'Academic Office Administrator (Office)' },
                    { value: 'FACULTY', label: 'Faculty / Teacher' },
                    { value: 'NON_FACULTY', label: 'Non-Faculty Staff (Support / Security / Driver / Attender)' },
                    { value: 'STUDENT', label: 'Student Enrollee' },
                    { value: 'PARENT', label: 'Parent / Guardian' },
                  ]}
                />

                {approveRole === 'NON_FACULTY' ? (
                  <Select
                    label="Operational Staff Designation *"
                    required
                    value={approveStaffDesignation}
                    onChange={(e) => setApproveStaffDesignation(e.target.value)}
                    options={[
                      { value: 'OFFICE_SUPPORT', label: 'Office Support / Attender' },
                      { value: 'ATTENDER', label: 'Campus Attender / Helper' },
                      { value: 'SECURITY', label: 'Campus Security Officer' },
                      { value: 'DRIVER', label: 'Transport Vehicle Driver' },
                      { value: 'MAINTENANCE', label: 'Facilities / Maintenance Staff' },
                      { value: 'OTHER_NON_FACULTY', label: 'Other Non-Faculty' },
                    ]}
                  />
                ) : (
                  <Input
                    label="Designation / Title"
                    value={approveDesignation}
                    onChange={(e) => setApproveDesignation(e.target.value)}
                    placeholder={approveRole === 'FACULTY' ? 'e.g. Mathematics Teacher / Primary Teacher' : 'e.g. Office Administrator'}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Staff / Admission ID Code"
                  value={approveCode}
                  onChange={(e) => setApproveCode(e.target.value)}
                  placeholder="e.g. EMP-2026-001"
                />
                {approveRole === 'FACULTY' && (
                  <Input
                    label="Academic Designation"
                    value={approveDesignation}
                    onChange={(e) => setApproveDesignation(e.target.value)}
                    placeholder="e.g. Assistant Professor"
                  />
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Reviewer Notes / Assignment Justification (Audited)
            </label>
            <textarea
              rows={2}
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
              placeholder="Record justification for role assignment or approval notes..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={deferRoleAssignment ? 'secondary' : 'success'}
              type="submit"
              isLoading={isApproving}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              {deferRoleAssignment ? 'Approve (Role Required)' : 'Approve & Activate Account'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* REJECT REGISTRATION MODAL */}
      <Modal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="Reject Application Request"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-900 rounded-xl text-xs">
            <p className="font-bold">
              Rejecting applicant: {selectedReq?.user.firstName} {selectedReq?.user.lastName}
            </p>
            <p className="text-[11px] text-rose-700 mt-0.5">
              The user account will remain inactive and prevented from signing in.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Mandatory Rejection Justification *
            </label>
            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="State the regulatory or credential reason for rejection..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" isLoading={isRejecting} leftIcon={<XCircle className="w-4 h-4" />}>
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>

      {/* REJECT LEAVE MODAL */}
      <Modal
        isOpen={isLeaveRejectOpen}
        onClose={() => setIsLeaveRejectOpen(false)}
        title="Decline Faculty Leave Application"
      >
        <form onSubmit={handleRejectLeaveSubmit} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Provide the administrative reason for declining this leave application for{' '}
            <strong>
              {selectedLeave?.user?.firstName} {selectedLeave?.user?.lastName}
            </strong>.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Decline Reason</label>
            <textarea
              rows={3}
              value={leaveRejectReason}
              onChange={(e) => setLeaveRejectReason(e.target.value)}
              placeholder="e.g. Critical academic examination duties scheduled during requested dates..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsLeaveRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit">
              Decline Leave
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
