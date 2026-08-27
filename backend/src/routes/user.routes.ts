import { Router } from 'express';
import {
  UserController,
  createUserSchema,
  updateUserSchema,
  updateStatusSchema,
  assignRolesSchema,
  assignOperationalRoleSchema,
  resetPasswordSchema,
} from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { validateRequest } from '../middleware/validate';
import { UserRoleEnum } from '../types';

const router = Router();

router.use(requireAuth);

// Roles and permissions metadata (accessible to all authenticated users)
router.get('/roles', UserController.listRoles);
router.get('/permissions', UserController.listPermissions);

// User directory (Principal, Office, HOD)
router.get(
  '/',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  UserController.listUsers
);

// Admin create user
router.post(
  '/',
  requireRoles([UserRoleEnum.SUPER_ADMIN]),
  validateRequest({ body: createUserSchema }),
  UserController.createUser
);

// Specific user profile
router.get('/:id', UserController.getUser);

// Update user profile (Self or Super Admin)
router.put('/:id', validateRequest({ body: updateUserSchema }), UserController.updateProfile);

// Super Admin actions
router.patch(
  '/:id/status',
  requireRoles([UserRoleEnum.SUPER_ADMIN]),
  validateRequest({ body: updateStatusSchema }),
  UserController.updateStatus
);

router.post(
  '/:id/assign-role',
  requireRoles([UserRoleEnum.SUPER_ADMIN]),
  validateRequest({ body: assignOperationalRoleSchema }),
  UserController.assignOperationalRole
);

router.post(
  '/:id/roles',
  requireRoles([UserRoleEnum.SUPER_ADMIN]),
  validateRequest({ body: assignRolesSchema }),
  UserController.assignRoles
);

router.post(
  '/:id/reset-password',
  requireRoles([UserRoleEnum.SUPER_ADMIN]),
  validateRequest({ body: resetPasswordSchema }),
  UserController.resetPassword
);

router.get(
  '/:id/audit',
  requireRoles([UserRoleEnum.SUPER_ADMIN]),
  UserController.getUserAuditTrail
);

export default router;
