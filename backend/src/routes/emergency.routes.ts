import { Router } from 'express';
import { EmergencyController } from '../controllers/emergency.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { UserRoleEnum } from '../types';

export const emergencyRouter = Router();

emergencyRouter.use(requireAuth);

// Read alerts & campus status (All authenticated users)
emergencyRouter.get('/alerts', EmergencyController.getAlerts);
emergencyRouter.get('/campus-status', EmergencyController.getCampusStatus);

// Create / Cancel alerts & Change campus status (Super Admin / Office Admin / Security)
emergencyRouter.post(
  '/alerts',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.NON_FACULTY]),
  EmergencyController.createAlert
);

emergencyRouter.post(
  '/alerts/:id/cancel',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  EmergencyController.cancelAlert
);

emergencyRouter.post(
  '/campus-status',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.NON_FACULTY]),
  EmergencyController.updateCampusStatus
);

export default emergencyRouter;
