import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { PrincipalController } from '../controllers/principal.controller';
import { UserRoleEnum } from '../types';

export const principalRouter = Router();

principalRouter.use(requireAuth);
principalRouter.use(requireRoles([UserRoleEnum.SUPER_ADMIN]));

principalRouter.get('/dashboard', (req, res, next) => PrincipalController.getDashboardMetrics(req, res).catch(next));
principalRouter.get('/executive-summary', (req, res, next) => PrincipalController.getExecutiveSummary(req, res).catch(next));
principalRouter.get('/departments-overview', (req, res, next) => PrincipalController.getDepartmentOverview(req, res).catch(next));
principalRouter.get('/global-search', (req, res, next) => PrincipalController.searchGlobal(req, res).catch(next));
principalRouter.post('/override-log', (req, res, next) => PrincipalController.logOverride(req, res).catch(next));
principalRouter.get('/system-health', (req, res, next) => PrincipalController.getSystemHealth(req, res).catch(next));

export default principalRouter;
