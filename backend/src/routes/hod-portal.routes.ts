import { Router } from 'express';
import {
  HodPortalController,
  updateDepartmentProfileSchema,
  assignFacultySubjectSchema,
  assignClassCoordinatorSchema,
  reviewApprovalSchema,
  assignSubstituteSchema,
  createTimetableEntrySchema,
  whatsAppConfigSchema,
  createDepartmentNoticeSchema,
} from '../controllers/hod-portal.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { validateRequest } from '../middleware/validate';
import { UserRoleEnum } from '../types';

const router = Router();

// Protect all HOD routes with JWT Auth and HOD / SUPER_ADMIN roles
router.use(requireAuth);
router.use(requireRoles([UserRoleEnum.HOD, UserRoleEnum.SUPER_ADMIN]));

// 1. Dashboard & Department Profile
router.get('/dashboard', HodPortalController.getDashboard);
router.get('/department', HodPortalController.getDepartmentProfile);
router.put(
  '/department',
  validateRequest({ body: updateDepartmentProfileSchema }),
  HodPortalController.updateDepartmentProfile
);

// 2. Faculty Management & Workload
router.get('/faculty', HodPortalController.getFaculty);
router.get('/faculty/:id', HodPortalController.getFacultyProfile);
router.post(
  '/faculty-assignments',
  validateRequest({ body: assignFacultySubjectSchema }),
  HodPortalController.assignFacultySubject
);
router.get('/workload', HodPortalController.getFacultyWorkload);

// 3. Classes & Coordinators
router.get('/classes', HodPortalController.getClasses);
router.post(
  '/sections/:sectionId/coordinator',
  validateRequest({ body: assignClassCoordinatorSchema }),
  HodPortalController.assignClassCoordinator
);

// 4. Students & Low Attendance
router.get('/students', HodPortalController.getStudents);
router.get('/low-attendance', HodPortalController.getLowAttendance);

// 5. Attendance Corrections & Academic Bypasses
router.get('/corrections', HodPortalController.getCorrections);
router.post(
  '/corrections/:id/review',
  validateRequest({ body: reviewApprovalSchema }),
  HodPortalController.reviewCorrection
);
router.get('/bypasses', HodPortalController.getBypasses);
router.post(
  '/bypasses/:id/review',
  validateRequest({ body: reviewApprovalSchema }),
  HodPortalController.reviewBypass
);

// 6. Faculty Leave & Substitute Assignments
router.get('/leaves', HodPortalController.getLeaves);
router.post(
  '/leaves/:id/review',
  validateRequest({ body: reviewApprovalSchema }),
  HodPortalController.reviewFacultyLeave
);
router.post(
  '/substitutes',
  validateRequest({ body: assignSubstituteSchema }),
  HodPortalController.assignSubstitute
);

// 7. Extra Classes & Timetable Engine
router.get('/extra-classes', HodPortalController.getExtraClasses);
router.post(
  '/extra-classes/:id/review',
  validateRequest({ body: reviewApprovalSchema }),
  HodPortalController.reviewExtraClass
);
router.get('/timetable', HodPortalController.getTimetable);
router.post(
  '/timetable',
  validateRequest({ body: createTimetableEntrySchema }),
  HodPortalController.createTimetableEntry
);

// 8. WhatsApp Config & Department Notices
router.post(
  '/sections/:sectionId/whatsapp',
  validateRequest({ body: whatsAppConfigSchema }),
  HodPortalController.updateWhatsAppConfig
);
router.get('/notices', HodPortalController.getNotices);
router.post(
  '/notices',
  validateRequest({ body: createDepartmentNoticeSchema }),
  HodPortalController.createNotice
);

// 9. Department Reports
router.get('/reports', HodPortalController.getReport);

export const hodPortalRouter = router;
