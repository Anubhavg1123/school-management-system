import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { MarksController } from '../controllers/marks.controller';
import { UserRoleEnum } from '../types';

export const marksRouter = Router();

marksRouter.use(requireAuth);

marksRouter.post(
  '/submit-batch',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  (req, res, next) => MarksController.submitMarks(req, res).catch(next)
);

marksRouter.post(
  '/verify/:subjectId',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  (req, res, next) => MarksController.verifyMarks(req, res).catch(next)
);

marksRouter.post(
  '/corrections/request',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  (req, res, next) => MarksController.requestCorrection(req, res).catch(next)
);

marksRouter.post(
  '/corrections/:id/review',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  (req, res, next) => MarksController.reviewCorrection(req, res).catch(next)
);

export default marksRouter;
