import { Router } from 'express';
import { FeatureFlagController } from '../controllers/feature-flag.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { UserRoleEnum } from '../types';

export const featureFlagRouter = Router();

featureFlagRouter.use(requireAuth);

// All authenticated users can read active flags
featureFlagRouter.get('/', FeatureFlagController.getFlags);

// Only Super Admin can toggle flags and view config history
featureFlagRouter.patch('/:key', requireRoles([UserRoleEnum.SUPER_ADMIN]), FeatureFlagController.updateFlag);
featureFlagRouter.get('/config-history', requireRoles([UserRoleEnum.SUPER_ADMIN]), FeatureFlagController.getConfigHistory);

export default featureFlagRouter;
