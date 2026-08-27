import { Router } from 'express';
import { AiInsightsController } from '../controllers/ai-insights.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { UserRoleEnum } from '../types';

export const aiInsightsRouter = Router();

aiInsightsRouter.use(requireAuth);

// Safe natural language query processing (Super Admin, Office, HOD, Faculty)
aiInsightsRouter.post(
  '/query',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  AiInsightsController.query
);

// Explainable administrative insights
aiInsightsRouter.get(
  '/insights/administrative',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  AiInsightsController.getAdministrativeInsights
);

// AI Drafting assistant
aiInsightsRouter.post(
  '/draft-notice',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  AiInsightsController.draftNotice
);

export default aiInsightsRouter;
