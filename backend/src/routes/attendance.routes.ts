import { Router } from 'express';
import {
  AttendanceController,
  checkInSchema,
  checkOutSchema,
  correctionRequestSchema,
  reviewCorrectionSchema,
} from '../controllers/attendance.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { validateRequest } from '../middleware/validate';
import { UserRoleEnum } from '../types';

const router = Router();

router.use(requireAuth);

// Check-in and Check-out
router.post('/check-in', validateRequest({ body: checkInSchema }), AttendanceController.checkIn);
router.post('/check-out', validateRequest({ body: checkOutSchema }), AttendanceController.checkOut);

// Personal status & records
router.get('/today', AttendanceController.getTodayStatus);
router.get('/my-records', AttendanceController.getMyRecords);

// Administration & HOD Attendance overview
router.get(
  '/records',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  AttendanceController.listRecords
);

// Attendance corrections
router.post(
  '/corrections',
  validateRequest({ body: correctionRequestSchema }),
  AttendanceController.requestCorrection
);

router.post(
  '/corrections/:id/review',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  validateRequest({ body: reviewCorrectionSchema }),
  AttendanceController.reviewCorrection
);

export default router;
