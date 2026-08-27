import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import {
  getGuardianDashboard,
  getLinkedWards,
  getWardResults,
  getWardFees,
  updatePreferences,
} from '../controllers/guardian-portal.controller';

const router = Router();

router.use(requireAuth);
router.use(requireRoles(['PARENT', 'SUPER_ADMIN']));

router.get('/dashboard', getGuardianDashboard);
router.get('/children', getLinkedWards);
router.get('/children/:studentId/results', getWardResults);
router.get('/children/:studentId/fees', getWardFees);
router.put('/preferences', updatePreferences);

export default router;
