import { Router } from 'express';
import { parentMeetingController } from '../controllers/parent-meeting.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { UserRoleEnum } from '../types';

const router = Router();

router.use(requireAuth);

router.post('/slots', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]), (req, res, next) => parentMeetingController.createSlots(req, res, next));
router.get('/slots', (req, res, next) => parentMeetingController.getSlots(req, res, next));
router.post('/slots/:slotId/book', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.PARENT, UserRoleEnum.OFFICE_ADMIN]), (req, res, next) => parentMeetingController.bookSlot(req, res, next));
router.patch('/bookings/:bookingId/notes', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]), (req, res, next) => parentMeetingController.recordMeetingNotes(req, res, next));

export default router;
