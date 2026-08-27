import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import {
  getStudentDashboard,
  getStudentTimetable,
  getStudentAttendance,
  createProfileUpdateRequest,
  createLeaveRequest,
} from '../controllers/student-portal.controller';

const router = Router();

router.use(requireAuth);
router.use(requireRoles(['STUDENT', 'SUPER_ADMIN']));

router.get('/dashboard', getStudentDashboard);
router.get('/timetable/:studentId', getStudentTimetable);
router.get('/attendance/:studentId', getStudentAttendance);
router.post('/profile-update-requests/:studentId', createProfileUpdateRequest);
router.post('/leave-requests/:studentId', createLeaveRequest);

export default router;
