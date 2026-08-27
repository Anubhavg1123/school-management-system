import React, { useState, useEffect } from 'react';
import { academicApi } from '../../api/academic';
import { feesApi } from '../../api/fees';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Student,
  ClassItem,
  SectionItem,
  Department,
  AcademicYear,
  StudentStatusEnum,
  StudentTransferTypeEnum,
} from '../../types';
import {
  GraduationCap,
  Search,
  UserPlus,
  ArrowRightLeft,
  FileText,
  Building2,
  Calendar,
  Phone,
  Mail,
  Users,
  AlertCircle,
  CheckCircle,
  Eye,
  Clock,
  UploadCloud,
  History,
  ShieldAlert,
  Wallet,
  Receipt as ReceiptIcon,
} from 'lucide-react';

export const StudentAdmissions: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination & Search
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  // Modals
  const [isAdmitOpen, setIsAdmitOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDocUploadOpen, setIsDocUploadOpen] = useState(false);

  // Selected Student & Active Tabs
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [financialProfile, setFinancialProfile] = useState<any>(null);
  const [profileTab, setProfileTab] = useState<'personal' | 'academic' | 'attendance' | 'financial' | 'history' | 'documents'>('personal');
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Admission Form State
  const [admissionForm, setAdmissionForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    whatsAppNumber: '',
    altPhone: '',
    dateOfBirth: '',
    gender: 'MALE',
    bloodGroup: 'O_POSITIVE',
    address: '',
    emergencyContact: '',
    admissionNumber: `ADM-${Date.now().toString().slice(-4)}`,
    enrollmentNumber: `ENR-${Date.now().toString().slice(-4)}`,
    rollNumber: '',
    academicYearId: '',
    departmentId: '',
    classId: '',
    sectionId: '',
    previousSchool: '',
    previousGrade: '',
    previousScore: '',
    guardian: {
      fullName: '',
      relationship: 'FATHER',
      phone: '',
      email: '',
      occupation: '',
      address: '',
    },
  });

  // Transfer Form State
  const [transferForm, setTransferForm] = useState({
    toClassId: '',
    toSectionId: '',
    toDepartmentId: '',
    toAcademicYearId: '',
    transferType: 'SECTION_TRANSFER',
    reason: '',
  });

  // Status Form State
  const [statusForm, setStatusForm] = useState({
    status: 'ACTIVE',
    reason: '',
  });

  // Document Upload State
  const [docForm, setDocForm] = useState({
    docType: 'BIRTH_CERTIFICATE',
    title: '',
    fileUrl: '',
    mimeType: 'application/pdf',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Reference Hierarchy Data
  const loadReferenceData = async () => {
    try {
      const [classesRes, deptsRes, yearsRes] = await Promise.all([
        academicApi.getClasses(),
        academicApi.getDepartments(),
        academicApi.getYears(),
      ]);

      if (classesRes.success && classesRes.data) setClasses(classesRes.data);
      if (deptsRes.success && deptsRes.data) setDepartments(deptsRes.data);
      if (yearsRes.success && yearsRes.data) setYears(yearsRes.data);
    } catch (err) {
      console.error('Failed to load academic hierarchies', err);
    }
  };

  // Load Students with filters and pagination
  const loadStudents = async (page = currentPage) => {
    setIsLoading(true);
    try {
      const res = await academicApi.getStudents({
        page,
        limit: 15,
        search: search || undefined,
        classId: selectedClassId || undefined,
        sectionId: selectedSectionId || undefined,
        departmentId: selectedDeptId || undefined,
        status: selectedStatus || undefined,
      });

      if (res.success && res.data) {
        setStudents(res.data);
        if (res.meta) {
          setCurrentPage(res.meta.page || 1);
          setTotalPages(res.meta.totalPages || 1);
          setTotalStudents(res.meta.total || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load students', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    loadStudents(1);
  }, [selectedClassId, selectedSectionId, selectedDeptId, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudents(1);
  };

  // On Admission Class Select -> populate sections
  const handleAdmissionClassChange = (classId: string) => {
    const selectedClass = classes.find((c) => c.id === classId);
    setAdmissionForm({
      ...admissionForm,
      classId,
      sectionId: '',
      departmentId: selectedClass?.departmentId || '',
      academicYearId: selectedClass?.academicYearId || '',
    });
    setSections(selectedClass?.sections || []);
  };

  // Submit New Student Admission
  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await academicApi.admitStudent(admissionForm);
      setIsAdmitOpen(false);
      setAdmissionForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        whatsAppNumber: '',
        altPhone: '',
        dateOfBirth: '',
        gender: 'MALE',
        bloodGroup: 'O_POSITIVE',
        address: '',
        emergencyContact: '',
        admissionNumber: `ADM-${Date.now().toString().slice(-4)}`,
        enrollmentNumber: `ENR-${Date.now().toString().slice(-4)}`,
        rollNumber: '',
        academicYearId: '',
        departmentId: '',
        classId: '',
        sectionId: '',
        previousSchool: '',
        previousGrade: '',
        previousScore: '',
        guardian: {
          fullName: '',
          relationship: 'FATHER',
          phone: '',
          email: '',
          occupation: '',
          address: '',
        },
      });
      loadStudents(1);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to admit student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Detailed Profile
  const openStudentProfile = async (s: Student) => {
    setIsProfileLoading(true);
    setIsProfileOpen(true);
    setProfileTab('personal');
    setFinancialProfile(null);
    try {
      const [res, finRes] = await Promise.allSettled([
        academicApi.getStudentById(s.id),
        feesApi.getStudentProfile(s.id),
      ]);
      if (res.status === 'fulfilled' && res.value.success && res.value.data) {
        setSelectedStudent(res.value.data);
      } else {
        setSelectedStudent(s);
      }
      if (finRes.status === 'fulfilled' && finRes.value.success && finRes.value.data) {
        setFinancialProfile(finRes.value.data);
      }
    } catch (err) {
      console.error(err);
      setSelectedStudent(s);
    } finally {
      setIsProfileLoading(false);
    }
  };

  // Open Transfer Modal
  const openTransferModal = (s: Student) => {
    setSelectedStudent(s);
    setTransferForm({
      toClassId: s.section?.class.id || '',
      toSectionId: s.sectionId || '',
      toDepartmentId: s.departmentId || '',
      toAcademicYearId: s.academicYearId || '',
      transferType: 'SECTION_TRANSFER',
      reason: '',
    });
    setIsTransferOpen(true);
  };

  // Submit Transfer
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setIsSubmitting(true);
    try {
      await academicApi.transferStudent(selectedStudent.id, transferForm);
      setIsTransferOpen(false);
      loadStudents(currentPage);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Transfer failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Status Modal
  const openStatusModal = (s: Student) => {
    setSelectedStudent(s);
    setStatusForm({
      status: s.status,
      reason: '',
    });
    setIsStatusOpen(true);
  };

  // Submit Status Change
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setIsSubmitting(true);
    try {
      await academicApi.updateStudentStatus(selectedStudent.id, statusForm);
      setIsStatusOpen(false);
      loadStudents(currentPage);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update student status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Document Upload
  const handleDocUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setIsSubmitting(true);
    try {
      await academicApi.uploadStudentDocument(selectedStudent.id, docForm);
      setIsDocUploadOpen(false);
      setDocForm({ docType: 'BIRTH_CERTIFICATE', title: '', fileUrl: '', mimeType: 'application/pdf' });
      // Refresh profile
      const res = await academicApi.getStudentById(selectedStudent.id);
      if (res.success && res.data) setSelectedStudent(res.data);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to upload document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case StudentStatusEnum.ACTIVE:
        return <Badge variant="success">Active</Badge>;
      case StudentStatusEnum.LEFT_INSTITUTION:
        return <Badge variant="danger">Left Institution</Badge>;
      case StudentStatusEnum.TRANSFERRED:
        return <Badge variant="warning">Transferred</Badge>;
      case StudentStatusEnum.GRADUATED:
        return <Badge variant="info">Graduated</Badge>;
      case StudentStatusEnum.SUSPENDED:
        return <Badge variant="danger">Suspended</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-brand-600" />
            <span>Student Admissions & Academic Registry</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete institutional enrollment: register admissions, maintain guardian records, process class transfers, and manage historical student files.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAdmitOpen(true)}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          New Student Admission
        </Button>
      </div>

      {/* Filter & Search Hub */}
      <Card noPadding>
        <div className="p-4 bg-slate-50/80 border-b border-slate-200">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="sm:col-span-2">
              <Input
                placeholder="Search name, admission #, enrollment #, WhatsApp..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div>
              <Select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedSectionId('');
                }}
                options={[
                  { value: '', label: 'All Classes' },
                  ...classes.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            </div>
            <div>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'ACTIVE', label: 'Active Students' },
                  { value: 'LEFT_INSTITUTION', label: 'Left Institution' },
                  { value: 'TRANSFERRED', label: 'Transferred' },
                  { value: 'GRADUATED', label: 'Graduated' },
                  { value: 'SUSPENDED', label: 'Suspended' },
                  { value: 'INACTIVE', label: 'Inactive' },
                ]}
              />
            </div>
          </form>
        </div>

        {/* Student Roster Table */}
        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner size="md" label="Loading student directory..." />
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            title="No Student Records Found"
            description="No student records match the specified query filters."
            icon={<GraduationCap className="w-12 h-12 text-slate-300" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Student Identity</th>
                  <th className="p-3.5">Campus ID / Enrollment #</th>
                  <th className="p-3.5">Class & Section</th>
                  <th className="p-3.5">Primary Guardian</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">
                        {s.user.firstName} {s.user.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{s.user.email}</div>
                      <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {s.user.whatsAppNumber || s.user.phone || '—'}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded">
                          CAMPUS ID
                        </span>
                        <span className="font-mono font-bold text-blue-900 dark:text-blue-200">
                          {s.campusId || '00001'}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-semibold mt-1">
                        Enr: {s.enrollmentNumber || '—'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Adm: {s.admissionNumber}
                      </div>
                    </td>
                    <td className="p-3.5">
                      {s.section ? (
                        <div>
                          <div className="font-semibold text-slate-800">{s.section.class.name}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{s.section.name}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {s.guardians && s.guardians.length > 0 ? (
                        <div>
                          <div className="font-medium text-slate-800">{s.guardians[0].fullName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{s.guardians[0].phone}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3.5">{getStatusBadge(s.status)}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="View Full Profile"
                          onClick={() => openStudentProfile(s)}
                        >
                          <Eye className="w-3.5 h-3.5 text-brand-600" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          title="Transfer / Promote Class"
                          onClick={() => openTransferModal(s)}
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          title="Update Status / Departure"
                          onClick={() => openStatusModal(s)}
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalStudents} Total Students)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => loadStudents(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => loadStudents(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* ADMISSION INTAKE MODAL */}
      <Modal isOpen={isAdmitOpen} onClose={() => setIsAdmitOpen(false)} title="New Student Admission Intake Form">
        <form onSubmit={handleAdmissionSubmit} className="space-y-4 text-xs max-h-[80vh] overflow-y-auto pr-1">
          <div className="bg-brand-50/60 p-3 rounded-xl border border-brand-100 text-brand-900 font-semibold flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-brand-600" />
            <span>1. Student Identity & Contact</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name *"
              required
              value={admissionForm.firstName}
              onChange={(e) => setAdmissionForm({ ...admissionForm, firstName: e.target.value })}
            />
            <Input
              label="Last Name *"
              required
              value={admissionForm.lastName}
              onChange={(e) => setAdmissionForm({ ...admissionForm, lastName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Student Email Address *"
              type="email"
              required
              value={admissionForm.email}
              onChange={(e) => setAdmissionForm({ ...admissionForm, email: e.target.value })}
            />
            <Input
              label="Mandatory WhatsApp Contact *"
              required
              value={admissionForm.whatsAppNumber}
              onChange={(e) => setAdmissionForm({ ...admissionForm, whatsAppNumber: e.target.value })}
              placeholder="+1-555-0100"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Date of Birth"
              type="date"
              value={admissionForm.dateOfBirth}
              onChange={(e) => setAdmissionForm({ ...admissionForm, dateOfBirth: e.target.value })}
            />
            <Select
              label="Gender"
              value={admissionForm.gender}
              onChange={(e) => setAdmissionForm({ ...admissionForm, gender: e.target.value })}
              options={[
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
            <Select
              label="Blood Group"
              value={admissionForm.bloodGroup}
              onChange={(e) => setAdmissionForm({ ...admissionForm, bloodGroup: e.target.value })}
              options={[
                { value: 'A_POSITIVE', label: 'A+' },
                { value: 'A_NEGATIVE', label: 'A-' },
                { value: 'B_POSITIVE', label: 'B+' },
                { value: 'B_NEGATIVE', label: 'B-' },
                { value: 'AB_POSITIVE', label: 'AB+' },
                { value: 'AB_NEGATIVE', label: 'AB-' },
                { value: 'O_POSITIVE', label: 'O+' },
                { value: 'O_NEGATIVE', label: 'O-' },
              ]}
            />
          </div>

          <Input
            label="Residential Address"
            value={admissionForm.address}
            onChange={(e) => setAdmissionForm({ ...admissionForm, address: e.target.value })}
          />

          <div className="bg-brand-50/60 p-3 rounded-xl border border-brand-100 text-brand-900 font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-600" />
            <span>2. Guardian / Parental Information</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Guardian Full Name *"
              required
              value={admissionForm.guardian.fullName}
              onChange={(e) =>
                setAdmissionForm({
                  ...admissionForm,
                  guardian: { ...admissionForm.guardian, fullName: e.target.value },
                })
              }
            />
            <Select
              label="Relationship *"
              value={admissionForm.guardian.relationship}
              onChange={(e) =>
                setAdmissionForm({
                  ...admissionForm,
                  guardian: { ...admissionForm.guardian, relationship: e.target.value },
                })
              }
              options={[
                { value: 'FATHER', label: 'Father' },
                { value: 'MOTHER', label: 'Mother' },
                { value: 'LEGAL_GUARDIAN', label: 'Legal Guardian' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Guardian Phone *"
              required
              value={admissionForm.guardian.phone}
              onChange={(e) =>
                setAdmissionForm({
                  ...admissionForm,
                  guardian: { ...admissionForm.guardian, phone: e.target.value },
                })
              }
            />
            <Input
              label="Guardian Email"
              type="email"
              value={admissionForm.guardian.email}
              onChange={(e) =>
                setAdmissionForm({
                  ...admissionForm,
                  guardian: { ...admissionForm.guardian, email: e.target.value },
                })
              }
            />
          </div>

          <div className="bg-brand-50/60 p-3 rounded-xl border border-brand-100 text-brand-900 font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-600" />
            <span>3. Academic Allocation & Previous Record</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Admission Number *"
              required
              value={admissionForm.admissionNumber}
              onChange={(e) => setAdmissionForm({ ...admissionForm, admissionNumber: e.target.value })}
            />
            <Input
              label="Enrollment Number"
              value={admissionForm.enrollmentNumber}
              onChange={(e) => setAdmissionForm({ ...admissionForm, enrollmentNumber: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Enrolled Class *"
              required
              value={admissionForm.classId}
              onChange={(e) => handleAdmissionClassChange(e.target.value)}
              options={[
                { value: '', label: 'Select Target Class' },
                ...classes.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <Select
              label="Allocated Section *"
              required
              value={admissionForm.sectionId}
              onChange={(e) => setAdmissionForm({ ...admissionForm, sectionId: e.target.value })}
              options={[
                { value: '', label: 'Select Section' },
                ...sections.map((sec) => ({ value: sec.id, label: `${sec.name} (Cap: ${sec.capacity})` })),
              ]}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Previous School / College"
              value={admissionForm.previousSchool}
              onChange={(e) => setAdmissionForm({ ...admissionForm, previousSchool: e.target.value })}
            />
            <Input
              label="Previous Grade"
              value={admissionForm.previousGrade}
              onChange={(e) => setAdmissionForm({ ...admissionForm, previousGrade: e.target.value })}
            />
            <Input
              label="Previous Score / %"
              value={admissionForm.previousScore}
              onChange={(e) => setAdmissionForm({ ...admissionForm, previousScore: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsAdmitOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Process Complete Admission
            </Button>
          </div>
        </form>
      </Modal>

      {/* DETAILED STUDENT PROFILE MODAL */}
      <Modal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        title={`Student Profile File: ${selectedStudent?.user.firstName} ${selectedStudent?.user.lastName}`}
      >
        {isProfileLoading ? (
          <div className="py-8">
            <LoadingSpinner size="md" label="Loading student files..." />
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Header info badge */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedStudent?.user.firstName} {selectedStudent?.user.lastName}
                </span>
                <span className="ml-2 font-mono text-[11px] text-brand-700">
                  {selectedStudent?.admissionNumber}
                </span>
              </div>
              <div>{selectedStudent && getStatusBadge(selectedStudent.status)}</div>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setProfileTab('personal')}
                className={`py-2 px-3 font-semibold text-xs border-b-2 transition-colors ${
                  profileTab === 'personal'
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Personal & Guardians
              </button>
              <button
                onClick={() => setProfileTab('academic')}
                className={`py-2 px-3 font-semibold text-xs border-b-2 transition-colors ${
                  profileTab === 'academic'
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Academic Allocation
              </button>
              <button
                onClick={() => setProfileTab('attendance')}
                className={`py-2 px-3 font-semibold text-xs border-b-2 transition-colors ${
                  profileTab === 'attendance'
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Attendance Analytics
              </button>
              <button
                onClick={() => setProfileTab('financial')}
                className={`py-2 px-3 font-semibold text-xs border-b-2 transition-colors ${
                  profileTab === 'financial'
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Financial Ledger
              </button>
              <button
                onClick={() => setProfileTab('history')}
                className={`py-2 px-3 font-semibold text-xs border-b-2 transition-colors ${
                  profileTab === 'history'
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Transfer / Status Log
              </button>
              <button
                onClick={() => setProfileTab('documents')}
                className={`py-2 px-3 font-semibold text-xs border-b-2 transition-colors ${
                  profileTab === 'documents'
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Documents Vault
              </button>
            </div>

            {/* Tab Content */}
            {profileTab === 'financial' && (
              <div className="space-y-4 pt-2">
                {/* Financial Summary KPIs */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <span className="text-slate-500 text-[10px] uppercase">Total Applicable</span>
                    <p className="font-mono font-bold text-slate-900 text-sm">
                      ${(financialProfile?.summary?.totalNetPayable || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-center">
                    <span className="text-emerald-700 text-[10px] uppercase">Total Paid</span>
                    <p className="font-mono font-bold text-emerald-800 text-sm">
                      ${(financialProfile?.summary?.totalPaid || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-center">
                    <span className="text-rose-700 text-[10px] uppercase">Outstanding</span>
                    <p className="font-mono font-bold text-rose-800 text-sm">
                      ${(financialProfile?.summary?.totalOutstanding || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-lg text-center">
                    <span className="text-amber-700 text-[10px] uppercase">Overdue</span>
                    <p className="font-mono font-bold text-amber-800 text-sm">
                      ${(financialProfile?.summary?.overdueAmount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Assigned Fee Packages & Installments */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs uppercase">Assigned Fee Packages & Installments</h4>
                  {financialProfile?.assignments?.length > 0 ? (
                    financialProfile.assignments.map((a: any) => (
                      <div key={a.id} className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-900">{a.feeStructure?.name}</span>
                            <span className="ml-2 font-mono text-[10px] text-slate-400">({a.academicYear?.name})</span>
                          </div>
                          <Badge variant={a.status === 'PAID' ? 'success' : a.status === 'PARTIALLY_PAID' ? 'warning' : 'default'}>
                            {a.status}
                          </Badge>
                        </div>

                        {/* Installment Breakdown */}
                        <div className="bg-slate-50 p-2 rounded-lg divide-y divide-slate-100">
                          {a.installments?.map((inst: any) => (
                            <div key={inst.id} className="py-1.5 flex justify-between items-center text-xs">
                              <div>
                                <span className="font-medium text-slate-800">{inst.name}</span>
                                <span className="text-slate-400 text-[10px] ml-2 font-mono">
                                  Due: {new Date(inst.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-700">
                                  ${inst.paidAmount} / ${inst.amount}
                                </span>
                                <Badge
                                  variant={
                                    inst.status === 'PAID'
                                      ? 'success'
                                      : inst.status === 'OVERDUE'
                                      ? 'danger'
                                      : 'warning'
                                  }
                                >
                                  {inst.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Payment & Receipt History */}
                        {a.payments?.length > 0 && (
                          <div className="pt-2">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase">Payment Receipts</span>
                            <div className="divide-y divide-slate-100">
                              {a.payments.map((p: any) => (
                                <div key={p.id} className="py-1 flex justify-between items-center text-[11px]">
                                  <span className="font-mono font-bold text-brand-700">{p.receipt?.receiptNumber || p.paymentNumber}</span>
                                  <span className="text-slate-500">{p.paymentMethod} • {new Date(p.paymentDate).toLocaleDateString()}</span>
                                  <span className="font-mono font-bold text-emerald-700">${p.amount.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 py-3 text-center">No fee structures assigned yet.</p>
                  )}
                </div>
              </div>
            )}
            {profileTab === 'personal' && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg">
                  <div>
                    <span className="text-slate-400">Institutional Email:</span>
                    <p className="font-semibold text-slate-800">{selectedStudent?.user.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">WhatsApp Contact:</span>
                    <p className="font-semibold text-emerald-700">{selectedStudent?.user.whatsAppNumber || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Date of Birth:</span>
                    <p className="font-semibold text-slate-800">
                      {selectedStudent?.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Gender / Blood Group:</span>
                    <p className="font-semibold text-slate-800">
                      {selectedStudent?.gender || '—'} / {selectedStudent?.bloodGroup || '—'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Residential Address:</span>
                    <p className="font-semibold text-slate-800">{selectedStudent?.user.address || '—'}</p>
                  </div>
                </div>

                <h4 className="font-bold text-slate-800 mt-3">Primary Guardian Records</h4>
                {selectedStudent?.guardians && selectedStudent.guardians.length > 0 ? (
                  <div className="divide-y divide-slate-100 bg-slate-50 p-3 rounded-lg">
                    {selectedStudent.guardians.map((g) => (
                      <div key={g.id} className="py-1.5 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-800">{g.fullName} ({g.relationship})</p>
                          <p className="text-slate-500">{g.occupation || 'Occupation unlisted'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-emerald-700 font-semibold">{g.phone}</p>
                          <p className="text-slate-400 text-[10px]">{g.email || '—'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">No guardian records found.</p>
                )}
              </div>
            )}

            {profileTab === 'academic' && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg">
                  <div>
                    <span className="text-slate-400">Enrolled Class:</span>
                    <p className="font-bold text-slate-800">{selectedStudent?.section?.class.name || 'Unassigned'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Allocated Section:</span>
                    <p className="font-bold text-slate-800">{selectedStudent?.section?.name || 'Unassigned'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Academic Year:</span>
                    <p className="font-semibold text-slate-800">{selectedStudent?.academicYear?.name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Department Scope:</span>
                    <p className="font-semibold text-slate-800">{selectedStudent?.department?.name || 'General'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Admission Date:</span>
                    <p className="font-semibold text-slate-800">
                      {selectedStudent?.admissionDate ? new Date(selectedStudent.admissionDate).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Previous Institution:</span>
                    <p className="font-semibold text-slate-800">{selectedStudent?.previousSchool || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {profileTab === 'attendance' && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                    <span className="text-emerald-700 font-semibold text-[10px] uppercase">Days Present</span>
                    <h4 className="text-xl font-bold text-emerald-800">{selectedStudent?.attendanceSummary?.present || 0}</h4>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center">
                    <span className="text-amber-700 font-semibold text-[10px] uppercase">Late Arrivals</span>
                    <h4 className="text-xl font-bold text-amber-800">{selectedStudent?.attendanceSummary?.late || 0}</h4>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-center">
                    <span className="text-rose-700 font-semibold text-[10px] uppercase">Absences</span>
                    <h4 className="text-xl font-bold text-rose-800">{selectedStudent?.attendanceSummary?.absent || 0}</h4>
                  </div>
                </div>
              </div>
            )}

            {profileTab === 'history' && (
              <div className="space-y-2 pt-2 max-h-60 overflow-y-auto">
                {selectedStudent?.transferHistory && selectedStudent.transferHistory.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {selectedStudent.transferHistory.map((h) => (
                      <div key={h.id} className="py-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <Badge variant="primary">{h.transferType.replace(/_/g, ' ')}</Badge>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(h.effectiveDate).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-700 font-medium text-[11px]">{h.reason}</p>
                        <p className="text-slate-400 text-[10px]">
                          Status Transition: {h.fromStatus || 'N/A'} &rarr; {h.toStatus || 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">No transfer or promotion logs recorded.</p>
                )}
              </div>
            )}

            {profileTab === 'documents' && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Uploaded Student Certificates</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDocUploadOpen(true)}
                    leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
                  >
                    Attach Document
                  </Button>
                </div>

                {selectedStudent?.documents && selectedStudent.documents.length > 0 ? (
                  <div className="divide-y divide-slate-100 bg-slate-50 p-2.5 rounded-lg">
                    {selectedStudent.documents.map((d) => (
                      <div key={d.id} className="py-2 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{d.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{d.docType.replace(/_/g, ' ')}</p>
                        </div>
                        <a
                          href={d.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 font-semibold hover:underline"
                        >
                          View File
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 py-4 text-center">No documents currently attached.</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* TRANSFER / PROMOTION MODAL */}
      <Modal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title={`Transfer / Promotion: ${selectedStudent?.user.firstName} ${selectedStudent?.user.lastName}`}
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
          <Select
            label="Transfer Type *"
            value={transferForm.transferType}
            onChange={(e) => setTransferForm({ ...transferForm, transferType: e.target.value })}
            options={[
              { value: 'SECTION_TRANSFER', label: 'Section Transfer (Within Same Class)' },
              { value: 'CLASS_TRANSFER', label: 'Class / Stream Transfer' },
              { value: 'PROMOTION', label: 'Academic Year Promotion' },
              { value: 'DEPT_TRANSFER', label: 'Department / Major Transfer' },
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Target Class *"
              required
              value={transferForm.toClassId}
              onChange={(e) => {
                const targetClass = classes.find((c) => c.id === e.target.value);
                setTransferForm({
                  ...transferForm,
                  toClassId: e.target.value,
                  toSectionId: '',
                  toDepartmentId: targetClass?.departmentId || '',
                  toAcademicYearId: targetClass?.academicYearId || '',
                });
                setSections(targetClass?.sections || []);
              }}
              options={[
                { value: '', label: 'Select Target Class' },
                ...classes.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <Select
              label="Target Section *"
              required
              value={transferForm.toSectionId}
              onChange={(e) => setTransferForm({ ...transferForm, toSectionId: e.target.value })}
              options={[
                { value: '', label: 'Select Destination Section' },
                ...sections.map((sec) => ({ value: sec.id, label: `${sec.name} (Cap: ${sec.capacity})` })),
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Administrative Justification *</label>
            <textarea
              rows={3}
              required
              value={transferForm.reason}
              onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
              placeholder="State the official academic or administrative reason for this transfer..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsTransferOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Execute Transfer & Record Log
            </Button>
          </div>
        </form>
      </Modal>

      {/* STATUS CHANGE / DEPARTURE MODAL */}
      <Modal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        title={`Student Status & Departure: ${selectedStudent?.user.firstName} ${selectedStudent?.user.lastName}`}
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
          <Select
            label="New Student Status *"
            value={statusForm.status}
            onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
            options={[
              { value: 'ACTIVE', label: 'Active (Enrolled)' },
              { value: 'LEFT_INSTITUTION', label: 'Left Institution (TC Issued / Transferred Out)' },
              { value: 'GRADUATED', label: 'Graduated (Course Completed)' },
              { value: 'SUSPENDED', label: 'Suspended (Disciplinary Action)' },
              { value: 'INACTIVE', label: 'Inactive (Administrative Hold)' },
            ]}
          />

          {statusForm.status === 'LEFT_INSTITUTION' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-rose-600" /> Historical Data Preservation Notice:
              </p>
              <p className="text-[11px]">
                Marking student as "Left Institution" will immediately disable future attendance punches and clear active section seats while preserving all historical attendance and financial ledger records.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Reason / Justification *</label>
            <textarea
              rows={3}
              required
              value={statusForm.reason}
              onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })}
              placeholder="Provide official justification (e.g. TC number, graduation batch, etc.)..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsStatusOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" isLoading={isSubmitting}>
              Apply Status Change
            </Button>
          </div>
        </form>
      </Modal>

      {/* DOCUMENT ATTACHMENT MODAL */}
      <Modal
        isOpen={isDocUploadOpen}
        onClose={() => setIsDocUploadOpen(false)}
        title="Attach Student Document / Certificate"
      >
        <form onSubmit={handleDocUploadSubmit} className="space-y-4 text-xs">
          <Select
            label="Document Category *"
            value={docForm.docType}
            onChange={(e) => setDocForm({ ...docForm, docType: e.target.value })}
            options={[
              { value: 'BIRTH_CERTIFICATE', label: 'Birth Certificate' },
              { value: 'PHOTO', label: 'Passport Photo' },
              { value: 'PREVIOUS_MARKSHEET', label: 'Previous Marksheet' },
              { value: 'ID_PROOF', label: 'Government ID Proof' },
              { value: 'TRANSFER_CERTIFICATE', label: 'Transfer Certificate (TC)' },
              { value: 'MEDICAL_RECORD', label: 'Medical Record' },
              { value: 'OTHER', label: 'Other Document' },
            ]}
          />

          <Input
            label="Document Title *"
            required
            value={docForm.title}
            onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
            placeholder="e.g. Grade 9 Final Marksheet Scan"
          />

          <Input
            label="File URL / Secure Storage Path *"
            required
            value={docForm.fileUrl}
            onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })}
            placeholder="https://secure.school.edu/docs/..."
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsDocUploadOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Attach Document
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
