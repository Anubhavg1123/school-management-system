import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleGate } from './components/auth/RoleGate';
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Unauthorized } from './pages/Unauthorized';
import { NotFound } from './pages/NotFound';
import { Profile } from './pages/profile/Profile';

// Principal Pages
import { PrincipalDashboard } from './pages/principal/PrincipalDashboard';
import { RegistrationApprovals } from './pages/principal/RegistrationApprovals';
import { UserManagement } from './pages/principal/UserManagement';
import { DepartmentManagement } from './pages/principal/DepartmentManagement';
import { AuditLogs } from './pages/principal/AuditLogs';
import { SystemSettings } from './pages/principal/SystemSettings';
import { PrincipalAttendance } from './pages/principal/PrincipalAttendance';
import { PrincipalApprovalCenter } from './pages/principal/PrincipalApprovalCenter';
import { InstitutionSettingsPage } from './pages/principal/InstitutionSettingsPage';

// Office Pages
import { OfficeDashboard } from './pages/office/OfficeDashboard';
import { StudentAdmissions } from './pages/office/StudentAdmissions';
import { ReportsDashboard } from './pages/office/ReportsDashboard';
import { FeeManagement } from './pages/office/FeeManagement';

// Academic / Timetable Pages
import { TimetableManagement } from './pages/academic/TimetableManagement';

// HOD Pages
import { HodDashboard } from './pages/hod/HodDashboard';
import { DepartmentFaculty } from './pages/hod/DepartmentFaculty';
import { DepartmentStudents } from './pages/hod/DepartmentStudents';
import { DepartmentApprovals } from './pages/hod/DepartmentApprovals';
import { DepartmentTimetable } from './pages/hod/DepartmentTimetable';
import { DepartmentReports } from './pages/hod/DepartmentReports';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { FacultyRollCall } from './pages/faculty/FacultyRollCall';
import { MyClasses } from './pages/faculty/MyClasses';
import { AssignmentManagement } from './pages/faculty/AssignmentManagement';
import { FacultyServices } from './pages/faculty/FacultyServices';

// Phase 6 Attendance Pages
import { AttendanceCorrectionHub } from './pages/attendance/AttendanceCorrectionHub';
import { AttendanceAnalytics } from './pages/attendance/AttendanceAnalytics';

// Phase 9 Non-Faculty & Operational Hub Pages
import { NonFacultyDashboard } from './pages/non-faculty/NonFacultyDashboard';
import { DriverPortal } from './pages/non-faculty/DriverPortal';
import { AttenderPortal } from './pages/non-faculty/AttenderPortal';
import { SecurityPortal } from './pages/non-faculty/SecurityPortal';
import { FleetManagement } from './pages/non-faculty/FleetManagement';

// Phase 10 Communication & Notification Platform Pages
import { NotificationCenter } from './pages/communication/NotificationCenter';
import { NoticeBoard } from './pages/communication/NoticeBoard';
import { CommunicationDashboard } from './pages/communication/CommunicationDashboard';

// Phase 12 Examination & Results Pages
import { ExamManagement } from './pages/exam/ExamManagement';
import { FacultyMarksEntry } from './pages/exam/FacultyMarksEntry';
import { MarksVerificationHub } from './pages/exam/MarksVerificationHub';
import { ResultPublicationHub } from './pages/exam/ResultPublicationHub';
import { StudentResultView } from './pages/exam/StudentResultView';
import { AcademicPerformanceDashboard } from './pages/exam/AcademicPerformanceDashboard';

// Phase 13 Student & Guardian Portal Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentAttendanceView } from './pages/student/StudentAttendanceView';
import { StudentAssignmentsView } from './pages/student/StudentAssignmentsView';
import { StudentProfilePage } from './pages/student/StudentProfilePage';
import { GuardianDashboard } from './pages/guardian/GuardianDashboard';
import { GuardianPreferences } from './pages/guardian/GuardianPreferences';

// Phase 15 Institutional Integration & Operations Pages
import { GoLiveReadiness } from './pages/principal/GoLiveReadiness';
import { ReportCenter } from './pages/principal/ReportCenter';
import { ReconciliationDashboard } from './pages/principal/ReconciliationDashboard';
import { DataImportPage } from './pages/principal/DataImportPage';
import { SupportTicketPage } from './pages/staff/SupportTicketPage';
import { SupportManagement } from './pages/office/SupportManagement';

