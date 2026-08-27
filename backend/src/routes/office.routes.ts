import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { OfficeController } from '../controllers/office.controller';
import { UserRoleEnum } from '../types';

export const officeRouter = Router();

officeRouter.use(requireAuth);
officeRouter.use(requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]));

officeRouter.get('/dashboard', (req, res, next) => OfficeController.getOfficeDashboard(req, res).catch(next));
officeRouter.post('/students/master', (req, res, next) => OfficeController.createStudentMaster(req, res).catch(next));
officeRouter.patch('/students/:id/status', (req, res, next) => OfficeController.updateStudentStatus(req, res).catch(next));
officeRouter.post('/students/:id/documents', (req, res, next) => OfficeController.uploadDocument(req, res).catch(next));
officeRouter.post('/finance/payment', (req, res, next) => OfficeController.recordFeePayment(req, res).catch(next));

export default officeRouter;
