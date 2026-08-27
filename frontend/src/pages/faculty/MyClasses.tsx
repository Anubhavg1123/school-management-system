import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  Search,
  AlertTriangle,
  CheckCircle,
  Eye,
  Phone,
  Mail,
  Shield,
  Loader2,
  X,
  UserCheck,
} from 'lucide-react';
import { facultyPortalApi, AssignedClass, AssignedStudent } from '../../api/facultyPortal';

export const MyClasses: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([]);
  const [coordinatorSections, setCoordinatorSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [students, setStudents] = useState<AssignedStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [studentsLoading, setStudentsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Student Details Modal State
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchAssignedClasses();
  }, []);

  const fetchAssignedClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await facultyPortalApi.getAssignedClasses();
      setAssignedClasses(res.subjectAssignments || []);
      setCoordinatorSections(res.coordinatorSections || []);

      const firstSectionId =
        res.subjectAssignments[0]?.sectionId || res.coordinatorSections[0]?.sectionId;
      if (firstSectionId) {
        setSelectedSectionId(firstSectionId);
        fetchStudents(firstSectionId);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load assigned classes.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (sectionId: string) => {
    try {
      setStudentsLoading(true);
      setError(null);
      const data = await facultyPortalApi.getAssignedStudents(sectionId);
      setStudents(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch student roster for section.');
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleSectionChange = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    fetchStudents(sectionId);
  };

  const handleViewStudentProfile = async (studentId: string) => {
    try {
      setModalLoading(true);
      const profile = await facultyPortalApi.getStudentProfile(studentId);
      setSelectedStudent(profile);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Unable to load student profile.');
    } finally {
      setModalLoading(false);
    }
  };

  const currentClassInfo =
    assignedClasses.find((c) => c.sectionId === selectedSectionId) ||
    coordinatorSections.find((c) => c.sectionId === selectedSectionId);

  const filteredStudents = students.filter(
    (std) =>
      std.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      std.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      std.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (std.rollNumber && std.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const lowAttendanceCount = students.filter((s) => s.isLowAttendance).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading assigned classes & student rosters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            My Classes & Enrolled Students
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            View authorized class rosters, section analytics, and student profiles for assigned courses.
          </p>
        </div>

        {/* Section Selector Dropdown */}
        <div className="w-full md:w-72">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Select Class Section
          </label>
          <select
            value={selectedSectionId}
            onChange={(e) => handleSectionChange(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {assignedClasses.map((ac) => (
              <option key={ac.id} value={ac.sectionId}>
                {ac.className} — {ac.sectionName} ({ac.subjectCode})
              </option>
            ))}
            {coordinatorSections.map((cs) => (
              <option key={cs.sectionId} value={cs.sectionId}>
                [Class Coordinator] {cs.className} — {cs.sectionName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Class Section Summary Metric Cards */}
      {currentClassInfo && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Subject & Code</p>
              <p className="text-lg font-bold text-gray-900">
                {'subjectName' in currentClassInfo ? currentClassInfo.subjectName : 'Class Roster'}
              </p>
              <p className="text-xs text-gray-500 font-mono">
                {'subjectCode' in currentClassInfo ? currentClassInfo.subjectCode : 'Coordinator Access'}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Enrolled Students</p>
              <p className="text-2xl font-extrabold text-gray-900">{students.length}</p>
              <p className="text-xs text-gray-500">Active Roster</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Low Attendance (&lt;75%)</p>
              <p className="text-2xl font-extrabold text-amber-600">{lowAttendanceCount}</p>
              <p className="text-xs text-amber-700">Requires Monitoring</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Role Access</p>
              <p className="text-sm font-bold text-gray-900">
                {currentClassInfo.isCoordinator ? 'Class Coordinator' : 'Subject Faculty'}
              </p>
              <p className="text-xs text-emerald-600 font-medium">RBAC Verified</p>
            </div>
          </div>
        </div>
      )}

      {/* Roster Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Search & Action Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, roll, or admission #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Showing <span className="font-bold text-gray-800">{filteredStudents.length}</span> of{' '}
            <span className="font-bold text-gray-800">{students.length}</span> students
          </p>
        </div>

        {/* Student Data Table */}
        {studentsLoading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
            Fetching student roster...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-700">No students found matching your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Roll #</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Admission #</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Attendance %</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((std) => (
                  <tr key={std.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-gray-900">
                      {std.rollNumber || 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {std.firstName} {std.lastName}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-600">{std.admissionNumber}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" /> {std.email}
                        </span>
                        {std.phone && (
                          <span className="flex items-center gap-1 text-gray-500 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-400" /> {std.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold text-sm ${
                            std.isLowAttendance ? 'text-red-600' : 'text-emerald-600'
                          }`}
                        >
                          {std.attendancePercentage}%
                        </span>
                        {std.isLowAttendance ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                            <AlertTriangle className="w-3 h-3" /> Shortage
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            <CheckCircle className="w-3 h-3" /> Adequate
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {std.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleViewStudentProfile(std.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-xs rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Restricted Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                Student Academic Profile
              </h2>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Full Name</p>
                <p className="font-bold text-gray-900 text-base">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Admission Number</p>
                <p className="font-mono font-semibold text-gray-800">{selectedStudent.admissionNumber}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Class & Section</p>
                <p className="font-medium text-gray-800">
                  {selectedStudent.className} — {selectedStudent.sectionName}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Department</p>
                <p className="font-medium text-gray-800">{selectedStudent.department}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Primary Contact</p>
                <p className="text-gray-800">{selectedStudent.phone || selectedStudent.email}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Primary Guardian</p>
                <p className="font-medium text-gray-900">
                  {selectedStudent.primaryGuardian
                    ? `${selectedStudent.primaryGuardian.fullName} (${selectedStudent.primaryGuardian.relationship}) - ${selectedStudent.primaryGuardian.phone}`
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Attendance Analytics Breakdown */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Real-Time Attendance Overview
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500">Total Sessions</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedStudent.attendanceStats?.totalSessions || 0}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500">Present Count</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {selectedStudent.attendanceStats?.presentSessions || 0}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500">Percentage</p>
                  <p
                    className={`text-lg font-extrabold ${
                      selectedStudent.attendanceStats?.isLowAttendance
                        ? 'text-red-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {selectedStudent.attendanceStats?.overallPercentage || 100}%
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyClasses;
