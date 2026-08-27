import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { InstitutionSettingsController } from '../controllers/institution-settings.controller';
import { UserRoleEnum } from '../types';

export const institutionSettingsRouter = Router();

institutionSettingsRouter.use(requireAuth);

institutionSettingsRouter.get('/', (req, res, next) =>
  InstitutionSettingsController.getSettings(req, res).catch(next)
);

institutionSettingsRouter.put(
  '/',
  requireRoles([UserRoleEnum.SUPER_ADMIN]),
  (req, res, next) => InstitutionSettingsController.updateSettings(req, res).catch(next)
);

institutionSettingsRouter.post(
  '/promote-batch',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => InstitutionSettingsController.promoteStudentsBatch(req, res).catch(next)
);

export default institutionSettingsRouter;
