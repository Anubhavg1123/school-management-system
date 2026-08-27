"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.facultyPortalRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const validate_1 = require("../middleware/validate");
const faculty_portal_controller_1 = require("../controllers/faculty-portal.controller");
const router = (0, express_1.Router)();
// Protect all faculty endpoints
router.use(auth_1.requireAuth);
router.use((0, rbac_1.requireRoles)(['FACULTY', 'HOD', 'SUPER_ADMIN']));
// 1. Dashboard & Profile
router.get('/dashboard', faculty_portal_controller_1.FacultyPortalController.getDashboard);
router.get('/profile', faculty_portal_controller_1.FacultyPortalController.getProfile);
router.put('/profile', (0, validate_1.validateRequest)({ body: faculty_portal_controller_1.updateProfileSchema }), faculty_portal_controller_1.FacultyPortalController.updateProfile);
// 2. Class & Student Management
router.get('/classes', faculty_portal_controller_1.FacultyPortalController.getAssignedClasses);
router.get('/classes/:sectionId/students', faculty_portal_controller_1.FacultyPortalController.getAssignedStudents);
router.get('/students/:studentId', faculty_portal_controller_1.FacultyPortalController.getStudentProfile);
// 3. Timetable
router.get('/timetable', faculty_portal_controller_1.FacultyPortalController.getTimetable);
// 4. Assignments
router.post('/assignments', (0, validate_1.validateRequest)({ body: faculty_portal_controller_1.createAssignmentSchema }), faculty_portal_controller_1.FacultyPortalController.createAssignment);
router.get('/assignments', faculty_portal_controller_1.FacultyPortalController.getAssignments);
router.post('/assignments/:id/publish', faculty_portal_controller_1.FacultyPortalController.publishAssignment);
// 5. Leave & Extra Classes
router.post('/leave', (0, validate_1.validateRequest)({ body: faculty_portal_controller_1.requestFacultyLeaveSchema }), faculty_portal_controller_1.FacultyPortalController.requestLeave);
router.get('/leave', faculty_portal_controller_1.FacultyPortalController.getLeaves);
router.post('/extra-classes', (0, validate_1.validateRequest)({ body: faculty_portal_controller_1.requestExtraClassSchema }), faculty_portal_controller_1.FacultyPortalController.requestExtraClass);
router.get('/extra-classes', faculty_portal_controller_1.FacultyPortalController.getExtraClasses);
// 6. Vehicles
router.post('/vehicles', (0, validate_1.validateRequest)({ body: faculty_portal_controller_1.registerVehicleSchema }), faculty_portal_controller_1.FacultyPortalController.registerVehicle);
router.get('/vehicles', faculty_portal_controller_1.FacultyPortalController.getVehicles);
router.post('/vehicles/:id/review', (0, rbac_1.requireRoles)(['SUPER_ADMIN', 'OFFICE_ADMIN']), (0, validate_1.validateRequest)({ body: faculty_portal_controller_1.reviewVehicleSchema }), faculty_portal_controller_1.FacultyPortalController.reviewVehicle);
// 7. Announcements & Notifications
router.post('/announcements', (0, validate_1.validateRequest)({ body: faculty_portal_controller_1.createAnnouncementSchema }), faculty_portal_controller_1.FacultyPortalController.createAnnouncement);
router.get('/announcements', faculty_portal_controller_1.FacultyPortalController.getAnnouncements);
router.get('/notifications', faculty_portal_controller_1.FacultyPortalController.getNotifications);
router.post('/notifications/:id/read', faculty_portal_controller_1.FacultyPortalController.markNotificationRead);
// 8. Workload Analytics
router.get('/workload', faculty_portal_controller_1.FacultyPortalController.getWorkload);
exports.facultyPortalRouter = router;
exports.default = router;
