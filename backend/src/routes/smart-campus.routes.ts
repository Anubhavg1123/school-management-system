import { Router } from 'express';
import { SmartCampusController } from '../controllers/smart-campus.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { UserRoleEnum } from '../types';

export const smartCampusRouter = Router();

smartCampusRouter.use(requireAuth);

// Live occupancy & vehicle document alerts
smartCampusRouter.get('/live-status', SmartCampusController.getLiveOccupancy);
smartCampusRouter.get('/vehicle-alerts', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.NON_FACULTY]), SmartCampusController.getVehicleAlerts);

// Pre-registration
smartCampusRouter.post('/pre-register-visitor', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY, UserRoleEnum.NON_FACULTY]), SmartCampusController.preRegisterVisitor);
smartCampusRouter.get('/pre-registered-visitors', SmartCampusController.getPreRegisteredVisitors);

// Security Fast-Track check-in
smartCampusRouter.post(
  '/pre-registered-visitors/:id/check-in',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.NON_FACULTY]),
  SmartCampusController.checkInPreRegisteredVisitor
);

export default smartCampusRouter;
