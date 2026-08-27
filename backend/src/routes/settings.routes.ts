import { Router } from 'express';
import { SettingsController, updateSettingSchema } from '../controllers/settings.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { validateRequest } from '../middleware/validate';
import { UserRoleEnum } from '../types';

const router = Router();

// Public settings can be read without authentication
router.get('/', SettingsController.listSettings);
router.get('/:key', SettingsController.getByKey);

// Updates are restricted to Super Admin
router.put(
  '/:key',
  requireAuth,
  requireRoles([UserRoleEnum.SUPER_ADMIN]),
  validateRequest({ body: updateSettingSchema }),
  SettingsController.updateSetting
);

export default router;
