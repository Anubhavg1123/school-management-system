import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { validateRequest } from '../middleware/validate';
import {
  FacultyPortalController,
  updateProfileSchema,
  createAssignmentSchema,
  requestFacultyLeaveSchema,
  requestExtraClassSchema,
  registerVehicleSchema,
  reviewVehicleSchema,
  createAnnouncementSchema,
} from '../controllers/faculty-portal.controller';

const router = Router();

// Protect all faculty endpoints
router.use(requireAuth);
router.use(requireRoles(['FACULTY', 'HOD', 'SUPER_ADMIN']));

// 1. Dashboard & Profile
router.get('/dashboard', FacultyPortalController.getDashboard);
router.get('/profile', FacultyPortalController.getProfile);
router.put('/profile', validateRequest({ body: updateProfileSchema }), FacultyPortalController.updateProfile);

// 2. Class & Student Management
router.get('/classes', FacultyPortalController.getAssignedClasses);
router.get('/classes/:sectionId/students', FacultyPortalController.getAssignedStudents);
router.get('/students/:studentId', FacultyPortalController.getStudentProfile);

// 3. Timetable
router.get('/timetable', FacultyPortalController.getTimetable);

// 4. Assignments
router.post('/assignments', validateRequest({ body: createAssignmentSchema }), FacultyPortalController.createAssignment);
router.get('/assignments', FacultyPortalController.getAssignments);
router.post('/assignments/:id/publish', FacultyPortalController.publishAssignment);

// 5. Leave & Extra Classes
router.post('/leave', validateRequest({ body: requestFacultyLeaveSchema }), FacultyPortalController.requestLeave);
router.get('/leave', FacultyPortalController.getLeaves);
router.post('/extra-classes', validateRequest({ body: requestExtraClassSchema }), FacultyPortalController.requestExtraClass);
router.get('/extra-classes', FacultyPortalController.getExtraClasses);

// 6. Vehicles
router.post('/vehicles', validateRequest({ body: registerVehicleSchema }), FacultyPortalController.registerVehicle);
router.get('/vehicles', FacultyPortalController.getVehicles);
router.post(
  '/vehicles/:id/review',
  requireRoles(['SUPER_ADMIN', 'OFFICE_ADMIN']),
  validateRequest({ body: reviewVehicleSchema }),
  FacultyPortalController.reviewVehicle
);

// 7. Announcements & Notifications
router.post('/announcements', validateRequest({ body: createAnnouncementSchema }), FacultyPortalController.createAnnouncement);
router.get('/announcements', FacultyPortalController.getAnnouncements);
router.get('/notifications', FacultyPortalController.getNotifications);
router.post('/notifications/:id/read', FacultyPortalController.markNotificationRead);

// 8. Workload Analytics
router.get('/workload', FacultyPortalController.getWorkload);

export const facultyPortalRouter = router;
export default router;
