import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const router = Router();

const adminOnly = requireRoles(['SUPER_ADMIN', 'PRINCIPAL']);
const officeAdmin = requireRoles(['SUPER_ADMIN', 'PRINCIPAL', 'OFFICE_ADMIN']);

router.use(requireAuth);

// Go-live readiness check
router.get('/go-live-check', adminOnly, AdminController.getGoLiveCheck);

// Configuration check (no secrets exposed)
router.get('/config-check', adminOnly, AdminController.getConfigCheck);

// Reconciliation endpoints
router.get('/reconciliation/finance', officeAdmin, AdminController.getFinanceReconciliation);
router.get('/reconciliation/enrollment', officeAdmin, AdminController.getEnrollmentReconciliation);
router.get('/reconciliation/attendance', officeAdmin, AdminController.getAttendanceReconciliation);

export default router;
