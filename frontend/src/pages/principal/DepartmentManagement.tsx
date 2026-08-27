import React, { useState, useEffect } from 'react';
import { academicApi } from '../../api/academic';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Building2,
  Plus,
  Users,
  BookOpen,
  UserCheck,
  History,
  Clock,
  ShieldCheck,
  Layers,
  Trash2,
  Calendar,
} from 'lucide-react';
import { Department } from '../../types';

export const DepartmentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DEPARTMENTS' | 'CLASSES_SECTIONS' | 'ACADEMIC_YEARS' | 'COORDINATORS'>('DEPARTMENTS');

  // Department State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form for creating department
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
  });

  // HOD Assignment Modal
  const [isHodModalOpen, setIsHodModalOpen] = useState(false);
  const [selectedDeptForHod, setSelectedDeptForHod] = useState<Department | null>(null);
  const [candidateFaculty, setCandidateFaculty] = useState<any[]>([]);
  const [hodUserId, setHodUserId] = useState('');
  const [hodReason, setHodReason] = useState('');

  // Department Detail & HOD History Modal
  const [selectedDeptDetail, setSelectedDeptDetail] = useState<Department | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Class & Section State
  const [classesList, setClassesList] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classForm, setClassForm] = useState({
    name: '',
    code: '',
    order: 1,
    educationLevel: 'PRIMARY',
    departmentId: '',
    academicYearId: '',
  });

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sectionForm, setSectionForm] = useState({
    classId: '',
    name: '',
    capacity: 40,
    coordinatorFacultyId: '',
  });

  // Academic Years State
  const [academicYearsList, setAcademicYearsList] = useState<any[]>([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [yearForm, setYearForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    enrollmentPrefix: '26',
    enrollmentSeqLength: 4,
    isCurrent: false,
  });

  // Class Coordinator State
  const [sections, setSections] = useState<any[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [allFaculty, setAllFaculty] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);

  // Assign/Change Coordinator Modal
  const [isCoordModalOpen, setIsCoordModalOpen] = useState(false);
  const [selectedSectionForCoord, setSelectedSectionForCoord] = useState<any>(null);
  const [coordFacultyId, setCoordFacultyId] = useState('');
  const [coordYearId, setCoordYearId] = useState('');
  const [coordReason, setCoordReason] = useState('');

  // Coordinator History Modal
  const [isCoordHistoryModalOpen, setIsCoordHistoryModalOpen] = useState(false);
  const [coordHistoryList, setCoordHistoryList] = useState<any[]>([]);
  const [selectedSectionForHistory, setSelectedSectionForHistory] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadDepartments = async () => {
    setIsLoading(true);
    try {
      const res = await academicApi.getDepartments();
      if (res.success && res.data) {
        setDepartments(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClasses = async () => {
    setLoadingClasses(true);
    try {
      const res = await academicApi.getClasses();
      if (res.success && res.data) {
        setClassesList(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadAcademicYears = async () => {
    setLoadingYears(true);
    try {
      const res = await academicApi.getYears();
      if (res.success && res.data) {
        setAcademicYearsList(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingYears(false);
    }
  };

  const loadSectionsAndFaculty = async () => {
    setLoadingSections(true);
    try {
      const [secRes, yearRes] = await Promise.all([
        academicApi.getSections(),
        academicApi.getYears(),
      ]);

      if (secRes.success && secRes.data) {
        setSections(secRes.data);
      }
      if (yearRes.success && yearRes.data) {
        setYears(yearRes.data);
        const currentYear = yearRes.data.find((y: any) => y.isCurrent);
        if (currentYear) {
          setCoordYearId(currentYear.id);
        } else if (yearRes.data.length > 0) {
          setCoordYearId(yearRes.data[0].id);
        }
      }

      // Collect eligible faculty from all departments
      const deptRes = await academicApi.getDepartments();
      if (deptRes.success && deptRes.data) {
        const facList: any[] = [];
        for (const d of deptRes.data) {
          const detail = await academicApi.getDepartmentById(d.id);
          if (detail.success && detail.data?.facultyMembers) {
            facList.push(...detail.data.facultyMembers);
          }
        }
        setAllFaculty(facList);
        if (facList.length > 0) {
          setCoordFacultyId(facList[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load sections/faculty for coordinators:', err);
    } finally {
      setLoadingSections(false);
    }
  };

  useEffect(() => {
    loadDepartments();
    loadClasses();
    loadAcademicYears();
    loadSectionsAndFaculty();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await academicApi.createDepartment({
        code: form.code,
        name: form.name,
        description: form.description || undefined,
      });

      setIsModalOpen(false);
      setForm({ code: '', name: '', description: '' });
      setSuccessMsg('Academic department created successfully.');
      loadDepartments();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create department.');
    } finally {
      setIsSaving(false);
    }
  };

  const openAssignHodModal = async (dept: Department) => {
    setSelectedDeptForHod(dept);
    setError(null);
    setHodReason('');
    try {
      const res = await academicApi.getDepartmentById(dept.id);
      if (res.success && res.data) {
        const facs = res.data.facultyMembers || [];
        setCandidateFaculty(facs);
        if (facs.length > 0) {
          setHodUserId(facs[0].userId);
        }
      }
      setIsHodModalOpen(true);
    } catch (err: any) {
      setError('Failed to load eligible department faculty members.');
    }
  };

  const handleAssignHod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptForHod) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await academicApi.assignDepartmentHod(selectedDeptForHod.id, {
        hodUserId,
        reason: hodReason || 'Department Head appointment.',
      });

      if (res.success) {
        setSuccessMsg(`HOD successfully appointed for ${selectedDeptForHod.name}.`);
        setIsHodModalOpen(false);
        loadDepartments();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to assign HOD.');
    } finally {
      setIsSaving(false);
    }
  };

  const openDepartmentDetails = async (deptId: string) => {
    try {
      const res = await academicApi.getDepartmentById(deptId);
      if (res.success && res.data) {
        setSelectedDeptDetail(res.data);
        setIsDetailModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Class Coordinator Actions
  const openAssignCoordinatorModal = (section: any) => {
    setSelectedSectionForCoord(section);
    setError(null);
    setCoordReason('');
    if (section.coordinatorHistories && section.coordinatorHistories.length > 0) {
      setCoordFacultyId(section.coordinatorHistories[0].facultyId);
    } else if (allFaculty.length > 0) {
      setCoordFacultyId(allFaculty[0].id);
    }
    setIsCoordModalOpen(true);
  };

  const handleAssignCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSectionForCoord || !coordFacultyId || !coordYearId) return;
    setIsSaving(true);
    setError(null);

    try {
      const res = await academicApi.assignClassCoordinator(selectedSectionForCoord.id, {
        facultyId: coordFacultyId,
        academicYearId: coordYearId,
        reason: coordReason.trim() || 'Class coordinator official appointment.',
      });

      if (res.success) {
        setSuccessMsg('Class Coordinator assigned successfully.');
        setIsCoordModalOpen(false);
        loadSectionsAndFaculty();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to assign Class Coordinator.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnassignCoordinator = async (section: any) => {
    if (!confirm(`Are you sure you want to remove the Class Coordinator for ${section.class?.name} - ${section.name}?`)) {
      return;
    }

    try {
      const res = await academicApi.unassignClassCoordinator(section.id, 'Administrator removal.');
      if (res.success) {
        setSuccessMsg('Class Coordinator removed successfully.');
        loadSectionsAndFaculty();
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to remove Class Coordinator.');
    }
  };

  const openCoordinatorHistory = async (section: any) => {
    setSelectedSectionForHistory(section);
    setIsCoordHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const res = await academicApi.getCoordinatorHistory(section.id);
      if (res.success && res.data) {
        setCoordHistoryList(res.data);
      }
    } catch (err) {
      console.error('Failed to load coordinator history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Class & Section Actions
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.academicYearId) {
      setError('Please select an Academic Year.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await academicApi.createClass({
        name: classForm.name,
        code: classForm.code,
        order: Number(classForm.order),
        educationLevel: classForm.educationLevel,
        departmentId: classForm.departmentId || undefined,
        academicYearId: classForm.academicYearId,
      } as any);

      setIsClassModalOpen(false);
      setClassForm({
        name: '',
        code: '',
        order: 1,
        educationLevel: 'PRIMARY',
        departmentId: '',
        academicYearId: years.find((y: any) => y.isCurrent)?.id || '',
      });
      setSuccessMsg('Class created successfully.');
      loadClasses();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create class.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionForm.classId) {
      setError('Please select a Class.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await academicApi.createSection({
        classId: sectionForm.classId,
        name: sectionForm.name,
        capacity: Number(sectionForm.capacity) || 40,
        coordinatorFacultyId: sectionForm.coordinatorFacultyId || undefined,
      });

      setIsSectionModalOpen(false);
      setSectionForm({
        classId: '',
        name: '',
        capacity: 40,
        coordinatorFacultyId: '',
      });
      setSuccessMsg('Section created successfully.');
      loadClasses();
      loadSectionsAndFaculty();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create section.');
    } finally {
      setIsSaving(false);
    }
  };

  // Academic Year Actions
  const handleCreateAcademicYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (yearForm.isCurrent && !yearForm.enrollmentPrefix) {
      setError('Enrollment prefix is required before activating this academic year.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await academicApi.createYear({
        name: yearForm.name,
        startDate: yearForm.startDate,
        endDate: yearForm.endDate,
        isCurrent: yearForm.isCurrent,
        enrollmentPrefix: yearForm.enrollmentPrefix,
        enrollmentSeqLength: Number(yearForm.enrollmentSeqLength) || 4,
      } as any);

      setIsYearModalOpen(false);
      setYearForm({
        name: '',
        startDate: '',
        endDate: '',
        enrollmentPrefix: '26',
        enrollmentSeqLength: 4,
        isCurrent: false,
      });
      setSuccessMsg('Academic Year created successfully.');
      loadAcademicYears();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create academic year.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivateAcademicYear = async (year: any) => {
    if (!year.enrollmentPrefix || year.enrollmentPrefix.trim() === '') {
      setError('Enrollment prefix is required before activating this academic year.');
      return;
    }
    try {
      const res = await academicApi.setYearStatus(year.id, true);
      if (res.success) {
        setSuccessMsg(`Academic Year ${year.name} is now ACTIVE.`);
        loadAcademicYears();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to activate academic year.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            <span>Academic Leadership & Class Structure</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage academic departments, academic years with enrollment prefixes, class/grade level hierarchy (1..12), and section coordinators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'DEPARTMENTS' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setError(null);
                setIsModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Department
            </Button>
          )}

          {activeTab === 'CLASSES_SECTIONS' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  if (classesList.length > 0) {
                    setSectionForm({ ...sectionForm, classId: classesList[0].id });
                  }
                  setIsSectionModalOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create Section
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setError(null);
                  const activeYr = academicYearsList.find((y) => y.isCurrent) || academicYearsList[0];
                  if (activeYr) {
                    setClassForm((prev) => ({ ...prev, academicYearId: activeYr.id }));
                  }
                  setIsClassModalOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create Class
              </Button>
            </div>
          )}

          {activeTab === 'ACADEMIC_YEARS' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setError(null);
                setIsYearModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Academic Year
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('DEPARTMENTS')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'DEPARTMENTS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 className="w-4 h-4 inline mr-1.5" />
          Departments & HODs ({departments.length})
        </button>

        <button
          onClick={() => setActiveTab('CLASSES_SECTIONS')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'CLASSES_SECTIONS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-1.5" />
          Classes & Sections ({classesList.length} Classes)
        </button>

        <button
          onClick={() => setActiveTab('ACADEMIC_YEARS')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'ACADEMIC_YEARS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-1.5" />
          Academic Years & Prefixes ({academicYearsList.length})
        </button>

        <button
          onClick={() => setActiveTab('COORDINATORS')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'COORDINATORS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4 inline mr-1.5" />
          Class Coordinators ({sections.length} Sections)
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="font-bold">×</button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      {/* TAB 1: DEPARTMENTS & HODS */}
      {activeTab === 'DEPARTMENTS' && (
        <>
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : departments.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Building2 className="w-12 h-12 text-slate-300" />}
                title="No Academic Departments Configured"
                description="Start by creating academic departments (e.g. Computer Science, Mathematics, Mechanical Engineering)."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Create First Department
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => (
                <Card key={dept.id} className="flex flex-col justify-between p-5 border border-slate-100 hover:border-slate-200 transition-all shadow-xs">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-slate-900 text-base">{dept.name}</h3>
                      <Badge variant="secondary">{dept.code}</Badge>
                    </div>

                    {dept.description && (
                      <p className="text-xs text-slate-500 mb-4 line-clamp-2">{dept.description}</p>
                    )}

                    <div className="p-3 bg-slate-50 rounded-lg space-y-2 text-xs mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Head of Department:
                        </span>
                        <span className="font-semibold text-slate-800">
                          {dept.hod ? `${dept.hod.firstName} ${dept.hod.lastName}` : <span className="text-amber-600 font-normal">Unassigned</span>}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" /> Faculty Count:
                        </span>
                        <span className="font-semibold text-slate-800">{dept._count?.facultyMembers || 0}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Classes & Subjects:
                        </span>
                        <span className="font-semibold text-slate-800">
                          {dept._count?.classes || 0} Classes | {dept._count?.subjects || 0} Subjects
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openDepartmentDetails(dept.id)}>
                      <History className="w-3.5 h-3.5 mr-1" /> Details & HOD History
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openAssignHodModal(dept)}>
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" /> {dept.hod ? 'Change HOD' : 'Assign HOD'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: CLASSES & SECTIONS HIERARCHY */}
      {activeTab === 'CLASSES_SECTIONS' && (
        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">Institutional Classes & Grade Hierarchy</h2>
              <p className="text-xs text-gray-500">
                Sequenced classes (Order 1..12) with education level hierarchy (Primary, Middle, Secondary, Higher Secondary) and designated sections.
              </p>
            </div>
          </div>

          {loadingClasses ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : classesList.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-12 h-12 text-slate-300" />}
              title="No Classes Configured"
              description="Create your school's classes (e.g. Class 1 to Class 10) to organize sections and student rosters."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsClassModalOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create First Class
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {classesList.map((c: any) => (
                <div key={c.id} className="p-4 border border-slate-200 rounded-xl bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm border border-indigo-200">
                        {c.order || '—'}
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          {c.name}
                          <Badge variant="secondary">{c.code}</Badge>
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded">
                            {c.educationLevel || 'PRIMARY'}
                          </span>
                        </h3>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Academic Year: <span className="font-medium text-slate-700">{c.academicYear?.name}</span>
                          {c.department && <span> • Department: <span className="font-medium text-slate-700">{c.department.name}</span></span>}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSectionForm({ ...sectionForm, classId: c.id });
                        setIsSectionModalOpen(true);
                      }}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add Section
                    </Button>
                  </div>

                  {/* Sections list for this class */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-500 mb-2">Sections ({c.sections?.length || 0}):</div>
                    {!c.sections || c.sections.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No sections created yet for this class.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {c.sections.map((sec: any) => (
                          <div key={sec.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between items-center">
                            <div>
                              <div className="font-bold text-slate-800">{sec.name}</div>
                              <div className="text-[10px] text-slate-500">
                                Students: {sec._count?.students || 0} / {sec.capacity || 40}
                              </div>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-mono font-semibold">
                              Cap: {sec.capacity || 40}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: ACADEMIC YEARS & ENROLLMENT PREFIXES */}
      {activeTab === 'ACADEMIC_YEARS' && (
        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">Academic Years & Mandatory Enrollment Prefixes</h2>
              <p className="text-xs text-gray-500">
                Every academic year requires a 2-digit enrollment prefix (e.g. "26" for 2026-27). This generates sequential enrollment numbers (e.g. 260001, 260002).
              </p>
            </div>
          </div>

          {loadingYears ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : academicYearsList.length === 0 ? (
            <EmptyState
              icon={<Calendar className="w-12 h-12 text-slate-300" />}
              title="No Academic Years Configured"
              description="Create an academic year (e.g. 2026-2027) with its mandatory enrollment prefix."
            />
          ) : (
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="p-3">Academic Year</th>
                    <th className="p-3">Start Date</th>
                    <th className="p-3">End Date</th>
                    <th className="p-3">Enrollment Prefix</th>
                    <th className="p-3">Next Sequence</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {academicYearsList.map((y: any) => (
                    <tr key={y.id} className="hover:bg-gray-50/50">
                      <td className="p-3 font-bold text-gray-900">{y.name}</td>
                      <td className="p-3 text-gray-600">{new Date(y.startDate).toLocaleDateString()}</td>
                      <td className="p-3 text-gray-600">{new Date(y.endDate).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className="font-mono font-bold px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded">
                          {y.enrollmentPrefix || <span className="text-red-500 font-normal">Missing Prefix</span>}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-gray-600">{y.nextEnrollmentSeq || 1}</td>
                      <td className="p-3 text-center">
                        <Badge variant={y.isCurrent ? 'success' : 'secondary'}>
                          {y.isCurrent ? 'ACTIVE' : (y.status || 'UPCOMING')}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {!y.isCurrent && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleActivateAcademicYear(y)}
                          >
                            Activate Year
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: CLASS COORDINATOR MANAGEMENT */}
      {activeTab === 'COORDINATORS' && (
        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">Official Class Coordinator Roster</h2>
              <p className="text-xs text-gray-500">
                Class Coordinators have authorized permissions for their designated class section, including legitimate School Activity / Academic Bypasses.
              </p>
            </div>
          </div>

          {loadingSections ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : sections.length === 0 ? (
            <EmptyState
              icon={<Layers className="w-12 h-12 text-slate-300" />}
              title="No Class Sections Configured"
              description="Create classes and sections under Academic Structure before assigning Class Coordinators."
            />
          ) : (
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="p-3">Class</th>
                    <th className="p-3">Section</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Current Coordinator</th>
                    <th className="p-3">Assigned Since</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sections.map((sec) => {
                    const activeHistory = sec.coordinatorHistories && sec.coordinatorHistories.length > 0 ? sec.coordinatorHistories[0] : null;
                    const coordUser = activeHistory?.faculty?.user;

                    return (
                      <tr key={sec.id} className="hover:bg-gray-50/50">
                        <td className="p-3 font-semibold text-gray-900">{sec.class?.name}</td>
                        <td className="p-3 font-medium text-gray-800">{sec.name}</td>
                        <td className="p-3 text-gray-600">{sec.class?.department?.name || 'General Academic'}</td>
                        <td className="p-3">
                          {coordUser ? (
                            <span className="font-semibold text-indigo-700 flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                              {coordUser.firstName} {coordUser.lastName}
                            </span>
                          ) : (
                            <span className="text-amber-600 italic">No Coordinator Assigned</span>
                          )}
                        </td>
                        <td className="p-3 text-gray-500 font-mono">
                          {activeHistory?.startDate ? new Date(activeHistory.startDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={coordUser ? 'success' : 'warning'}>
                            {coordUser ? 'ACTIVE' : 'UNASSIGNED'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAssignCoordinatorModal(sec)}
                            >
                              {coordUser ? 'Change Coordinator' : 'Assign Coordinator'}
                            </Button>

                            {coordUser && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleUnassignCoordinator(sec)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openCoordinatorHistory(sec)}
                            >
                              <History className="w-3.5 h-3.5" />
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

      {/* Modal: Create Class */}
      <Modal isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} title="Create New Class / Grade">
        <form onSubmit={handleCreateClass} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class Name *</label>
            <Input
              placeholder="e.g. Class 1, Class 10"
              value={classForm.name}
              onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Class Code *</label>
              <Input
                placeholder="e.g. CLS-1, CLS-10"
                value={classForm.code}
                onChange={(e) => setClassForm({ ...classForm, code: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Order (1..12) *</label>
              <Input
                type="number"
                min="1"
                max="12"
                value={classForm.order}
                onChange={(e) => setClassForm({ ...classForm, order: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Education Level *</label>
              <select
                className="w-full rounded-md border border-slate-300 p-2 text-xs"
                value={classForm.educationLevel}
                onChange={(e) => setClassForm({ ...classForm, educationLevel: e.target.value })}
                required
              >
                <option value="PRIMARY">Primary (Classes 1–5)</option>
                <option value="MIDDLE">Middle (Classes 6–8)</option>
                <option value="SECONDARY">Secondary (Classes 9–10)</option>
                <option value="HIGHER_SECONDARY">Higher Secondary (Classes 11–12)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year *</label>
              <select
                className="w-full rounded-md border border-slate-300 p-2 text-xs"
                value={classForm.academicYearId}
                onChange={(e) => setClassForm({ ...classForm, academicYearId: e.target.value })}
                required
              >
                <option value="">Select Year</option>
                {academicYearsList.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} {y.isCurrent ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department (Optional)</label>
            <select
              className="w-full rounded-md border border-slate-300 p-2 text-xs"
              value={classForm.departmentId}
              onChange={(e) => setClassForm({ ...classForm, departmentId: e.target.value })}
            >
              <option value="">No specific department (General)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsClassModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
              Create Class
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Section */}
      <Modal isOpen={isSectionModalOpen} onClose={() => setIsSectionModalOpen(false)} title="Create Class Section">
        <form onSubmit={handleCreateSection} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Class *</label>
            <select
              className="w-full rounded-md border border-slate-300 p-2 text-xs"
              value={sectionForm.classId}
              onChange={(e) => setSectionForm({ ...sectionForm, classId: e.target.value })}
              required
            >
              <option value="">Select Class</option>
              {classesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Section Name *</label>
              <Input
                placeholder="e.g. Section A, Section B"
                value={sectionForm.name}
                onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Capacity (Max Students) *</label>
              <Input
                type="number"
                min="1"
                value={sectionForm.capacity}
                onChange={(e) => setSectionForm({ ...sectionForm, capacity: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class Coordinator (Optional)</label>
            <select
              className="w-full rounded-md border border-slate-300 p-2 text-xs"
              value={sectionForm.coordinatorFacultyId}
              onChange={(e) => setSectionForm({ ...sectionForm, coordinatorFacultyId: e.target.value })}
            >
              <option value="">Assign later</option>
              {allFaculty.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.user?.firstName} {fac.user?.lastName} ({fac.department?.name || 'Faculty'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsSectionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
              Create Section
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Academic Year */}
      <Modal isOpen={isYearModalOpen} onClose={() => setIsYearModalOpen(false)} title="Create Academic Year">
        <form onSubmit={handleCreateAcademicYear} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year Name *</label>
            <Input
              placeholder="e.g. 2026-2027"
              value={yearForm.name}
              onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
              <Input
                type="date"
                value={yearForm.startDate}
                onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
              <Input
                type="date"
                value={yearForm.endDate}
                onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mandatory Enrollment Prefix *
              </label>
              <Input
                placeholder="e.g. 26"
                value={yearForm.enrollmentPrefix}
                onChange={(e) => setYearForm({ ...yearForm, enrollmentPrefix: e.target.value })}
                required
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Required for generating enrollment numbers (e.g. 260001).</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sequence Length</label>
              <Input
                type="number"
                min="3"
                max="6"
                value={yearForm.enrollmentSeqLength}
                onChange={(e) => setYearForm({ ...yearForm, enrollmentSeqLength: Number(e.target.value) })}
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Default 4 (e.g. 0001..9999).</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isCurrentYear"
              checked={yearForm.isCurrent}
              onChange={(e) => setYearForm({ ...yearForm, isCurrent: e.target.checked })}
              className="rounded border-slate-300"
            />
            <label htmlFor="isCurrentYear" className="text-xs text-slate-700 font-medium">
              Activate and set as the current academic year immediately
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsYearModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
              Create Academic Year
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 1: Create Department */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Academic Department">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department Code *</label>
            <Input
              placeholder="e.g. CS, MECH, MATH, BIO"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name *</label>
            <Input
              placeholder="e.g. Computer Science & Engineering"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
            <Input
              placeholder="Brief description of the department..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
              Save Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Assign HOD */}
      <Modal
        isOpen={isHodModalOpen}
        onClose={() => setIsHodModalOpen(false)}
        title={`Appoint HOD — ${selectedDeptForHod?.name}`}
      >
        <form onSubmit={handleAssignHod} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Faculty Member *</label>
            {candidateFaculty.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                No faculty members are currently assigned to this department. Please assign faculty before appointing an HOD.
              </p>
            ) : (
              <select
                className="w-full rounded-md border border-slate-300 p-2 text-xs"
                value={hodUserId}
                onChange={(e) => setHodUserId(e.target.value)}
                required
              >
                {candidateFaculty.map((f: any) => (
                  <option key={f.userId} value={f.userId}>
                    {f.user?.firstName} {f.user?.lastName} ({f.employeeCode}) — {f.designation}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Appointment Justification / Reason</label>
            <Input
              placeholder="e.g. Annual academic rotation, new department tenure appointment..."
              value={hodReason}
              onChange={(e) => setHodReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsHodModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSaving}
              disabled={candidateFaculty.length === 0}
            >
              Confirm Appointment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Assign / Change Class Coordinator */}
      <Modal
        isOpen={isCoordModalOpen}
        onClose={() => setIsCoordModalOpen(false)}
        title={`Assign Class Coordinator — ${selectedSectionForCoord?.class?.name} - ${selectedSectionForCoord?.name}`}
      >
        <form onSubmit={handleAssignCoordinator} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div className="p-3 bg-indigo-50 border border-indigo-100 text-xs text-indigo-800 rounded-lg">
            <strong>Role Authorization:</strong> The assigned Class Coordinator will immediately receive special attendance bypass capabilities for legitimate school activities strictly within this designated class section.
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Academic Year *</label>
            <select
              className="w-full rounded-md border border-gray-300 p-2 text-xs"
              value={coordYearId}
              onChange={(e) => setCoordYearId(e.target.value)}
              required
            >
              {years.map((y: any) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.isCurrent ? '(Current Active Year)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Authorized Faculty Member *</label>
            {allFaculty.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                No active faculty members registered in system.
              </p>
            ) : (
              <select
                className="w-full rounded-md border border-gray-300 p-2 text-xs"
                value={coordFacultyId}
                onChange={(e) => setCoordFacultyId(e.target.value)}
                required
              >
                {allFaculty.map((f: any) => (
                  <option key={f.id} value={f.id}>
                    {f.user?.firstName} {f.user?.lastName} ({f.employeeCode || 'Faculty'}) — {f.designation || 'Teacher'}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Appointment Reason *</label>
            <Input
              placeholder="e.g. Academic year class coordinator appointment approved by Principal..."
              value={coordReason}
              onChange={(e) => setCoordReason(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsCoordModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSaving} disabled={allFaculty.length === 0}>
              Save Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Coordinator History Timeline */}
      <Modal
        isOpen={isCoordHistoryModalOpen}
        onClose={() => setIsCoordHistoryModalOpen(false)}
        title={`Class Coordinator History — ${selectedSectionForHistory?.class?.name} - ${selectedSectionForHistory?.name}`}
      >
        <div className="space-y-4 text-xs">
          {loadingHistory ? (
            <div className="py-8 flex justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : coordHistoryList.length === 0 ? (
            <p className="text-gray-400 italic py-6 text-center">No coordinator assignment history recorded for this section.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {coordHistoryList.map((h: any) => (
                <div
                  key={h.id}
                  className="p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-gray-50/50"
                >
                  <div>
                    <div className="font-semibold text-gray-900">
                      {h.faculty?.user?.firstName} {h.faculty?.user?.lastName}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Tenure: {new Date(h.startDate).toLocaleDateString()} — {h.endDate ? new Date(h.endDate).toLocaleDateString() : 'Present'}
                    </div>
                    {h.assignedBy && (
                      <div className="text-[10px] text-gray-500">
                        Appointed by: {h.assignedBy.firstName} {h.assignedBy.lastName}
                      </div>
                    )}
                    {h.reason && (
                      <div className="text-[10px] text-gray-600 italic mt-1">
                        "{h.reason}"
                      </div>
                    )}
                  </div>
                  <Badge variant={h.status === 'ACTIVE' ? 'success' : 'secondary'}>
                    {h.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <Button variant="ghost" size="sm" onClick={() => setIsCoordHistoryModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 5: Department Details & HOD History Timeline */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`${selectedDeptDetail?.name} (${selectedDeptDetail?.code}) — Overview`}
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg">
            <div>
              <span className="text-slate-400">Total Faculty:</span>{' '}
              <span className="font-semibold text-slate-800">
                {selectedDeptDetail?.facultyMembers?.length || 0}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Subjects Catalog:</span>{' '}
              <span className="font-semibold text-slate-800">
                {selectedDeptDetail?.subjects?.length || 0}
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              HOD Leadership History
            </h4>

            {!selectedDeptDetail?.hodHistory || selectedDeptDetail.hodHistory.length === 0 ? (
              <p className="text-slate-400 italic">No HOD appointments recorded for this department.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {selectedDeptDetail.hodHistory.map((h: any) => (
                  <div
                    key={h.id}
                    className="p-2.5 border border-slate-200 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {h.hod?.firstName} {h.hod?.lastName}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Tenure: {new Date(h.startDate).toLocaleDateString()} —{' '}
                        {h.endDate ? new Date(h.endDate).toLocaleDateString() : 'Present'}
                      </div>
                      {h.reason && (
                        <div className="text-[10px] text-slate-600 italic mt-0.5">
                          "{h.reason}"
                        </div>
                      )}
                    </div>
                    <Badge variant={h.status === 'ACTIVE' ? 'success' : 'secondary'}>
                      {h.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setIsDetailModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
