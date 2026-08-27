import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { UserRoleEnum } from '../types';

const router = Router();

router.use(requireAuth);
// Audit logs are restricted to Super Admin
router.use(requireRoles([UserRoleEnum.SUPER_ADMIN]));

router.get('/', AuditController.listLogs);

export default router;
