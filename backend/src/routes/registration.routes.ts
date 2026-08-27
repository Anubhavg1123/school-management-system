import { Router } from 'express';
import {
  RegistrationController,
  approveRegistrationSchema,
  rejectRegistrationSchema,
  underReviewSchema,
} from '../controllers/registration.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { validateRequest } from '../middleware/validate';
import { UserRoleEnum } from '../types';

const router = Router();

// Only Super Admin (Principal) and Academic Office can view and process registrations
router.use(requireAuth);
router.use(requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]));

router.get('/pending', RegistrationController.getPending);
router.get('/recently-reviewed', RegistrationController.getRecentlyReviewed);
router.get('/:id', RegistrationController.getById);

router.patch(
  '/:id/under-review',
  validateRequest({ body: underReviewSchema }),
  RegistrationController.markUnderReview
);

router.post(
  '/:id/approve',
  validateRequest({ body: approveRegistrationSchema }),
  RegistrationController.approve
);

router.post(
  '/:id/reject',
  validateRequest({ body: rejectRegistrationSchema }),
  RegistrationController.reject
);

export default router;
