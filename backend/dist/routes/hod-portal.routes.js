"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hodPortalRouter = void 0;
const express_1 = require("express");
const hod_portal_controller_1 = require("../controllers/hod-portal.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const validate_1 = require("../middleware/validate");
const types_1 = require("../types");
const router = (0, express_1.Router)();
// Protect all HOD routes with JWT Auth and HOD / SUPER_ADMIN roles
router.use(auth_1.requireAuth);
router.use((0, rbac_1.requireRoles)([types_1.UserRoleEnum.HOD, types_1.UserRoleEnum.SUPER_ADMIN]));
// 1. Dashboard & Department Profile
router.get('/dashboard', hod_portal_controller_1.HodPortalController.getDashboard);
router.get('/department', hod_portal_controller_1.HodPortalController.getDepartmentProfile);
router.put('/department', (0, validate_1.validateRequest)({ body: hod_portal_controller_1.updateDepartmentProfileSchema }), hod_portal_controller_1.HodPortalController.updateDepartmentProfile);
// 2. Faculty Management & Workload
router.get('/faculty', hod_portal_controller_1.HodPortalController.getFaculty);
router.get('/faculty/:id', hod_portal_controller_1.HodPortalController.getFacultyProfile);
router.post('/faculty-assignments', (0, validate_1.validateRequest)({ body: hod_portal_controller_1.assignFacultySubjectSchema }), hod_portal_controller_1.HodPortalController.assignFacultySubject);
router.get('/workload', hod_portal_controller_1.HodPortalController.getFacultyWorkload);
// 3. Classes & Coordinators
router.get('/classes', hod_portal_controller_1.HodPortalController.getClasses);
router.post('/sections/:sectionId/coordinator', (0, validate_1.validateRequest)({ body: hod_portal_controller_1.assignClassCoordinatorSchema }), hod_portal_controller_1.HodPortalController.assignClassCoordinator);
// 4. Students & Low Attendance
router.get('/students', hod_portal_controller_1.HodPortalController.getStudents);
router.get('/low-attendance', hod_portal_controller_1.HodPortalController.getLowAttendance);
// 5. Attendance Corrections & Academic Bypasses
router.get('/corrections', hod_portal_controller_1.HodPortalController.getCorrections);
router.post('/corrections/:id/review', (0, validate_1.validateRequest)({ body: hod_portal_controller_1.reviewApprovalSchema }), hod_portal_controller_1.HodPortalController.reviewCorrection);
router.get('/bypasses', hod_portal_controller_1.HodPortalController.getBypasses);
router.post('/bypasses/:id/review', (0, validate_1.validateRequest)({ body: hod_portal_controller_1.reviewApprovalSchema }), hod_portal_controller_1.HodPortalController.reviewBypass);
// 6. Faculty Leave & Substitute Assignments
router.get('/leaves', hod_portal_controller_1.HodPortalController.getLeaves);
router.post('/leaves/:id/review', (0, validate_1.validateRequest)({ body: hod_portal_controller_1.reviewApprovalSchema }), hod_portal_controller_1.HodPortalController.reviewFacultyLeave);
router.post('/substitutes', (0, validate_1.validateRequest)({ body: hod_portal_controller_1.assignSubstituteSchema }), hod_portal_controller_1.HodPortalController.assignSubstitute);
// 7. Extra Classes & Timetable Engine
router.get('/extra-classes', hod_portal_controller_1.HodPortalController.getExtraClasses);
router.post('/extra-classes/:id/review', (0, validate_1.validateRequest)({ body: hod_portal_controller_1.reviewApprovalSchema }), hod_portal_controller_1.HodPortalController.reviewExtraClass);
router.get('/timetable', hod_portal_controller_1.HodPortalController.getTimetable);
router.post('/timetable', (0, validate_1.validateRequest)({ body: hod_portal_controller_1.createTimetableEntrySchema }), hod_portal_controller_1.HodPortalController.createTimetableEntry);
// 8. WhatsApp Config & Department Notices
router.post('/sections/:sectionId/whatsapp', (0, validate_1.validateRequest)({ body: hod_portal_controller_1.whatsAppConfigSchema }), hod_portal_controller_1.HodPortalController.updateWhatsAppConfig);
router.get('/notices', hod_portal_controller_1.HodPortalController.getNotices);
router.post('/notices', (0, validate_1.validateRequest)({ body: hod_portal_controller_1.createDepartmentNoticeSchema }), hod_portal_controller_1.HodPortalController.createNotice);
// 9. Department Reports
router.get('/reports', hod_portal_controller_1.HodPortalController.getReport);
exports.hodPortalRouter = router;