// Phase 16 Smart Operations Pages
import { SmartInsightsHub } from './pages/principal/SmartInsightsHub';
import { EmergencyBroadcastPage } from './pages/principal/EmergencyBroadcastPage';
import { StudentCaseManagement } from './pages/principal/StudentCaseManagement';
import { SmartCampusOperations } from './pages/principal/SmartCampusOperations';
import { SystemDiagnosticsPage } from './pages/principal/SystemDiagnosticsPage';
import { FeatureFlagsPage } from './pages/principal/FeatureFlagsPage';
import { DriverMobileView } from './pages/non-faculty/DriverMobileView';
import { SecurityMobileView } from './pages/non-faculty/SecurityMobileView';

// Phase 17 Institutional Intelligence & Operations Pages
import { InstitutionalCalendarPage } from './pages/principal/InstitutionalCalendarPage';
import { AdvancedWorkflowsPage } from './pages/principal/AdvancedWorkflowsPage';
import { StudentStaffLifecyclePage } from './pages/principal/StudentStaffLifecyclePage';
import { AssetInventoryPage } from './pages/principal/AssetInventoryPage';
import { CompliancePolicyCenter } from './pages/principal/CompliancePolicyCenter';
import { GrievanceManagementPage } from './pages/principal/GrievanceManagementPage';
import { OperationsIntelligenceHub } from './pages/principal/OperationsIntelligenceHub';
import { ParentMeetingBookingPage } from './pages/guardian/ParentMeetingBookingPage';
import { FacultyPtmManagement } from './pages/faculty/FacultyPtmManagement';

import { UserRoleEnum } from './types';

