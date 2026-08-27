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
  BookOpen,
  Plus,
  Users,
  UserCheck,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

const SCHOOL_CLASS_OPTIONS = [
  { name: 'Class 1', code: 'CLS-1', order: 1, level: 'PRIMARY' },
  { name: 'Class 2', code: 'CLS-2', order: 2, level: 'PRIMARY' },
  { name: 'Class 3', code: 'CLS-3', order: 3, level: 'PRIMARY' },
  { name: 'Class 4', code: 'CLS-4', order: 4, level: 'PRIMARY' },
  { name: 'Class 5', code: 'CLS-5', order: 5, level: 'PRIMARY' },
  { name: 'Class 6', code: 'CLS-6', order: 6, level: 'MIDDLE' },
  { name: 'Class 7', code: 'CLS-7', order: 7, level: 'MIDDLE' },
  { name: 'Class 8', code: 'CLS-8', order: 8, level: 'MIDDLE' },
  { name: 'Class 9', code: 'CLS-9', order: 9, level: 'SECONDARY' },
  { name: 'Class 10', code: 'CLS-10', order: 10, level: 'SECONDARY' },
];

export const DepartmentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CLASSES_SECTIONS' | 'ACADEMIC_YEARS' | 'COORDINATORS'>('CLASSES_SECTIONS');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Class & Section State
  const [classesList, setClassesList] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classForm, setClassForm] = useState({
    name: 'Class 1',
    code: 'CLS-1',
    order: 1,
    educationLevel: 'PRIMARY',
    academicYearId: '',
  });

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sectionForm, setSectionForm] = useState({
    classId: '',
    name: 'Section A',
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

  // Initial Load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    await Promise.all([fetchClasses(), fetchAcademicYears(), fetchSectionsAndFaculty()]);
    setIsLoading(false);
  };

  // Fetch Classes
  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const res = await academicApi.getClasses();
      if (res.success && res.data) {
        setClassesList(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch classes:', err);
    } finally {
      setLoadingClasses(false);
    }
  };

  // Fetch Academic Years
  const fetchAcademicYears = async () => {
    setLoadingYears(true);
    try {
      const res = await academicApi.getYears();
      if (res.success && res.data) {
        setAcademicYearsList(res.data);
        setYears(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch academic years:', err);
    } finally {
      setLoadingYears(false);
    }
  };

  // Fetch Sections & Faculty for Coordinators
  const fetchSectionsAndFaculty = async () => {
    setLoadingSections(true);
    try {
      const [secRes, facRes] = await Promise.all([
        academicApi.getSections(),
        academicApi.getFaculty(),
      ]);
      if (secRes.success && secRes.data) setSections(secRes.data);
      if (facRes.success && facRes.data) setAllFaculty(facRes.data);
    } catch (err: any) {
      console.error('Failed to fetch sections and faculty:', err);
    } finally {
      setLoadingSections(false);
    }
  };

  // Handle Class Standard Select Change
  const handleClassStandardSelect = (stdName: string) => {
    const matched = SCHOOL_CLASS_OPTIONS.find((c) => c.name === stdName);
    if (matched) {
      setClassForm((prev) => ({
        ...prev,
        name: matched.name,
        code: matched.code,
        order: matched.order,
        educationLevel: matched.level,
      }));
    } else {
      setClassForm((prev) => ({ ...prev, name: stdName }));
    }
  };

  // Handle Create Class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name || !classForm.code || !classForm.academicYearId) {
      setError('Please fill in all mandatory class parameters.');
      return;
    }

    try {
      const res = await academicApi.createClass({
        name: classForm.name,
        code: classForm.code,
        order: Number(classForm.order),
        educationLevel: classForm.educationLevel,
        academicYearId: classForm.academicYearId,
      });

      if (res.success) {
        setSuccessMsg(`Class "${classForm.name}" created successfully.`);
        setIsClassModalOpen(false);
        setClassForm({
          name: 'Class 1',
          code: 'CLS-1',
          order: 1,
          educationLevel: 'PRIMARY',
          academicYearId: '',
        });
        fetchClasses();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create school class.');
    }
  };

  // Handle Create Section
  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionForm.classId || !sectionForm.name) {
      setError('Please select a class and specify a section name (e.g. Section A).');
      return;
    }

    try {
      const res = await academicApi.createSection({
        classId: sectionForm.classId,
        name: sectionForm.name,
        capacity: Number(sectionForm.capacity) || 40,
        coordinatorFacultyId: sectionForm.coordinatorFacultyId || undefined,
      });

      if (res.success) {
        setSuccessMsg(`Section "${sectionForm.name}" created successfully.`);
        setIsSectionModalOpen(false);
        setSectionForm({
          classId: '',
          name: 'Section A',
          capacity: 40,
          coordinatorFacultyId: '',
        });
        fetchClasses();
        fetchSectionsAndFaculty();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create section.');
    }
  };

  // Handle Create Academic Year
  const handleCreateAcademicYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearForm.name || !yearForm.startDate || !yearForm.endDate) {
      setError('Please provide year name and start/end dates.');
      return;
    }

    try {
      const res = await academicApi.createYear({
        name: yearForm.name,
        startDate: yearForm.startDate,
        endDate: yearForm.endDate,
        enrollmentPrefix: yearForm.enrollmentPrefix || undefined,
        enrollmentSeqLength: Number(yearForm.enrollmentSeqLength) || 4,
        isCurrent: yearForm.isCurrent,
      });

      if (res.success) {
        setSuccessMsg(`Academic Year "${yearForm.name}" created successfully.`);
        setIsYearModalOpen(false);
        setYearForm({
          name: '',
          startDate: '',
          endDate: '',
          enrollmentPrefix: '26',
          enrollmentSeqLength: 4,
          isCurrent: false,
        });
        fetchAcademicYears();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create academic year.');
    }
  };

  // Open Coordinator Modal
  const openCoordModal = (sec: any) => {
    setSelectedSectionForCoord(sec);
    setCoordFacultyId(sec.coordinatorFacultyId || (allFaculty[0]?.id || ''));
    const activeYr = years.find((y) => y.isCurrent) || years[0];
    setCoordYearId(sec.class?.academicYearId || activeYr?.id || '');
    setCoordReason('Official Class Coordinator appointment.');
    setError(null);
    setIsCoordModalOpen(true);
  };

  // Handle Assign Coordinator
  const handleAssignCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSectionForCoord || !coordFacultyId || !coordYearId) {
      setError('Please select faculty and academic year.');
      return;
    }

    try {
      const res = await academicApi.assignClassCoordinator(selectedSectionForCoord.id, {
        facultyId: coordFacultyId,
        academicYearId: coordYearId,
        reason: coordReason || 'Class Coordinator appointment.',
      });

      if (res.success) {
        setSuccessMsg(`Class Coordinator successfully assigned to ${selectedSectionForCoord.name}.`);
        setIsCoordModalOpen(false);
        fetchSectionsAndFaculty();
        fetchClasses();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to assign class coordinator.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">School Academic Structure</h1>
            <Badge variant="primary" className="bg-indigo-500/20 text-indigo-200 border-indigo-500/30">
              Classes 1 – 10
            </Badge>
          </div>
          <p className="text-slate-300 text-sm mt-1">
            Configure school academic years, standards Class 1–10, manual sections, and Class Coordinator assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'CLASSES_SECTIONS' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
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
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
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
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
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

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('CLASSES_SECTIONS')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'CLASSES_SECTIONS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Classes & Sections ({classesList.length} Active Classes)
        </button>

        <button
          onClick={() => setActiveTab('ACADEMIC_YEARS')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'ACADEMIC_YEARS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Academic Years & Prefixes ({academicYearsList.length})
        </button>

        <button
          onClick={() => setActiveTab('COORDINATORS')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'COORDINATORS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Class Coordinators ({sections.length} Sections)
        </button>
      </div>

      {/* Notification Banners */}
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

      {/* TAB 1: CLASSES & SECTIONS */}
      {activeTab === 'CLASSES_SECTIONS' && (
        <Card className="p-6 space-y-4 border border-slate-200">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">School Classes & Active Sections</h2>
              <p className="text-xs text-gray-500">
                School standards (Class 1 to Class 10) with designated manual sections, student capacities, and assigned Class Coordinators.
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
              title="No School Classes Created"
              description="Administrative/Office staff creates actual classes (Class 1 through Class 10) according to student admissions."
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
                <div key={c.id} className="p-4 border border-slate-200 rounded-xl bg-white space-y-3 hover:border-indigo-200 transition shadow-xs">
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

                  {/* Sections List */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                      Sections ({c.sections?.length || 0})
                    </span>
                    {!c.sections || c.sections.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No sections created yet for {c.name}. Click "Add Section" to create one.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {c.sections.map((sec: any) => (
                          <div key={sec.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                            <div className="flex items-center justify-between font-semibold text-slate-800">
                              <span>{sec.name}</span>
                              <Badge variant="secondary" className="text-[10px]">
                                Cap: {sec.capacity || 40}
                              </Badge>
                            </div>

                            <div className="text-slate-500 flex items-center justify-between">
                              <span>Coordinator:</span>
                              <span className="font-medium text-slate-700">
                                {sec.coordinatorFaculty?.user
                                  ? `${sec.coordinatorFaculty.user.firstName} ${sec.coordinatorFaculty.user.lastName}`
                                  : <span className="text-amber-600">Unassigned</span>}
                              </span>
                            </div>

                            <div className="flex justify-end pt-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[11px] h-6 px-2 text-indigo-600 hover:text-indigo-700"
                                onClick={() => openCoordModal(sec)}
                              >
                                {sec.coordinatorFaculty ? 'Change Coordinator' : 'Assign Coordinator'}
                              </Button>
                            </div>
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

      {/* TAB 2: ACADEMIC YEARS & PREFIXES */}
      {activeTab === 'ACADEMIC_YEARS' && (
        <Card className="p-6 space-y-4 border border-slate-200">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">Academic Years & Enrollment Number Prefixes</h2>
              <p className="text-xs text-gray-500">
                Configure institutional academic year cycles and unique student enrollment number prefixes (e.g. 26 for 2026–27).
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
              description="Start by creating the current academic year cycle."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsYearModalOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create Academic Year
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {academicYearsList.map((y) => (
                <div key={y.id} className="p-5 border border-slate-200 rounded-xl bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">{y.name}</h3>
                    {y.isCurrent ? (
                      <Badge variant="primary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        Current Active Year
                      </Badge>
                    ) : (
                      <Badge variant="secondary">{y.status || 'UPCOMING'}</Badge>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Enrollment Prefix:</span>
                      <span className="font-bold text-indigo-700">{y.enrollmentPrefix || 'None'}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Sequence Length:</span>
                      <span className="font-medium text-slate-700">{y.enrollmentSeqLength || 4} digits</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Start Date:</span>
                      <span className="font-medium text-slate-700">{y.startDate ? new Date(y.startDate).toLocaleDateString() : '—'}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>End Date:</span>
                      <span className="font-medium text-slate-700">{y.endDate ? new Date(y.endDate).toLocaleDateString() : '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: CLASS COORDINATORS */}
      {activeTab === 'COORDINATORS' && (
        <Card className="p-6 space-y-4 border border-slate-200">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">Class Coordinator Assignments</h2>
              <p className="text-xs text-gray-500">
                Assigned faculty have Class Coordinator permissions to manage attendance, student reviews, and school activity bypasses for their specific section.
              </p>
            </div>
          </div>

          {loadingSections ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : sections.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="w-12 h-12 text-slate-300" />}
              title="No Sections Available"
              description="Create school classes and sections first before assigning coordinators."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Class & Section</th>
                    <th className="py-3 px-4">Academic Year</th>
                    <th className="py-3 px-4">Class Coordinator</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sections.map((sec) => (
                    <tr key={sec.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {sec.class?.name} — {sec.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {sec.class?.academicYear?.name || '—'}
                      </td>
                      <td className="py-3 px-4">
                        {sec.coordinatorFaculty?.user ? (
                          <span className="font-medium text-slate-800 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            {sec.coordinatorFaculty.user.firstName} {sec.coordinatorFaculty.user.lastName} ({sec.coordinatorFaculty.employeeCode})
                          </span>
                        ) : (
                          <span className="text-amber-600 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCoordModal(sec)}
                        >
                          {sec.coordinatorFaculty ? 'Change' : 'Assign'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Modal 1: Create Class (Class 1 to Class 10) */}
      <Modal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        title="Create School Class (Classes 1 – 10)"
      >
        <form onSubmit={handleCreateClass} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select School Standard *</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              value={classForm.name}
              onChange={(e) => handleClassStandardSelect(e.target.value)}
            >
              {SCHOOL_CLASS_OPTIONS.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.level})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Class Code *"
              value={classForm.code}
              onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
              placeholder="e.g. CLS-1"
              required
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Education Level *</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                value={classForm.educationLevel}
                onChange={(e) => setClassForm({ ...classForm, educationLevel: e.target.value })}
              >
                <option value="PRIMARY">PRIMARY (Classes 1–5)</option>
                <option value="MIDDLE">MIDDLE (Classes 6–8)</option>
                <option value="SECONDARY">SECONDARY (Classes 9–10)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year *</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              value={classForm.academicYearId}
              onChange={(e) => setClassForm({ ...classForm, academicYearId: e.target.value })}
              required
            >
              <option value="">-- Select Academic Year --</option>
              {academicYearsList.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsClassModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Class
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Create Section */}
      <Modal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        title="Create Manual Section"
      >
        <form onSubmit={handleCreateSection} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target School Class *</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              value={sectionForm.classId}
              onChange={(e) => setSectionForm({ ...sectionForm, classId: e.target.value })}
              required
            >
              <option value="">-- Select Class --</option>
              {classesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.academicYear?.name})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Section Name *"
              value={sectionForm.name}
              onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
              placeholder="e.g. Section A, Section B"
              required
            />
            <Input
              label="Student Capacity *"
              type="number"
              value={sectionForm.capacity}
              onChange={(e) => setSectionForm({ ...sectionForm, capacity: Number(e.target.value) })}
              min={1}
              max={150}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsSectionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Section
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Create Academic Year */}
      <Modal
        isOpen={isYearModalOpen}
        onClose={() => setIsYearModalOpen(false)}
        title="Create Academic Year Cycle"
      >
        <form onSubmit={handleCreateAcademicYear} className="space-y-4">
          <Input
            label="Academic Year Name *"
            value={yearForm.name}
            onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
            placeholder="e.g. 2026-2027"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date *"
              type="date"
              value={yearForm.startDate}
              onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })}
              required
            />
            <Input
              label="End Date *"
              type="date"
              value={yearForm.endDate}
              onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Enrollment Prefix (e.g. 26)"
              value={yearForm.enrollmentPrefix}
              onChange={(e) => setYearForm({ ...yearForm, enrollmentPrefix: e.target.value })}
              placeholder="26"
            />
            <Input
              label="Sequence Length"
              type="number"
              value={yearForm.enrollmentSeqLength}
              onChange={(e) => setYearForm({ ...yearForm, enrollmentSeqLength: Number(e.target.value) })}
              min={3}
              max={8}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isCurrentYear"
              checked={yearForm.isCurrent}
              onChange={(e) => setYearForm({ ...yearForm, isCurrent: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isCurrentYear" className="text-xs text-slate-700 font-medium">
              Set as current active academic year
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsYearModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Academic Year
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Assign Class Coordinator */}
      <Modal
        isOpen={isCoordModalOpen}
        onClose={() => setIsCoordModalOpen(false)}
        title={`Assign Coordinator — ${selectedSectionForCoord?.class?.name || ''} (${selectedSectionForCoord?.name || ''})`}
      >
        <form onSubmit={handleAssignCoordinator} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Faculty *</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              value={coordFacultyId}
              onChange={(e) => setCoordFacultyId(e.target.value)}
              required
            >
              <option value="">-- Select Faculty --</option>
              {allFaculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.user ? `${f.user.firstName} ${f.user.lastName}` : f.id} ({f.employeeCode || 'Faculty'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year *</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              value={coordYearId}
              onChange={(e) => setCoordYearId(e.target.value)}
              required
            >
              <option value="">-- Select Academic Year --</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Appointment Reason / Notes"
            value={coordReason}
            onChange={(e) => setCoordReason(e.target.value)}
            placeholder="Official Class Coordinator appointment"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsCoordModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Appoint Coordinator
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
