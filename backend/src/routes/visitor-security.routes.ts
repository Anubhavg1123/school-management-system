import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { VisitorSecurityController } from '../controllers/visitor-security.controller';
import { UserRoleEnum } from '../types';

export const visitorSecurityRouter = Router();

visitorSecurityRouter.use(requireAuth);

visitorSecurityRouter.post(
  '/visitors',
  requireRoles([UserRoleEnum.NON_FACULTY, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => VisitorSecurityController.createVisitorEntry(req, res).catch(next)
);

visitorSecurityRouter.post(
  '/visitors/:passNumberOrId/exit',
  requireRoles([UserRoleEnum.NON_FACULTY, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => VisitorSecurityController.markVisitorExit(req, res).catch(next)
);

visitorSecurityRouter.get(
  '/active-visitors',
  requireRoles([UserRoleEnum.NON_FACULTY, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => VisitorSecurityController.getActiveVisitors(req, res).catch(next)
);

visitorSecurityRouter.get(
  '/students/search',
  requireRoles([UserRoleEnum.NON_FACULTY, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => VisitorSecurityController.searchStudentForVisitor(req, res).catch(next)
);

visitorSecurityRouter.get(
  '/vehicles/verify/:vehicleNumber',
  requireRoles([UserRoleEnum.NON_FACULTY, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => VisitorSecurityController.verifyRegisteredVehicle(req, res).catch(next)
);

visitorSecurityRouter.post(
  '/campus-vehicles',
  requireRoles([UserRoleEnum.NON_FACULTY, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => VisitorSecurityController.recordCampusVehicleEntry(req, res).catch(next)
);

visitorSecurityRouter.post(
  '/campus-vehicles/:vehicleLogId/exit',
  requireRoles([UserRoleEnum.NON_FACULTY, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => VisitorSecurityController.recordCampusVehicleExit(req, res).catch(next)
);

visitorSecurityRouter.get(
  '/passes/:passTokenOrNumber',
  requireRoles([UserRoleEnum.NON_FACULTY, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  (req, res, next) => VisitorSecurityController.getVisitorPass(req, res).catch(next)
);

visitorSecurityRouter.get(
  '/visitors/history',
  requireRoles([UserRoleEnum.NON_FACULTY, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => VisitorSecurityController.searchVisitors(req, res).catch(next)
);

export default visitorSecurityRouter;
