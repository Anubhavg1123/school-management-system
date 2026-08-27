import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { ResultEngineController } from '../controllers/result-engine.controller';
import { UserRoleEnum } from '../types';

export const resultEngineRouter = Router();

// Publicly accessible verification token endpoint (e.g. for official QR code verification)
resultEngineRouter.get(
  '/verify-token/:token',
  (req, res, next) => ResultEngineController.verifyToken(req, res).catch(next)
);

// Protected endpoints
resultEngineRouter.use(requireAuth);

resultEngineRouter.post(
  '/:examId/calculate',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  (req, res, next) => ResultEngineController.calculateResults(req, res).catch(next)
);

resultEngineRouter.post(
  '/:examId/publish',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => ResultEngineController.publishResults(req, res).catch(next)
);

resultEngineRouter.get(
  '/students/:studentId',
  (req, res, next) => ResultEngineController.getStudentResults(req, res).catch(next)
);

export default resultEngineRouter;
