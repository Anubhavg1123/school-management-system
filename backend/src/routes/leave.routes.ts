import { Router } from 'express';
import { LeaveController, requestLeaveSchema, reviewLeaveSchema } from '../controllers/leave.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { validateRequest } from '../middleware/validate';
import { UserRoleEnum } from '../types';

const router = Router();

router.use(requireAuth);

// All staff can request leave & view their own history
router.post('/request', validateRequest({ body: requestLeaveSchema }), LeaveController.requestLeave);
router.get('/my-requests', LeaveController.getMyLeaves);

// HOD & Principal / Super Admin can view and review pending leave applications
router.get(
  '/pending',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.HOD]),
  LeaveController.getPendingLeaves
);

router.post(
  '/:id/review',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.HOD]),
  validateRequest({ body: reviewLeaveSchema }),
  LeaveController.reviewLeave
);

export default router;
