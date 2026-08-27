import { Router } from 'express';
import { calendarEventController } from '../controllers/calendar-event.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { UserRoleEnum } from '../types';

const router = Router();

router.use(requireAuth);

router.post('/', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]), (req, res, next) => calendarEventController.createEvent(req, res, next));
router.get('/', (req, res, next) => calendarEventController.getEvents(req, res, next));
router.get('/holiday-check', (req, res, next) => calendarEventController.checkHoliday(req, res, next));
router.post('/:eventId/register', (req, res, next) => calendarEventController.registerForEvent(req, res, next));
router.post('/registrations/:registrationId/attendance', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]), (req, res, next) => calendarEventController.recordAttendance(req, res, next));

export default router;
