import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { NonFacultyController } from '../controllers/non-faculty.controller';
import { UserRoleEnum } from '../types';

export const nonFacultyRouter = Router();

nonFacultyRouter.use(requireAuth);

nonFacultyRouter.get(
  '/dashboard',
  requireRoles([UserRoleEnum.NON_FACULTY, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => NonFacultyController.getDashboard(req, res).catch(next)
);

nonFacultyRouter.get(
  '/categories',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.NON_FACULTY]),
  (req, res, next) => NonFacultyController.getStaffCategories(req, res).catch(next)
);

nonFacultyRouter.post(
  '/categories',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => NonFacultyController.createStaffCategory(req, res).catch(next)
);

nonFacultyRouter.post(
  '/attender/attendance',
  requireRoles([UserRoleEnum.NON_FACULTY, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => NonFacultyController.attenderMarkAttendance(req, res).catch(next)
);

nonFacultyRouter.get(
  '/attender/dashboard',
  requireRoles([UserRoleEnum.NON_FACULTY, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => NonFacultyController.getAttenderDashboard(req, res).catch(next)
);

export default nonFacultyRouter;
