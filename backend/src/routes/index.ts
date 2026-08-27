import { Router } from 'express';
import authRoutes from './auth.routes';
import registrationRoutes from './registration.routes';
import userRoutes from './user.routes';
import academicRoutes from './academic.routes';
import attendanceRoutes from './attendance.routes';
import { studentAttendanceRouter } from './student-attendance.routes';
import { facultyPortalRouter } from './faculty-portal.routes';
import { hodPortalRouter } from './hod-portal.routes';
import leaveRoutes from './leave.routes';
import reportRoutes from './report.routes';
import feeRoutes from './fee.routes';
import auditRoutes from './audit.routes';
import settingsRoutes from './settings.routes';
import nonFacultyRoutes from './non-faculty.routes';
import vehicleRoutes from './vehicle.routes';
import visitorSecurityRoutes from './visitor-security.routes';
import notificationRoutes from './notification.routes';
import noticeRoutes from './notice.routes';
import communicationRoutes from './communication.routes';
import principalRoutes from './principal.routes';
import officeRoutes from './office.routes';
import approvalWorkflowRoutes from './approval-workflow.routes';
import permissionRoutes from './permission.routes';
import institutionSettingsRoutes from './institution-settings.routes';
import examRoutes from './exam.routes';
import marksRoutes from './marks.routes';
import resultEngineRoutes from './result-engine.routes';
import academicPerformanceRoutes from './academic-performance.routes';
import studentPortalRoutes from './student-portal.routes';
import guardianPortalRoutes from './guardian-portal.routes';
// Phase 15
import supportTicketRoutes from './support-ticket.routes';
import dataImportRoutes from './data-import.routes';
import adminRoutes from './admin.routes';
// Phase 16
import realtimeRoutes from './realtime.routes';
import emergencyRoutes from './emergency.routes';
import aiInsightsRoutes from './ai-insights.routes';
import studentCaseRoutes from './student-case.routes';
import smartCampusRoutes from './smart-campus.routes';
import diagnosticsRoutes from './diagnostics.routes';
import featureFlagRoutes from './feature-flag.routes';
// Phase 17
import institutionalWorkflowRoutes from './institutional-workflow.routes';
import calendarEventRoutes from './calendar-event.routes';
import parentMeetingRoutes from './parent-meeting.routes';
import lifecycleRoutes from './lifecycle.routes';
import assetInventoryRoutes from './asset-inventory.routes';
import grievancePolicyRoutes from './grievance-policy.routes';
import operationsIntelligenceRoutes from './operations-intelligence.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/registrations', registrationRoutes);
router.use('/users', userRoutes);
router.use('/academic', academicRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/student-attendance', studentAttendanceRouter);
router.use('/faculty', facultyPortalRouter);
router.use('/hod', hodPortalRouter);
router.use('/leave', leaveRoutes);
router.use('/reports', reportRoutes);
router.use('/fees', feeRoutes);
router.use('/audit', auditRoutes);
router.use('/settings', settingsRoutes);
router.use('/non-faculty', nonFacultyRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/visitor-security', visitorSecurityRoutes);
router.use('/notifications', notificationRoutes);
router.use('/notices', noticeRoutes);
router.use('/communication', communicationRoutes);
router.use('/principal', principalRoutes);
router.use('/office', officeRoutes);
router.use('/approvals', approvalWorkflowRoutes);
router.use('/permissions', permissionRoutes);
router.use('/institution', institutionSettingsRoutes);
router.use('/examinations', examRoutes);
router.use('/marks', marksRoutes);
router.use('/results', resultEngineRoutes);
router.use('/academic-performance', academicPerformanceRoutes);
router.use('/student', studentPortalRoutes);
router.use('/guardian', guardianPortalRoutes);
// Phase 15 routes
router.use('/support', supportTicketRoutes);
router.use('/import', dataImportRoutes);
router.use('/admin', adminRoutes);
// Phase 16 routes
router.use('/realtime', realtimeRoutes);
router.use('/emergency', emergencyRoutes);
router.use('/ai', aiInsightsRoutes);
router.use('/cases', studentCaseRoutes);
router.use('/campus', smartCampusRoutes);
router.use('/diagnostics', diagnosticsRoutes);
router.use('/features', featureFlagRoutes);
// Phase 17 routes
router.use('/workflows', institutionalWorkflowRoutes);
router.use('/calendar', calendarEventRoutes);
router.use('/ptm', parentMeetingRoutes);
router.use('/lifecycle', lifecycleRoutes);
router.use('/assets', assetInventoryRoutes);
router.use('/grievances', grievancePolicyRoutes);
router.use('/intelligence', operationsIntelligenceRoutes);

export default router;