// Smart Role Redirector
const RoleRedirector: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.activeRole) {
    case UserRoleEnum.SUPER_ADMIN:
      return <Navigate to="/principal" replace />;
    case UserRoleEnum.OFFICE_ADMIN:
      return <Navigate to="/office" replace />;
    case UserRoleEnum.HOD:
      return <Navigate to="/hod" replace />;
    case UserRoleEnum.FACULTY:
      return <Navigate to="/faculty" replace />;
    case UserRoleEnum.NON_FACULTY:
      return <Navigate to="/staff" replace />;
    case 'STUDENT':
      return <Navigate to="/student/dashboard" replace />;
    case UserRoleEnum.PARENT:
      return <Navigate to="/guardian/dashboard" replace />;
    default:
      return <Navigate to="/principal" replace />;
  }
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Application Hub */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Smart Root Redirect */}
            <Route index element={<RoleRedirector />} />
            <Route path="profile" element={<Profile />} />

            {/* Timetable & Attendance Global Routes */}
            <Route
              path="academic/timetable"
              element={
                <RoleGate
                  allowedRoles={[
                    UserRoleEnum.SUPER_ADMIN,
                    UserRoleEnum.OFFICE_ADMIN,
                    UserRoleEnum.HOD,
                    UserRoleEnum.FACULTY,
                  ]}
                >
                  <TimetableManagement />
                </RoleGate>
              }
            />

            <Route
              path="faculty/roll-call"
              element={
                <RoleGate
                  allowedRoles={[
                    UserRoleEnum.SUPER_ADMIN,
                    UserRoleEnum.OFFICE_ADMIN,
                    UserRoleEnum.HOD,
                    UserRoleEnum.FACULTY,
                  ]}
                >
                  <FacultyRollCall />
                </RoleGate>
              }
            />

            <Route
              path="attendance/corrections"
              element={
                <RoleGate
                  allowedRoles={[
                    UserRoleEnum.SUPER_ADMIN,
                    UserRoleEnum.OFFICE_ADMIN,
                    UserRoleEnum.HOD,
                    UserRoleEnum.FACULTY,
                  ]}
                >
                  <AttendanceCorrectionHub />
                </RoleGate>
              }
            />

            <Route
              path="attendance/analytics"
              element={
                <RoleGate
                  allowedRoles={[
                    UserRoleEnum.SUPER_ADMIN,
                    UserRoleEnum.OFFICE_ADMIN,
                    UserRoleEnum.HOD,
                    UserRoleEnum.FACULTY,
                  ]}
                >
                  <AttendanceAnalytics />
                </RoleGate>
              }
            />

            {/* Principal / Super Admin Routes */}
            <Route
              path="principal"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN]}>
                  <PrincipalDashboard />
                </RoleGate>
              }
            />
            <Route
              path="principal/approvals"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN]}>
                  <PrincipalApprovalCenter />
                </RoleGate>
              }
            />
            <Route
              path="principal/institution-settings"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN]}>
                  <InstitutionSettingsPage />
                </RoleGate>
              }
            />
            <Route
              path="principal/users"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN]}>
                  <UserManagement />
                </RoleGate>
              }
            />
            <Route
              path="principal/fees"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN]}>
                  <FeeManagement />
                </RoleGate>
              }
            />
            <Route
              path="principal/departments"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN]}>
                  <DepartmentManagement />
                </RoleGate>
              }
            />
            <Route
              path="principal/timetable"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN]}>
                  <TimetableManagement />
                </RoleGate>
              }
            />
            <Route
              path="principal/attendance"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN]}>
                  <PrincipalAttendance />
                </RoleGate>
              }
            />
            <Route
              path="principal/reports"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN]}>
                  <ReportsDashboard />
                </RoleGate>
              }
            />
            <Route
              path="principal/audit"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN]}>
                  <AuditLogs />
                </RoleGate>
              }
            />
            <Route
              path="principal/settings"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN]}>
                  <SystemSettings />
                </RoleGate>
              }
            />

            {/* Academic Office Routes */}
            <Route
              path="office"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]}>
                  <OfficeDashboard />
                </RoleGate>
              }
            />
            <Route
              path="office/admissions"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]}>
                  <StudentAdmissions />
                </RoleGate>
              }
            />
            <Route
              path="office/fees"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]}>
                  <FeeManagement />
                </RoleGate>
              }
            />
            <Route
              path="office/academic"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]}>
                  <DepartmentManagement />
                </RoleGate>
              }
            />
            <Route
              path="office/timetable"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]}>
                  <TimetableManagement />
                </RoleGate>
              }
            />
            <Route
              path="office/students"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]}>
                  <StudentAdmissions />
                </RoleGate>
              }
            />
            <Route
              path="office/reports"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]}>
                  <ReportsDashboard />
                </RoleGate>
              }
            />
            <Route
              path="office/attendance"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]}>
                  <PrincipalAttendance />
                </RoleGate>
              }
            />

            {/* HOD Routes */}
            <Route
              path="hod"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.HOD]}>
                  <HodDashboard />
                </RoleGate>
              }
            />
            <Route
              path="hod/faculty"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.HOD]}>
                  <DepartmentFaculty />
                </RoleGate>
              }
            />
            <Route
              path="hod/students"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.HOD]}>
                  <DepartmentStudents />
                </RoleGate>
              }
            />
            <Route
              path="hod/approvals"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.HOD]}>
                  <DepartmentApprovals />
                </RoleGate>
              }
            />
            <Route
              path="hod/timetable"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.HOD]}>
                  <DepartmentTimetable />
                </RoleGate>
              }
            />
            <Route
              path="hod/reports"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.HOD]}>
                  <DepartmentReports />
                </RoleGate>
              }
            />
            <Route
              path="hod/attendance"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.HOD]}>
                  <PrincipalAttendance />
                </RoleGate>
              }
            />
            <Route
              path="hod/corrections"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.HOD]}>
                  <AttendanceCorrectionHub />
                </RoleGate>
              }
            />

            {/* Faculty Routes */}
            <Route
              path="faculty"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FACULTY]}>
                  <FacultyDashboard />
                </RoleGate>
              }
            />
            <Route
              path="faculty/my-classes"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FACULTY]}>
                  <MyClasses />
                </RoleGate>
              }
            />
            <Route
              path="faculty/assignments"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FACULTY]}>
                  <AssignmentManagement />
                </RoleGate>
              }
            />
            <Route
              path="faculty/services"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FACULTY]}>
                  <FacultyServices />
                </RoleGate>
              }
            />
            <Route
              path="faculty/timetable"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FACULTY]}>
                  <TimetableManagement />
                </RoleGate>
              }
            />
            <Route
              path="faculty/classes"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FACULTY]}>
                  <DepartmentManagement />
                </RoleGate>
              }
            />
            <Route
              path="faculty/my-attendance"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FACULTY]}>
                  <NonFacultyDashboard />
                </RoleGate>
              }
            />
            <Route
              path="faculty/corrections"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FACULTY]}>
                  <AttendanceCorrectionHub />
                </RoleGate>
              }
            />

            {/* Non-Faculty Staff & Operations Routes */}
            <Route
              path="staff"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.NON_FACULTY]}>
                  <NonFacultyDashboard />
                </RoleGate>
              }
            />
            <Route
              path="staff/attendance"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.NON_FACULTY]}>
                  <NonFacultyDashboard />
                </RoleGate>
              }
            />
            <Route
              path="non-faculty/driver"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.NON_FACULTY]}>
                  <DriverPortal />
                </RoleGate>
              }
            />
            <Route
              path="non-faculty/attender"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.NON_FACULTY]}>
                  <AttenderPortal />
                </RoleGate>
              }
            />
            <Route
              path="non-faculty/security"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.NON_FACULTY]}>
                  <SecurityPortal />
                </RoleGate>
              }
            />
            <Route
              path="non-faculty/fleet"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.NON_FACULTY]}>
                  <FleetManagement />
                </RoleGate>
              }
            />
            {/* Phase 10 Communication & Notification Platform Routes */}
            <Route path="communication/notices" element={<NoticeBoard />} />
            <Route path="communication/notifications" element={<NotificationCenter />} />
            <Route
              path="communication/platform"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]}>
                  <CommunicationDashboard />
                </RoleGate>
              }
            />

            {/* Phase 12 Examination & Results Routes */}
            <Route path="examinations" element={<ExamManagement />} />
            <Route path="examinations/marks-entry" element={<FacultyMarksEntry />} />
            <Route path="examinations/verification" element={<MarksVerificationHub />} />
            <Route path="examinations/results-hub" element={<ResultPublicationHub />} />
            <Route path="results" element={<StudentResultView />} />
            <Route path="academic-performance" element={<AcademicPerformanceDashboard />} />
            {/* Phase 13 Student & Guardian Portal Routes */}
            <Route path="student/dashboard" element={<StudentDashboard />} />
            <Route path="student/attendance" element={<StudentAttendanceView />} />
            <Route path="student/assignments" element={<StudentAssignmentsView />} />
            <Route path="student/profile" element={<StudentProfilePage />} />
            <Route path="guardian/dashboard" element={<GuardianDashboard />} />
            <Route path="guardian/preferences" element={<GuardianPreferences />} />

            {/* Phase 15 Institutional Integration, Operations & Helpdesk Routes */}
            <Route
              path="principal/go-live"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN]}>
                  <GoLiveReadiness />
                </RoleGate>
              }
            />
            <Route
              path="principal/report-center"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN]}>
                  <ReportCenter />
                </RoleGate>
              }
            />
            <Route
              path="principal/reconciliation"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN]}>
                  <ReconciliationDashboard />
                </RoleGate>
              }
            />
            <Route
              path="principal/data-import"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN]}>
                  <DataImportPage />
                </RoleGate>
              }
            />
            <Route
              path="office/support"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]}>
                  <SupportManagement />
                </RoleGate>
              }
            />
            <Route
              path="office/data-import"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]}>
                  <DataImportPage />
                </RoleGate>
              }
            />
            <Route
              path="reports"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]}>
                  <ReportCenter />
                </RoleGate>
              }
            />
            <Route path="support" element={<SupportTicketPage />} />

            {/* Phase 16 Smart Operations, Real-Time & Mobile Routes */}
            <Route
              path="principal/insights"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]}>
                  <SmartInsightsHub />
                </RoleGate>
              }
            />
            <Route
              path="principal/emergency"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.NON_FACULTY]}>
                  <EmergencyBroadcastPage />
                </RoleGate>
              }
            />
            <Route
              path="principal/cases"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]}>
                  <StudentCaseManagement />
                </RoleGate>
              }
            />
            <Route
              path="principal/smart-campus"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.NON_FACULTY]}>
                  <SmartCampusOperations />
                </RoleGate>
              }
            />
            <Route
              path="principal/diagnostics"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]}>
                  <SystemDiagnosticsPage />
                </RoleGate>
              }
            />
            <Route
              path="principal/feature-flags"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN]}>
                  <FeatureFlagsPage />
                </RoleGate>
              }
            />
            <Route
              path="staff/driver-view"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.NON_FACULTY]}>
                  <DriverMobileView />
                </RoleGate>
              }
            />
            <Route
              path="staff/security-view"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.NON_FACULTY]}>
                  <SecurityMobileView />
                </RoleGate>
              }
            />

            {/* Phase 17 Institutional Intelligence & Operations Routes */}
            <Route
              path="principal/calendar"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]}>
                  <InstitutionalCalendarPage />
                </RoleGate>
              }
            />
            <Route
              path="principal/workflows"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]}>
                  <AdvancedWorkflowsPage />
                </RoleGate>
              }
            />
            <Route
              path="principal/lifecycle"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]}>
                  <StudentStaffLifecyclePage />
                </RoleGate>
              }
            />
            <Route
              path="principal/assets"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]}>
                  <AssetInventoryPage />
                </RoleGate>
              }
            />
            <Route
              path="principal/compliance"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]}>
                  <CompliancePolicyCenter />
                </RoleGate>
              }
            />
            <Route
              path="principal/grievances"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]}>
                  <GrievanceManagementPage />
                </RoleGate>
              }
            />
            <Route
              path="principal/intelligence"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]}>
                  <OperationsIntelligenceHub />
                </RoleGate>
              }
            />
            <Route
              path="guardian/ptm"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.PARENT, UserRoleEnum.OFFICE_ADMIN]}>
                  <ParentMeetingBookingPage />
                </RoleGate>
              }
            />
            <Route
              path="faculty/ptm"
              element={
                <RoleGate allowedRoles={[UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FACULTY, UserRoleEnum.HOD]}>
                  <FacultyPtmManagement />
                </RoleGate>
              }
            />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
