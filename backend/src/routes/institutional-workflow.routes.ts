import { Router } from 'express';
import { institutionalWorkflowController } from '../controllers/institutional-workflow.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { UserRoleEnum } from '../types';

const router = Router();

router.use(requireAuth);

// Delegations
router.post('/delegations', (req, res, next) => institutionalWorkflowController.createDelegation(req, res, next));
router.get('/delegations', (req, res, next) => institutionalWorkflowController.getDelegations(req, res, next));
router.delete('/delegations/:id', (req, res, next) => institutionalWorkflowController.revokeDelegation(req, res, next));

// SLA
router.post('/sla', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]), (req, res, next) => institutionalWorkflowController.configureSla(req, res, next));
router.get('/sla', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]), (req, res, next) => institutionalWorkflowController.getSlaConfigs(req, res, next));
router.get('/sla/status', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]), (req, res, next) => institutionalWorkflowController.evaluateSlaStatus(req, res, next));

export default router;
