import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { ApprovalWorkflowController } from '../controllers/approval-workflow.controller';
import { UserRoleEnum } from '../types';

export const approvalWorkflowRouter = Router();

approvalWorkflowRouter.use(requireAuth);

approvalWorkflowRouter.get('/pending', (req, res, next) =>
  ApprovalWorkflowController.getPendingApprovals(req, res).catch(next)
);

approvalWorkflowRouter.post('/request', (req, res, next) =>
  ApprovalWorkflowController.createRequest(req, res).catch(next)
);

approvalWorkflowRouter.post(
  '/:id/review',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  (req, res, next) => ApprovalWorkflowController.reviewRequest(req, res).catch(next)
);

export default approvalWorkflowRouter;
