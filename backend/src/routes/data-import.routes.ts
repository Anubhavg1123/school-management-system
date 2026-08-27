import { Router } from 'express';
import { DataImportController } from '../controllers/data-import.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const router = Router();

// Only admins and principal can import data
const adminOnly = requireRoles(['SUPER_ADMIN', 'OFFICE_ADMIN', 'PRINCIPAL']);

router.use(requireAuth);

router.post('/students/preview', adminOnly, DataImportController.previewStudentImport);
router.post('/students/confirm', adminOnly, DataImportController.confirmStudentImport);
router.get('/logs', adminOnly, DataImportController.getImportLogs);

export default router;
