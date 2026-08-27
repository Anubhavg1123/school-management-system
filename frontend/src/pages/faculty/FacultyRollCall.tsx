import React, { useState, useEffect } from 'react';
import { studentAttendanceApi } from '../../api/studentAttendance';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { AttendanceSlot, StudentAttendanceRosterItem } from '../../types';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Award,
  Lock,
  RefreshCw,
  Search,
  UserCheck,
  Send,
  ShieldCheck,
} from 'lucide-react';

export const FacultyRollCall: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<AttendanceSlot[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [slotDetails, setSlotDetails] = useState<{
    slot: AttendanceSlot;
    totalStudents: number;
    isFinalized: boolean;
    isSubmitted: boolean;
    roster: StudentAttendanceRosterItem[];
  } | null>(null);

  const [rosterState, setRosterState] = useState<StudentAttendanceRosterItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // School Activity Bypass Modal State (Class Coordinator & Higher Authority)
  const [bypassModalOpen, setBypassModalOpen] = useState<boolean>(false);
  const [selectedStudentForBypass, setSelectedStudentForBypass] = useState<StudentAttendanceRosterItem | null>(null);
  const [bypassActivityType, setBypassActivityType] = useState<string>('SPORTS');
  const [bypassReason, setBypassReason] = useState<string>('');
  const [bypassSubmitting, setBypassSubmitting] = useState<boolean>(false);
  const [bypassError, setBypassError] = useState<string | null>(null);

  // Correction Modal State
  const [correctionModalOpen, setCorrectionModalOpen] = useState<boolean>(false);
  const [selectedStudentForCorrection, setSelectedStudentForCorrection] = useState<StudentAttendanceRosterItem | null>(null);
  const [proposedStatus, setProposedStatus] = useState<string>('PRESENT');
  const [correctionReason, setCorrectionReason] = useState<string>('');

  // Fetch slots for selected date
  const loadSlots = async (date: string) => {
    try {
      setLoadingSlots(true);
      const res = await studentAttendanceApi.getSlots({ date });
      if (res.success && res.data) {
        setSlots(res.data);
        if (res.data.length > 0 && !activeSlotId) {
          setActiveSlotId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load attendance slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Generate slots for selected date
  const handleGenerateSlots = async () => {
    try {
      setLoadingSlots(true);
      const res = await studentAttendanceApi.generateSlots(selectedDate);
      if (res.success) {
        await loadSlots(selectedDate);
      }
    } catch (err) {
      console.error('Failed to generate slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Load slot roster details
  const loadSlotDetails = async (slotId: string) => {
    try {
      setLoadingDetails(true);
      const res = await studentAttendanceApi.getSlotDetails(slotId);
      if (res.success && res.data) {
        setSlotDetails(res.data);
        setRosterState(res.data.roster);
      }
    } catch (err) {
      console.error('Failed to load slot details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadSlots(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (activeSlotId) {
      loadSlotDetails(activeSlotId);
    }
  }, [activeSlotId]);

  // Update status for a student in local roster state (PRESENT or ABSENT only)
  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT') => {
    if (slotDetails?.isFinalized) return;
    setRosterState((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  // Update remarks for a student in local roster state
  const handleRemarkChange = (studentId: string, remarks: string) => {
    if (slotDetails?.isFinalized) return;
    setRosterState((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, remarks } : s))
    );
  };

  // Quick mark all as PRESENT
  const handleMarkAllPresent = () => {
    if (slotDetails?.isFinalized) return;
    setRosterState((prev) =>
      prev.map((s) => (s.hasBypass ? s : { ...s, status: 'PRESENT' }))
    );
  };

  // Submit/Finalize roll call (Only PRESENT/ABSENT)
  const handleSubmitAttendance = async (isFinalize: boolean) => {
    if (!activeSlotId) return;
    try {
      setSubmitting(true);
      const studentRecords = rosterState.map((s) => ({
        studentId: s.studentId,
        status: s.status === 'ABSENT' ? 'ABSENT' : 'PRESENT',
        remarks: s.remarks || undefined,
      }));

      const res = await studentAttendanceApi.submitAttendance({
        slotId: activeSlotId,
        studentRecords,
        isFinalize,
      });

      if (res.success) {
        await loadSlotDetails(activeSlotId);
        await loadSlots(selectedDate);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to submit attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open School Activity Bypass Modal
  const handleOpenBypassModal = (student: StudentAttendanceRosterItem) => {
    setSelectedStudentForBypass(student);
    setBypassActivityType('SPORTS');
    setBypassReason('');
    setBypassError(null);
    setBypassModalOpen(true);
  };

  // Submit School Activity Bypass
  const handleApplyBypass = async () => {
    if (!selectedStudentForBypass || !activeSlotId) return;
    if (!bypassReason.trim() || bypassReason.trim().length < 5) {
      setBypassError('Mandatory institutional explanation (minimum 5 characters) is required.');
      return;
    }

    try {
      setBypassSubmitting(true);
      setBypassError(null);

      const res = await studentAttendanceApi.applyBypass({
        studentId: selectedStudentForBypass.studentId,
        attendanceSlotId: activeSlotId,
        date: selectedDate,
        activityType: bypassActivityType,
        reason: bypassReason.trim(),
      });

      if (res.success) {
        setBypassModalOpen(false);
        await loadSlotDetails(activeSlotId);
      }
    } catch (err: any) {
      setBypassError(err.response?.data?.error?.message || 'Failed to apply school activity bypass.');
    } finally {
      setBypassSubmitting(false);
    }
  };

  // Request correction for a finalized record
  const handleOpenCorrection = (student: StudentAttendanceRosterItem) => {
    setSelectedStudentForCorrection(student);
    setProposedStatus(student.status === 'PRESENT' ? 'ABSENT' : 'PRESENT');
    setCorrectionReason('');
    setCorrectionModalOpen(true);
  };

  const handleSendCorrectionRequest = async () => {
    if (!selectedStudentForCorrection?.recordId || !correctionReason) return;
    try {
      setSubmitting(true);
      const res = await studentAttendanceApi.requestCorrection({
        studentAttendanceId: selectedStudentForCorrection.recordId,
        proposedStatus,
        reason: correctionReason,
      });
      if (res.success) {
        setCorrectionModalOpen(false);
        if (activeSlotId) loadSlotDetails(activeSlotId);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to submit correction request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter roster
  const filteredRoster = rosterState.filter(
    (s) =>
      s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Statistics counters
  const totalCount = rosterState.length;
  const presentCount = rosterState.filter((s) => s.status === 'PRESENT' && !s.hasBypass).length;
  const absentCount = rosterState.filter((s) => s.status === 'ABSENT').length;
  const bypassCount = rosterState.filter((s) => s.hasBypass || s.status === 'ACADEMIC_BYPASS').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-600" />
            <span>Real-Time Student Roll Call</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Conduct daily classroom attendance. Normal faculty can mark <strong>Present</strong> or <strong>Absent</strong>. Class Coordinators can apply authorized school activity bypasses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-44"
          />
          <Button onClick={handleGenerateSlots} variant="secondary" isLoading={loadingSlots}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Auto-Generate Slots
          </Button>
        </div>
      </div>

      {/* Slots Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Attendance Sessions ({selectedDate})
        </h2>
        {loadingSlots ? (
          <div className="py-4 text-center text-gray-400">Loading slots...</div>
        ) : slots.length === 0 ? (
          <div className="py-6 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            No attendance slots found for this date. Click "Auto-Generate Slots" to sync from the timetable.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {slots.map((slot) => {
              const isSelected = slot.id === activeSlotId;
              const isFinalized = slot.status === 'FINALIZED';

              return (
                <button
                  key={slot.id}
                  onClick={() => setActiveSlotId(slot.id)}
                  className={`p-3 text-left rounded-lg border transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm text-gray-900">{slot.subject.name}</span>
                    <Badge variant={isFinalized ? 'success' : slot.status === 'SUBMITTED' ? 'info' : 'warning'}>
                      {isFinalized ? 'FINALIZED' : slot.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <div>
                      {slot.class.name} — {slot.section.name}
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3 h-3" />
                      {slot.startTime} - {slot.endTime}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Roster Panel */}
      {activeSlotId && slotDetails && (
        <Card className="p-6 space-y-6">
          {/* Active Session Info & Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">
                  {slotDetails.slot.subject.name} ({slotDetails.slot.class.name} - {slotDetails.slot.section.name})
                </h2>
                {slotDetails.isFinalized ? (
                  <Badge variant="success">
                    FINALIZED & LOCKED
                  </Badge>
                ) : slotDetails.isSubmitted ? (
                  <Badge variant="info">SUBMITTED (DRAFT)</Badge>
                ) : (
                  <Badge variant="warning">OPEN</Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Faculty: {slotDetails.slot.faculty.user?.firstName} {slotDetails.slot.faculty.user?.lastName} | Time:{' '}
                {slotDetails.slot.startTime} - {slotDetails.slot.endTime}
              </p>
            </div>

            {/* Quick Actions */}
            {!slotDetails.isFinalized && (
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={handleMarkAllPresent} variant="secondary" size="sm">
                  <UserCheck className="w-4 h-4 mr-1" /> Mark All Present
                </Button>
                <Button onClick={() => handleSubmitAttendance(false)} variant="secondary" size="sm" isLoading={submitting}>
                  Save Draft
                </Button>
                <Button onClick={() => handleSubmitAttendance(true)} variant="primary" size="sm" isLoading={submitting}>
                  <Send className="w-4 h-4 mr-1" /> Finalize & Lock Session
                </Button>
              </div>
            )}
          </div>

          {/* Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <span className="text-xs text-gray-500 font-medium block">TOTAL STUDENTS</span>
              <span className="text-lg font-bold text-gray-900">{totalCount}</span>
            </div>
            <div className="text-center border-l border-gray-200">
              <span className="text-xs text-green-600 font-medium block">PRESENT</span>
              <span className="text-lg font-bold text-green-700">{presentCount}</span>
            </div>
            <div className="text-center border-l border-gray-200">
              <span className="text-xs text-red-600 font-medium block">ABSENT</span>
              <span className="text-lg font-bold text-red-700">{absentCount}</span>
            </div>
            <div className="text-center border-l border-gray-200">
              <span className="text-xs text-indigo-600 font-medium block">SCHOOL ACTIVITY BYPASS</span>
              <span className="text-lg font-bold text-indigo-700">{bypassCount}</span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by student name, roll number, or admission ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Roster Table */}
          {loadingDetails ? (
            <div className="py-12 text-center text-gray-400">Loading student roster...</div>
          ) : filteredRoster.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No students match your filter criteria.</div>
          ) : (
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="p-3">Roll #</th>
                    <th className="p-3">Admission ID</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3 text-center">Attendance (Present / Absent Only)</th>
                    <th className="p-3">Remarks / Notes</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRoster.map((student) => (
                    <tr key={student.studentId} className="hover:bg-gray-50/50">
                      <td className="p-3 font-mono text-gray-700">{student.rollNumber || '—'}</td>
                      <td className="p-3 font-mono text-xs text-gray-500">{student.admissionNumber}</td>
                      <td className="p-3 font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                        {student.hasBypass && (
                          <span className="ml-2 inline-flex items-center text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-normal border border-indigo-200">
                            <Award className="w-3 h-3 mr-1" /> {student.bypassActivity}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          {/* Present Button */}
                          <button
                            type="button"
                            disabled={slotDetails.isFinalized}
                            onClick={() => handleStatusChange(student.studentId, 'PRESENT')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                              student.status === 'PRESENT'
                                ? 'bg-green-600 text-white shadow-xs'
                                : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-200'
                            } ${slotDetails.isFinalized ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            Present
                          </button>

                          {/* Absent Button */}
                          <button
                            type="button"
                            disabled={slotDetails.isFinalized}
                            onClick={() => handleStatusChange(student.studentId, 'ABSENT')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                              student.status === 'ABSENT'
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700 border border-gray-200'
                            } ${slotDetails.isFinalized ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        <Input
                          type="text"
                          placeholder="Add note..."
                          value={student.remarks || ''}
                          disabled={slotDetails.isFinalized}
                          onChange={(e) => handleRemarkChange(student.studentId, e.target.value)}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!slotDetails.isFinalized && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs text-indigo-600 hover:bg-indigo-50 border-indigo-200"
                              onClick={() => handleOpenBypassModal(student)}
                            >
                              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                              School Activity Bypass
                            </Button>
                          )}
                          {slotDetails.isFinalized && (
                            <Button variant="outline" size="sm" onClick={() => handleOpenCorrection(student)}>
                              Request Correction
                            </Button>
                          )}
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

      {/* School Activity / Academic Bypass Modal */}
      <Modal
        isOpen={bypassModalOpen}
        onClose={() => setBypassModalOpen(false)}
        title="Authorized School Activity / Academic Bypass"
      >
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-800">
            <strong>Class Coordinator Privilege:</strong> This action officially marks the student as present due to verified representation of the institution in an authorized educational, athletic, or cultural activity.
          </div>

          {bypassError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{bypassError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div>
              <span className="text-gray-500 block">Student:</span>
              <span className="font-semibold text-gray-900">
                {selectedStudentForBypass?.firstName} {selectedStudentForBypass?.lastName}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Admission ID:</span>
              <span className="font-mono text-gray-900">{selectedStudentForBypass?.admissionNumber}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Class & Section:</span>
              <span className="font-semibold text-gray-900">
                {slotDetails?.slot.class.name} — {slotDetails?.slot.section.name}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Session Date:</span>
              <span className="font-semibold text-gray-900">{selectedDate}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Authorized Activity Type <span className="text-red-500">*</span>
            </label>
            <select
              value={bypassActivityType}
              onChange={(e) => setBypassActivityType(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="SPORTS">Sports (Inter-School / District / State Athletics)</option>
              <option value="ACADEMIC_EVENT">Academic Event (Olympiad / Science Fair / Conference)</option>
              <option value="SCHOOL_EVENT">School Event (Annual Function / Youth Festival)</option>
              <option value="COMPETITION">Competition (Debate / Quiz / Hackathon)</option>
              <option value="OFFICIAL_SCHOOL_ACTIVITY">Official School Activity (NCC / NSS / Campus Duty)</option>
              <option value="OTHER_SCHOOL_APPROVED_ACTIVITY">Other School-Approved Activity</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Institutional Reason & Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Representing institution in District Inter-School Football Tournament quarter-finals..."
              value={bypassReason}
              onChange={(e) => setBypassReason(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-xs text-gray-400 mt-1 block">
              Personal or casual reasons are strictly disallowed and will be rejected.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setBypassModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleApplyBypass} isLoading={bypassSubmitting}>
              <CheckCircle className="w-4 h-4 mr-1" />
              Apply School Activity Attendance
            </Button>
          </div>
        </div>
      </Modal>

      {/* Correction Request Modal */}
      <Modal
        isOpen={correctionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        title={`Request Attendance Correction — ${selectedStudentForCorrection?.firstName} ${selectedStudentForCorrection?.lastName}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Original Status</label>
            <Input type="text" value={selectedStudentForCorrection?.status} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Status</label>
            <select
              value={proposedStatus}
              onChange={(e) => setProposedStatus(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
            >
              <option value="PRESENT">PRESENT</option>
              <option value="ABSENT">ABSENT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Justification Reason</label>
            <textarea
              rows={3}
              placeholder="Provide reason for post-finalization edit..."
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setCorrectionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSendCorrectionRequest} isLoading={submitting}>
              Submit Petition
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
