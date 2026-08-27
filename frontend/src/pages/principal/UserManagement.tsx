import React, { useEffect, useState } from 'react';
import { apiClient as api } from '../../api/client';
import { assignOperationalRole, suspendUserAccount, activateUserAccount } from '../../api/permission';
import { academicApi } from '../../api/academic';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Department } from '../../types';
import {
  Users,
  Shield,
  UserX,
  UserCheck,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Building2,
  Lock,
  Edit,
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Role Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState('OFFICE_ADMIN');
  const [selectedStaffDesignation, setSelectedStaffDesignation] = useState('OFFICE_SUPPORT');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  const fetchUsersAndDepts = async () => {
    setLoading(true);
    try {
      const [usersRes, deptsRes] = await Promise.all([
        api.get('/users'),
        academicApi.getDepartments(),
      ]);
      setUsers(usersRes.data.data);
      if (deptsRes.success && deptsRes.data) {
        setDepartments(deptsRes.data);
      }
    } catch (err) {
      console.error('Failed to load user management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndDepts();
  }, []);

  const openRoleModal = (user: any) => {
    setSelectedUser(user);
    const existingRole = user.userRoles?.[0]?.role?.name || user.activeRole || 'OFFICE_ADMIN';
    setSelectedRole(existingRole === 'SUPER_ADMIN' ? 'OFFICE_ADMIN' : existingRole);
    setSelectedStaffDesignation('OFFICE_SUPPORT');
    setSelectedDeptId(user.facultyProfile?.departmentId || '');
    setSelectedCode(user.facultyProfile?.employeeCode || user.nonFacultyProfile?.employeeCode || '');
    setSelectedDesignation('');
    setAssignmentReason('');
    setIsAssignModalOpen(true);
  };

  const handleAssignRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmittingRole(true);
    try {
      const finalDesignation =
        selectedRole === 'NON_FACULTY' ? selectedStaffDesignation : selectedDesignation;

      await assignOperationalRole(selectedUser.id, {
        role: selectedRole,
        departmentId: selectedDeptId || undefined,
        designation: finalDesignation || undefined,
        employeeOrAdmissionCode: selectedCode || undefined,
        reason: assignmentReason || 'Operational role assigned by Principal',
      });

      setIsAssignModalOpen(false);
      await fetchUsersAndDepts();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Role assignment failed.');
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    if (user.status === 'ACTIVE') {
      const reason = prompt(`Enter suspension reason for user ${user.firstName} ${user.lastName}:`);
      if (!reason) return;
      try {
        await suspendUserAccount(user.id, reason);
        await fetchUsersAndDepts();
      } catch (err: any) {
        alert(err.response?.data?.error?.message || 'Suspension failed.');
      }
    } else {
      try {
        await activateUserAccount(user.id);
        await fetchUsersAndDepts();
      } catch (err: any) {
        alert(err.response?.data?.error?.message || 'Activation failed.');
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    const matchesRole = roleFilter === 'ALL' || u.activeRole === roleFilter;
    const matchesSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(search.toLowerCase())) ||
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600" />
            <span>Institution-Wide User & Role Management</span>
          </h1>
          <p className="text-gray-500 text-xs mt-1">
            Executive Governance, Role Assignments, Granular RBAC, and Account Security Controls
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search name, username, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 border text-xs rounded-lg focus:ring-2 focus:ring-brand-500 w-48 sm:w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border text-xs rounded-lg bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="APPROVED_PENDING_ROLE">Role Required</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-xs">Loading user directory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3.5 px-4">User Name</th>
                  <th className="py-3.5 px-4">Username & Email</th>
                  <th className="py-3.5 px-4">Requested Category</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4">Assigned Role</th>
                  <th className="py-3.5 px-4">Assignment Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => {
                  const hasAssignedRole = u.userRoles && u.userRoles.length > 0;
                  const isRoleRequired =
                    u.status === 'APPROVED_PENDING_ROLE' ||
                    (!hasAssignedRole && u.status !== 'PENDING_APPROVAL');

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-gray-700 font-semibold">
                          @{u.username || 'n/a'}
                        </div>
                        <div className="text-gray-500 text-[11px]">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {u.userCategory ? u.userCategory.replace(/_/g, ' ') : 'STANDARD'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-md ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : u.status === 'APPROVED_PENDING_ROLE'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : u.status === 'SUSPENDED'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {u.status === 'APPROVED_PENDING_ROLE'
                            ? 'APPROVED — ROLE REQUIRED'
                            : u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {hasAssignedRole ? (
                          <Badge variant="primary">
                            {u.userRoles[0]?.role?.displayName || u.activeRole}
                          </Badge>
                        ) : (
                          <span className="text-amber-700 font-medium italic">
                            None (Assignment Required)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {isRoleRequired ? (
                          <span className="text-amber-700 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Role Assignment Required
                          </span>
                        ) : u.status === 'ACTIVE' ? (
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Active & Operational
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium">Pending Verification</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.activeRole !== 'SUPER_ADMIN' && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => openRoleModal(u)}
                                leftIcon={<Edit className="w-3.5 h-3.5" />}
                              >
                                {isRoleRequired ? 'Assign Role' : 'Change Role'}
                              </Button>

                              <button
                                onClick={() => handleToggleStatus(u)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition ${
                                  u.status === 'ACTIVE'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ASSIGN / CHANGE OPERATIONAL ROLE MODAL */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Institutional Operational Role"
      >
        <form onSubmit={handleAssignRoleSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl space-y-1">
            <p className="font-bold text-brand-900 text-sm">
              User: {selectedUser?.firstName} {selectedUser?.lastName} (@{selectedUser?.username})
            </p>
            <p className="text-[11px] text-brand-700">
              Email: <strong>{selectedUser?.email}</strong> | Registered Category:{' '}
              <span className="font-bold underline">{selectedUser?.userCategory || 'STANDARD'}</span>
            </p>
          </div>

          <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-brand-600" />
              <span>Operational Role & Permissions Mapping</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Operational Role *"
                required
                value={selectedRole}
                onChange={(e) => {
                  const newRole = e.target.value;
                  setSelectedRole(newRole);
                  if (newRole === 'NON_FACULTY') setSelectedStaffDesignation('OFFICE_SUPPORT');
                }}
                options={[
                  { value: 'OFFICE_ADMIN', label: 'Academic Office Administrator (Office)' },
                  { value: 'FACULTY', label: 'Faculty / Teacher' },
                  { value: 'NON_FACULTY', label: 'Non-Faculty Staff (Support / Security / Driver / Attender)' },
                  { value: 'STUDENT', label: 'Student Enrollee' },
                  { value: 'PARENT', label: 'Parent / Guardian' },
                ]}
              />

              {selectedRole === 'NON_FACULTY' ? (
                <Select
                  label="Staff Sub-Role / Job Title *"
                  required
                  value={selectedStaffDesignation}
                  onChange={(e) => setSelectedStaffDesignation(e.target.value)}
                  options={[
                    { value: 'OFFICE_SUPPORT', label: 'Office Support / Attender' },
                    { value: 'ATTENDER', label: 'Campus Attender / Helper' },
                    { value: 'SECURITY', label: 'Campus Security Officer' },
                    { value: 'DRIVER', label: 'Transport Vehicle Driver' },
                    { value: 'MAINTENANCE', label: 'Maintenance / Facilities Staff' },
                    { value: 'OTHER_NON_FACULTY', label: 'Other Non-Faculty' },
                  ]}
                />
              ) : (
                <Input
                  label="Designation / Job Title"
                  value={selectedDesignation}
                  onChange={(e) => setSelectedDesignation(e.target.value)}
                  placeholder={selectedRole === 'FACULTY' ? 'e.g. Mathematics Teacher / Class Teacher' : 'e.g. Office Administrator'}
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Staff / Admission Code"
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value)}
                placeholder="e.g. EMP-1002"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Assignment Justification / Audit Reason *
            </label>
            <textarea
              rows={2}
              required
              value={assignmentReason}
              onChange={(e) => setAssignmentReason(e.target.value)}
              placeholder="State reason for role assignment or promotion (mandatory for audit log)..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              type="submit"
              isLoading={isSubmittingRole}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Save & Activate Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

