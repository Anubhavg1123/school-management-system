import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  User,
  MapPin,
  Plus,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Trash2,
  Edit,
  Shield,
  Layers,
  Filter,
  Users,
} from 'lucide-react';
import { academicApi } from '../../api/academic';
import { useAuth } from '../../context/AuthContext';
import {
  AcademicYear,
  ClassItem,
  SectionItem,
  Department,
  Subject,
  Room,
  TimeSlot,
  TimetableEntry,
  ExtraClassRequest,
  DayOfWeekEnum,
} from '../../types';

export const TimetableManagement: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles.includes('SUPER_ADMIN');
  const isOfficeAdmin = user?.roles.includes('OFFICE_ADMIN');
  const isHod = user?.roles.includes('HOD');
  const canManage = isSuperAdmin || isOfficeAdmin || isHod;

  // View state
  const [viewMode, setViewMode] = useState<'SECTION' | 'FACULTY' | 'ROOM' | 'EXTRA_CLASSES' | 'ROOMS_LIST'>('SECTION');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Metadata
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Flexible Custom Time Slot Modal
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [slotDay, setSlotDay] = useState<string>('ALL');
  const [slotName, setSlotName] = useState('Period 1');
  const [slotStartTime, setSlotStartTime] = useState('08:30');
  const [slotEndTime, setSlotEndTime] = useState('09:30');
  const [slotIsBreak, setSlotIsBreak] = useState(false);

  // Timetable Entries & Extra Classes
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [extraClasses, setExtraClasses] = useState<ExtraClassRequest[]>([]);

  // Add / Edit Entry Modal
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [selectedSlotForAdd, setSelectedSlotForAdd] = useState<{ day: string; slot: TimeSlot } | null>(null);
  const [selectedExistingEntry, setSelectedExistingEntry] = useState<TimetableEntry | null>(null);
  const [entrySubjectId, setEntrySubjectId] = useState('');
  const [entryFacultyId, setEntryFacultyId] = useState('');
  const [entryRoomId, setEntryRoomId] = useState('');
  const [entryClassId, setEntryClassId] = useState('');
  const [entrySectionId, setEntrySectionId] = useState('');
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [conflictChecking, setConflictChecking] = useState(false);

  // Extra Class Modal
  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false);
  const [extraDate, setExtraDate] = useState(new Date().toISOString().split('T')[0]);
  const [extraStartTime, setExtraStartTime] = useState('16:00');
  const [extraEndTime, setExtraEndTime] = useState('17:30');
  const [extraSubjectId, setExtraSubjectId] = useState('');
  const [extraFacultyId, setExtraFacultyId] = useState('');
  const [extraRoomId, setExtraRoomId] = useState('');
  const [extraClassId, setExtraClassId] = useState('');
  const [extraSectionId, setExtraSectionId] = useState('');
  const [extraReason, setExtraReason] = useState('');

  // Substitute Modal
  const [isSubstituteModalOpen, setIsSubstituteModalOpen] = useState(false);
  const [selectedTimetableForSub, setSelectedTimetableForSub] = useState<TimetableEntry | null>(null);
  const [substituteFacultyId, setSubstituteFacultyId] = useState('');
  const [substituteDate, setSubstituteDate] = useState(new Date().toISOString().split('T')[0]);
  const [substituteReason, setSubstituteReason] = useState('');

  // Days list
  const DAYS = [
    DayOfWeekEnum.MONDAY,
    DayOfWeekEnum.TUESDAY,
    DayOfWeekEnum.WEDNESDAY,
    DayOfWeekEnum.THURSDAY,
    DayOfWeekEnum.FRIDAY,
    DayOfWeekEnum.SATURDAY,
  ];

  // Fetch initial master data
  useEffect(() => {
    fetchMasterData();
  }, []);

  // When selected academic year or filters change, fetch timetable
  useEffect(() => {
    if (selectedYearId) {
      fetchTimetable();
      fetchTimeSlots();
    }
  }, [selectedYearId, selectedClassId, selectedSectionId, selectedFacultyId, selectedRoomId, viewMode]);

  // When class changes, fetch its sections and subjects
  useEffect(() => {
    if (selectedClassId) {
      academicApi.getSections(selectedClassId).then((res) => {
        if (res.success) {
          setSections(res.data || []);
          if (res.data && res.data.length > 0 && !selectedSectionId) {
            setSelectedSectionId(res.data[0].id);
          }
        }
      });
      academicApi.getClassSubjects(selectedClassId, selectedYearId).then((res) => {
        if (res.success && res.data) {
          setSubjects(res.data.map((cs: any) => cs.subject));
        }
      });
    }
  }, [selectedClassId, selectedYearId]);

  const fetchMasterData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [yearsRes, deptsRes, classesRes, roomsRes, facAssignmentsRes] = await Promise.all([
        academicApi.getYears(),
        academicApi.getDepartments(),
        academicApi.getClasses(),
        academicApi.getRooms(),
        academicApi.getFacultyAssignments(),
      ]);

      if (yearsRes.success && yearsRes.data) {
        setAcademicYears(yearsRes.data);
        const curr = yearsRes.data.find((y: any) => y.isCurrent) || yearsRes.data[0];
        if (curr) setSelectedYearId(curr.id);
      }

      if (deptsRes.success && deptsRes.data) setDepartments(deptsRes.data);
      if (classesRes.success && classesRes.data) {
        setClasses(classesRes.data);
        if (classesRes.data.length > 0) setSelectedClassId(classesRes.data[0].id);
      }
      if (roomsRes.success && roomsRes.data) {
        setRooms(roomsRes.data);
        if (roomsRes.data.length > 0) setSelectedRoomId(roomsRes.data[0].id);
      }

      // Extract unique faculty from assignments or departments
      const facMap = new Map();
      if (facAssignmentsRes.success && facAssignmentsRes.data) {
        facAssignmentsRes.data.forEach((fa: any) => {
          if (fa.faculty) {
            facMap.set(fa.faculty.id, {
              id: fa.faculty.id,
              name: `${fa.faculty.user?.firstName || ''} ${fa.faculty.user?.lastName || ''}`,
              dept: fa.faculty.department?.name,
            });
          }
        });
      }
      setFacultyList(Array.from(facMap.values()));
      if (facMap.size > 0 && !selectedFacultyId) {
        setSelectedFacultyId(Array.from(facMap.keys())[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load master academic settings.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSlots = async () => {
    if (!selectedYearId) return;
    try {
      const res = await academicApi.getTimeSlots(selectedYearId);
      if (res.success && res.data) {
        setTimeSlots(res.data);
      }
    } catch (err) {
      console.error('Error loading time slots', err);
    }
  };

  const fetchTimetable = async () => {
    if (!selectedYearId) return;
    try {
      const params: any = { academicYearId: selectedYearId };
      if (viewMode === 'SECTION' && selectedSectionId) {
        params.sectionId = selectedSectionId;
      } else if (viewMode === 'FACULTY' && selectedFacultyId) {
        params.facultyId = selectedFacultyId;
      } else if (viewMode === 'ROOM' && selectedRoomId) {
        params.roomId = selectedRoomId;
      }

      const res = await academicApi.getTimetable(params);
      if (res.success && res.data) {
        setTimetableEntries(res.data);
      }

      const extraRes = await academicApi.getExtraClasses({ academicYearId: selectedYearId });
      if (extraRes.success && extraRes.data) {
        setExtraClasses(extraRes.data);
      }
    } catch (err: any) {
      console.error('Error fetching timetable', err);
    }
  };

  const handleCreateCustomSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYearId) {
      setError('Please select an Academic Year first.');
      return;
    }
    if (slotStartTime >= slotEndTime) {
      setError('Slot Start Time must be earlier than End Time.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const daysToCreate = slotDay === 'ALL' ? DAYS : [slotDay as DayOfWeekEnum];
      for (const d of daysToCreate) {
        const daySlots = timeSlots.filter((s) => s.dayOfWeek === d);
        const nextPeriod = daySlots.length > 0 ? Math.max(...daySlots.map((s) => s.periodNumber)) + 1 : 1;
        await academicApi.createTimeSlot({
          academicYearId: selectedYearId,
          dayOfWeek: d,
          periodNumber: nextPeriod,
          name: slotName,
          startTime: slotStartTime,
          endTime: slotEndTime,
          isBreak: slotIsBreak,
        });
      }
      setSuccessMsg(`Time slot '${slotName}' (${slotStartTime} - ${slotEndTime}) created successfully.`);
      setIsSlotModalOpen(false);
      await fetchTimeSlots();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create custom time slot.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!window.confirm('Are you sure you want to delete this time slot?')) return;
    try {
      setLoading(true);
      const res = await academicApi.deleteTimeSlot(slotId);
      if (res.success) {
        setSuccessMsg('Time slot deleted successfully.');
        await fetchTimeSlots();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete time slot.');
    } finally {
      setLoading(false);
    }
  };

  const openAddEntryModal = (day: string, slot: TimeSlot, existing?: TimetableEntry | null) => {
    setSelectedSlotForAdd({ day, slot });
    setSelectedExistingEntry(existing || null);
    setConflictError(null);
    setEntryClassId(existing?.classId || selectedClassId);
    setEntrySectionId(existing?.sectionId || selectedSectionId);
    setEntryFacultyId(existing?.facultyId || selectedFacultyId || (facultyList[0]?.id || ''));
    setEntryRoomId(existing?.roomId || selectedRoomId || (rooms[0]?.id || ''));
    setEntrySubjectId(existing?.subjectId || (subjects[0]?.id || ''));
    setIsEntryModalOpen(true);
  };

  const handleSaveTimetableEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotForAdd || !selectedYearId) return;

    setConflictChecking(true);
    setConflictError(null);

    try {
      if (selectedExistingEntry?.id) {
        // Update existing grid slot
        const res = await academicApi.updateTimetableEntry(selectedExistingEntry.id, {
          subjectId: entrySubjectId,
          facultyId: entryFacultyId,
          roomId: entryRoomId,
          timeSlotId: selectedSlotForAdd.slot.id,
          dayOfWeek: selectedSlotForAdd.day,
        });
        if (res.success) {
          setSuccessMsg('Timetable period assigned successfully without collisions.');
          setIsEntryModalOpen(false);
          fetchTimetable();
        }
      } else {
        const payload = {
          academicYearId: selectedYearId,
          classId: entryClassId,
          sectionId: entrySectionId,
          subjectId: entrySubjectId,
          facultyId: entryFacultyId,
          roomId: entryRoomId,
          timeSlotId: selectedSlotForAdd.slot.id,
          dayOfWeek: selectedSlotForAdd.day,
        };
        const res = await academicApi.createTimetableEntry(payload);
        if (res.success) {
          setSuccessMsg('Timetable entry scheduled successfully without collisions.');
          setIsEntryModalOpen(false);
          fetchTimetable();
        }
      }
    } catch (err: any) {
      setConflictError(err.response?.data?.error?.message || 'A timetable conflict occurred.');
    } finally {
      setConflictChecking(false);
    }
  };

  const handleClearPeriodAssignment = async (entryId: string) => {
    if (!window.confirm('Are you sure you want to unassign this period? The grid slot will remain available in the database.')) return;
    try {
      setLoading(true);
      const res = await academicApi.updateTimetableEntry(entryId, {
        subjectId: null,
        facultyId: null,
        roomId: null,
      });
      if (res.success) {
        setSuccessMsg('Period assignment cleared.');
        setIsEntryModalOpen(false);
        fetchTimetable();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to clear assignment.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm('Are you sure you want to remove this timetable entry?')) return;
    try {
      const res = await academicApi.deleteTimetableEntry(entryId);
      if (res.success) {
        setSuccessMsg('Timetable entry removed.');
        fetchTimetable();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to remove entry.');
    }
  };

  const handleRequestExtraClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await academicApi.requestExtraClass({
        academicYearId: selectedYearId,
        classId: extraClassId,
        sectionId: extraSectionId,
        subjectId: extraSubjectId,
        facultyId: extraFacultyId,
        roomId: extraRoomId,
        date: extraDate,
        startTime: extraStartTime,
        endTime: extraEndTime,
        reason: extraReason,
      });

      if (res.success) {
        setSuccessMsg('Extra class request submitted for review.');
        setIsExtraModalOpen(false);
        fetchTimetable();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to request extra class.');
    }
  };

  const handleReviewExtraClass = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await academicApi.reviewExtraClass(id, { action, reviewNotes: `Administrative review: ${action}` });
      if (res.success) {
        setSuccessMsg(`Extra class ${action.toLowerCase()}.`);
        fetchTimetable();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to review extra class.');
    }
  };

  const handleAssignSubstitute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTimetableForSub) return;
    try {
      const res = await academicApi.assignSubstitute({
        timetableEntryId: selectedTimetableForSub.id,
        originalFacultyId: selectedTimetableForSub.facultyId,
        substituteFacultyId,
        date: substituteDate,
        classId: selectedTimetableForSub.classId,
        sectionId: selectedTimetableForSub.sectionId,
        subjectId: selectedTimetableForSub.subjectId,
        timeSlotId: selectedTimetableForSub.timeSlotId,
        roomId: selectedTimetableForSub.roomId,
        reason: substituteReason,
      });

      if (res.success) {
        setSuccessMsg('Substitute faculty assigned successfully.');
        setIsSubstituteModalOpen(false);
        fetchTimetable();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to assign substitute.');
    }
  };

  // Group unique periods from all configured slots (ordered by start time)
  const uniqueTimeSlots = Array.from(
    new Map(timeSlots.map((s) => [`${s.startTime}-${s.endTime}`, s])).values()
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Institutional Timetable & Scheduling
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Flexible School Schedule & 5-Way Conflict Prevention Engine
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canManage && (
            <button
              onClick={() => setIsSlotModalOpen(true)}
              className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Custom Time Slot
            </button>
          )}

          <button
            onClick={() => {
              setExtraClassId(selectedClassId);
              setExtraSectionId(selectedSectionId);
              setExtraFacultyId(selectedFacultyId || (facultyList[0]?.id || ''));
              setExtraRoomId(selectedRoomId || (rooms[0]?.id || ''));
              setExtraSubjectId(subjects[0]?.id || '');
              setIsExtraModalOpen(true);
            }}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Request Extra Class
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Controls & Mode Selection */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
        {/* View Mode Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
          <button
            onClick={() => setViewMode('SECTION')}
            className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${
              viewMode === 'SECTION'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-semibold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Class & Section Timetable
          </button>

          <button
            onClick={() => setViewMode('FACULTY')}
            className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${
              viewMode === 'FACULTY'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-semibold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <User className="w-4 h-4" />
            Faculty Schedule & Workload
          </button>

          <button
            onClick={() => setViewMode('ROOM')}
            className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${
              viewMode === 'ROOM'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-semibold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Classroom & Lab Occupancy
          </button>

          <button
            onClick={() => setViewMode('EXTRA_CLASSES')}
            className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${
              viewMode === 'EXTRA_CLASSES'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-semibold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            Extra / Remedial Sessions ({extraClasses.length})
          </button>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Academic Year */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Academic Year
            </label>
            <select
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="w-full text-sm border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
            >
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.isCurrent ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Section View Filters */}
          {viewMode === 'SECTION' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Class / Grade
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full text-sm border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Section
                </label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full text-sm border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Cap: {s.capacity})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Faculty View Filter */}
          {viewMode === 'FACULTY' && (
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Faculty Member
              </label>
              <select
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                className="w-full text-sm border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
              >
                {facultyList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.dept ? `(${f.dept})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Room View Filter */}
          {viewMode === 'ROOM' && (
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Classroom / Laboratory
              </label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full text-sm border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roomNumber} - {r.name} ({r.type}, Cap: {r.capacity})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-end">
            <button
              onClick={fetchTimetable}
              className="w-full p-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Grid
            </button>
          </div>
        </div>
      </div>

      {/* Main Timetable Visual Period Grid */}
      {viewMode !== 'EXTRA_CLASSES' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading timetable grid...</div>
          ) : uniqueTimeSlots.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Clock className="w-10 h-10 text-gray-400 mx-auto" />
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                No daily schedule time slots configured yet for this academic year.
              </p>
              {canManage && (
                <button
                  onClick={() => setIsSlotModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add First Time Slot
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 w-28 uppercase text-xs">
                      Day / Period
                    </th>
                    {uniqueTimeSlots.map((slot) => (
                      <th
                        key={slot.id}
                        className={`px-3 py-3 text-center font-semibold text-xs uppercase tracking-wider ${
                          slot.isBreak
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 w-24'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>{slot.name}</span>
                          {canManage && (
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              title="Delete Slot"
                              className="text-gray-400 hover:text-red-500 text-[10px]"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 font-normal mt-0.5">
                          {slot.startTime} - {slot.endTime}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {DAYS.map((day) => (
                    <tr key={day} className="hover:bg-gray-50/50 dark:hover:bg-gray-750">
                      <td className="px-4 py-4 font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800/80 border-r border-gray-200 dark:border-gray-700">
                        {day}
                      </td>

                      {uniqueTimeSlots.map((refSlot) => {
                        // Find matching slot for this day
                        const actualSlot = timeSlots.find(
                          (s) => s.dayOfWeek === day && s.startTime === refSlot.startTime && s.endTime === refSlot.endTime
                        );

                        if (refSlot.isBreak) {
                          return (
                            <td
                              key={refSlot.id}
                              className="px-2 py-4 bg-amber-50/60 dark:bg-amber-950/20 text-center text-xs font-semibold text-amber-700 dark:text-amber-400 border-x border-amber-100 dark:border-amber-900/30"
                            >
                              <div className="writing-mode-vertical uppercase tracking-wider">{refSlot.name}</div>
                            </td>
                          );
                        }

                        // Find entry scheduled at this slot
                        const entry = actualSlot
                          ? timetableEntries.find((e) => e.timeSlotId === actualSlot.id && e.dayOfWeek === day)
                          : null;

                        const isAssigned = Boolean(entry && entry.subjectId && entry.subject);

                        return (
                          <td
                            key={refSlot.id}
                            className="px-2 py-3 border border-gray-100 dark:border-gray-700/60 align-top min-w-[140px] h-28"
                          >
                            {isAssigned && entry ? (
                              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs flex flex-col justify-between h-full group hover:shadow transition">
                                <div>
                                  <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                                    <span>{entry.subject?.code || 'SUB'}</span>
                                    <span
                                      className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                                        entry.subject?.type === 'LAB'
                                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                                      }`}
                                    >
                                      {entry.subject?.type || 'THEORY'}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-gray-700 dark:text-gray-300 font-medium truncate mt-0.5">
                                    {entry.subject?.name}
                                  </div>

                                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-400">
                                    <User className="w-3 h-3 text-indigo-500" />
                                    <span className="truncate">
                                      {entry.faculty?.user?.firstName} {entry.faculty?.user?.lastName}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    <MapPin className="w-3 h-3 text-emerald-500" />
                                    <span>
                                      {entry.room?.roomNumber || 'Room'} {entry.room?.name ? `(${entry.room.name})` : ''}
                                    </span>
                                  </div>
                                </div>

                                {canManage && (
                                  <div className="mt-2 pt-1 border-t border-indigo-100 dark:border-indigo-900 flex items-center justify-between opacity-0 group-hover:opacity-100 transition">
                                    <button
                                      onClick={() => actualSlot && openAddEntryModal(day, actualSlot, entry)}
                                      title="Edit Assignment"
                                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                                    >
                                      Edit
                                    </button>

                                    <button
                                      onClick={() => {
                                        setSelectedTimetableForSub(entry);
                                        setSubstituteFacultyId(facultyList.find((f) => f.id !== entry.facultyId)?.id || '');
                                        setIsSubstituteModalOpen(true);
                                      }}
                                      title="Assign Substitute"
                                      className="text-[10px] text-amber-600 hover:text-amber-700 font-semibold"
                                    >
                                      Sub
                                    </button>

                                    <button
                                      onClick={() => handleClearPeriodAssignment(entry.id)}
                                      title="Clear Period Assignment"
                                      className="text-[10px] text-red-500 hover:text-red-700 font-semibold"
                                    >
                                      Clear
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : entry ? (
                              <button
                                onClick={() => actualSlot && openAddEntryModal(day, actualSlot, entry)}
                                className="w-full h-full border border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 rounded-lg flex flex-col items-center justify-center text-emerald-700 dark:text-emerald-300 transition p-2"
                              >
                                <Plus className="w-4 h-4 mb-1" />
                                <span className="text-[10px] font-bold">Period {refSlot.periodNumber}</span>
                                <span className="text-[9px] text-emerald-600 dark:text-emerald-400">Click to Assign</span>
                              </button>
                            ) : canManage && actualSlot ? (
                              <button
                                onClick={() => openAddEntryModal(day, actualSlot, null)}
                                className="w-full h-full border border-dashed border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-indigo-600 transition p-2"
                              >
                                <Plus className="w-4 h-4 mb-1" />
                                <span className="text-[10px] font-medium">Add Lecture</span>
                              </button>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                                —
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Extra Classes Table View */}
      {viewMode === 'EXTRA_CLASSES' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Special / Remedial Classes Schedule
            </h3>
            <button
              onClick={() => setIsExtraModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Schedule Special Session
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Date & Time</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Class & Section</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Subject</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Faculty</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Room</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Reason / Topic</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {extraClasses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No extra or remedial classes scheduled.
                    </td>
                  </tr>
                ) : (
                  extraClasses.map((ec) => (
                    <tr key={ec.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {ec.date}
                        <div className="text-xs text-gray-500 font-normal">
                          {ec.startTime} - {ec.endTime}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {ec.class?.name} ({ec.section?.name})
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-indigo-600 dark:text-indigo-400">
                        {ec.subject?.name} ({ec.subject?.code})
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {ec.faculty?.user?.firstName} {ec.faculty?.user?.lastName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {ec.room?.roomNumber} ({ec.room?.name})
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-xs text-gray-600 dark:text-gray-300">
                        {ec.reason}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            ec.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                              : ec.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                          }`}
                        >
                          {ec.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                        {canManage && ec.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleReviewExtraClass(ec.id, 'APPROVED')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReviewExtraClass(ec.id, 'REJECTED')}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Add Timetable Entry with Live 5-Way Conflict Prevention */}
      {isEntryModalOpen && selectedSlotForAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Schedule Lecture: {selectedSlotForAdd.day} ({selectedSlotForAdd.slot.name})
              </h3>
              <button
                onClick={() => setIsEntryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            {conflictError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{conflictError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTimetableEntry} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Class / Grade
                  </label>
                  <select
                    value={entryClassId}
                    onChange={(e) => setEntryClassId(e.target.value)}
                    required
                    className="w-full border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Section
                  </label>
                  <select
                    value={entrySectionId}
                    onChange={(e) => setEntrySectionId(e.target.value)}
                    required
                    className="w-full border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
                  >
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject / Course
                </label>
                <select
                  value={entrySubjectId}
                  onChange={(e) => setEntrySubjectId(e.target.value)}
                  required
                  className="w-full border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code} - {sub.name} ({sub.type}, {sub.credits} Credits)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assigned Faculty
                </label>
                <select
                  value={entryFacultyId}
                  onChange={(e) => setEntryFacultyId(e.target.value)}
                  required
                  className="w-full border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
                >
                  {facultyList.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} {fac.dept ? `(${fac.dept})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Classroom / Lab Facility
                </label>
                <select
                  value={entryRoomId}
                  onChange={(e) => setEntryRoomId(e.target.value)}
                  required
                  className="w-full border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.roomNumber} - {r.name} ({r.type}, Cap: {r.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-lg text-xs text-indigo-700 dark:text-indigo-300">
                <Shield className="w-3.5 h-3.5 inline mr-1 text-indigo-600" />
                Backend will automatically verify that this faculty, room, and section are not double-booked.
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={conflictChecking}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                >
                  {conflictChecking ? 'Verifying & Saving...' : 'Save & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Request Extra Class */}
      {isExtraModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Request Special / Remedial Session
              </h3>
              <button onClick={() => setIsExtraModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestExtraClass} className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={extraDate}
                    onChange={(e) => setExtraDate(e.target.value)}
                    required
                    className="w-full border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                  <input
                    type="text"
                    placeholder="16:00"
                    value={extraStartTime}
                    onChange={(e) => setExtraStartTime(e.target.value)}
                    required
                    className="w-full border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                  <input
                    type="text"
                    placeholder="17:30"
                    value={extraEndTime}
                    onChange={(e) => setExtraEndTime(e.target.value)}
                    required
                    className="w-full border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                <select
                  value={extraSubjectId}
                  onChange={(e) => setExtraSubjectId(e.target.value)}
                  required
                  className="w-full border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code} - {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Faculty</label>
                <select
                  value={extraFacultyId}
                  onChange={(e) => setExtraFacultyId(e.target.value)}
                  required
                  className="w-full border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
                >
                  {facultyList.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Room</label>
                <select
                  value={extraRoomId}
                  onChange={(e) => setExtraRoomId(e.target.value)}
                  required
                  className="w-full border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.roomNumber} - {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason / Remedial Objective
                </label>
                <textarea
                  value={extraReason}
                  onChange={(e) => setExtraReason(e.target.value)}
                  rows={2}
                  required
                  placeholder="e.g. Remedial tutoring for upcoming term exams..."
                  className="w-full border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsExtraModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Assign Substitute Faculty */}
      {isSubstituteModalOpen && selectedTimetableForSub && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Assign Substitute Faculty
              </h3>
              <button onClick={() => setIsSubstituteModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="text-xs p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-1">
              <div>
                <strong>Subject:</strong> {selectedTimetableForSub.subject.name}
              </div>
              <div>
                <strong>Original Faculty:</strong> {selectedTimetableForSub.faculty?.user?.firstName}{' '}
                {selectedTimetableForSub.faculty?.user?.lastName}
              </div>
              <div>
                <strong>Period:</strong> {selectedTimetableForSub.timeSlot?.name} (
                {selectedTimetableForSub.timeSlot?.startTime} - {selectedTimetableForSub.timeSlot?.endTime})
              </div>
            </div>

            <form onSubmit={handleAssignSubstitute} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  value={substituteDate}
                  onChange={(e) => setSubstituteDate(e.target.value)}
                  required
                  className="w-full border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Substitute Faculty
                </label>
                <select
                  value={substituteFacultyId}
                  onChange={(e) => setSubstituteFacultyId(e.target.value)}
                  required
                  className="w-full border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
                >
                  {facultyList
                    .filter((f) => f.id !== selectedTimetableForSub.facultyId)
                    .map((fac) => (
                      <option key={fac.id} value={fac.id}>
                        {fac.name} {fac.dept ? `(${fac.dept})` : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason for Substitution
                </label>
                <textarea
                  value={substituteReason}
                  onChange={(e) => setSubstituteReason(e.target.value)}
                  rows={2}
                  required
                  placeholder="e.g. Primary faculty on approved medical leave..."
                  className="w-full border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSubstituteModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Add Custom Time Slot */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Add Custom Time Slot
              </h3>
              <button
                onClick={() => setIsSlotModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomSlot} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Days Applicable
                </label>
                <select
                  value={slotDay}
                  onChange={(e) => setSlotDay(e.target.value)}
                  className="w-full border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
                >
                  <option value="ALL">All Working Days (Mon - Sat)</option>
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d} Only
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slot Label / Name
                </label>
                <input
                  type="text"
                  value={slotName}
                  onChange={(e) => setSlotName(e.target.value)}
                  placeholder="e.g. Period 1, Morning Assembly, Lunch Break"
                  required
                  className="w-full border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={slotStartTime}
                    onChange={(e) => setSlotStartTime(e.target.value)}
                    required
                    className="w-full border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={slotEndTime}
                    onChange={(e) => setSlotEndTime(e.target.value)}
                    required
                    className="w-full border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white p-2 border"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="slotIsBreak"
                  checked={slotIsBreak}
                  onChange={(e) => setSlotIsBreak(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="slotIsBreak" className="text-xs text-gray-700 dark:text-gray-300">
                  This slot is a Break / Interval / Recess (No lectures scheduled)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
                >
                  Create Time Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
