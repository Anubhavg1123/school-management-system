import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { ExamController } from '../controllers/exam.controller';
import { UserRoleEnum } from '../types';

export const examRouter = Router();

examRouter.use(requireAuth);

examRouter.post(
  '/',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  (req, res, next) => ExamController.createExam(req, res).catch(next)
);

examRouter.post(
  '/schedule-subject',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  (req, res, next) => ExamController.scheduleSubject(req, res).catch(next)
);

examRouter.post(
  '/:id/resolve-eligibility',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  (req, res, next) => ExamController.resolveEligibility(req, res).catch(next)
);

examRouter.post(
  '/attendance',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  (req, res, next) => ExamController.recordAttendance(req, res).catch(next)
);

examRouter.patch(
  '/:id/status',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  (req, res, next) => ExamController.updateStatus(req, res).catch(next)
);

export default examRouter;
