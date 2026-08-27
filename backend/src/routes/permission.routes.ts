import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { PermissionController } from '../controllers/permission.controller';
import { UserRoleEnum } from '../types';

export const permissionRouter = Router();

permissionRouter.use(requireAuth);

permissionRouter.get('/my-permissions', (req, res, next) =>
  PermissionController.getUserPermissions(req, res).catch(next)
);

permissionRouter.post(
  '/assign-role',
  requireRoles([UserRoleEnum.SUPER_ADMIN]),
  (req, res, next) => PermissionController.assignUserRole(req, res).catch(next)
);

permissionRouter.post(
  '/users/:id/suspend',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => PermissionController.suspendUser(req, res).catch(next)
);

permissionRouter.post(
  '/users/:id/activate',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => PermissionController.activateUser(req, res).catch(next)
);

export default permissionRouter;
