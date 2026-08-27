import { Router } from 'express';
import {
  StudentAttendanceController,
  generateSlotsSchema,
  createExtraClassSlotSchema,
  submitStudentAttendanceSchema,
  studentCorrectionSchema,
  reviewStudentCorrectionSchema,
  applySchoolActivityBypassSchema,
  academicBypassSchema,
  reviewAcademicBypassSchema,
} from '../controllers/student-attendance.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { validateRequest } from '../middleware/validate';
import { UserRoleEnum } from '../types';

export const studentAttendanceRouter = Router();

// 1. Slots generation & query
studentAttendanceRouter.post(
  '/generate-slots',
  requireAuth,
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  validateRequest({ body: generateSlotsSchema }),
  StudentAttendanceController.generateSlots
);

studentAttendanceRouter.post(
  '/extra-class-slot',
  requireAuth,
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  validateRequest({ body: createExtraClassSlotSchema }),
  StudentAttendanceController.createExtraClassSlot
);

studentAttendanceRouter.get(
  '/slots',
  requireAuth,
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  StudentAttendanceController.getSlots
);

studentAttendanceRouter.get(
  '/slots/:id',
  requireAuth,
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  StudentAttendanceController.getSlotDetails
);

// 2. Attendance submission
studentAttendanceRouter.post(
  '/submit',
  requireAuth,
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  validateRequest({ body: submitStudentAttendanceSchema }),
  StudentAttendanceController.submitAttendance
);

// 3. Student Attendance Corrections
studentAttendanceRouter.post(
  '/corrections',
  requireAuth,
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  validateRequest({ body: studentCorrectionSchema }),
  StudentAttendanceController.requestCorrection
);

studentAttendanceRouter.post(
  '/corrections/:id/review',
  requireAuth,
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  validateRequest({ body: reviewStudentCorrectionSchema }),
  StudentAttendanceController.reviewCorrection
);

// 4. School Activity / Academic Bypass (Class Coordinator or Higher Authority)
studentAttendanceRouter.post(
  '/bypass',
  requireAuth,
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  validateRequest({ body: applySchoolActivityBypassSchema }),
  StudentAttendanceController.applyBypass
);

studentAttendanceRouter.post(
  '/bypass/:id/review',
  requireAuth,
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  validateRequest({ body: reviewAcademicBypassSchema }),
  StudentAttendanceController.reviewBypass
);

// 5. Student History & Percentage
studentAttendanceRouter.get(
  '/student/:studentId',
  requireAuth,
  StudentAttendanceController.getStudentHistory
);

// 6. Daily User Attendance Summary
studentAttendanceRouter.get(
  '/daily-summary',
  requireAuth,
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  StudentAttendanceController.getDailyUserSummary
);

// 7. Attendance Anomalies
studentAttendanceRouter.get(
  '/anomalies',
  requireAuth,
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  StudentAttendanceController.getAnomalies
);
