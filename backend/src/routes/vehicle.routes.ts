import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { VehicleController } from '../controllers/vehicle.controller';
import { UserRoleEnum } from '../types';

export const vehicleRouter = Router();

vehicleRouter.use(requireAuth);

vehicleRouter.get(
  '/',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.NON_FACULTY, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  (req, res, next) => VehicleController.getVehicles(req, res).catch(next)
);

vehicleRouter.get(
  '/reports',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.NON_FACULTY]),
  (req, res, next) => VehicleController.getFleetReports(req, res).catch(next)
);

vehicleRouter.get(
  '/:id',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.NON_FACULTY]),
  (req, res, next) => VehicleController.getVehicleById(req, res).catch(next)
);

vehicleRouter.post(
  '/',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => VehicleController.createVehicle(req, res).catch(next)
);

vehicleRouter.put(
  '/:id',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => VehicleController.updateVehicle(req, res).catch(next)
);

vehicleRouter.post(
  '/:id/assignments',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => VehicleController.assignVehicleToDriver(req, res).catch(next)
);

vehicleRouter.post(
  '/km-logs',
  requireRoles([UserRoleEnum.NON_FACULTY, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => VehicleController.recordKmLog(req, res).catch(next)
);

vehicleRouter.post(
  '/fuel',
  requireRoles([UserRoleEnum.NON_FACULTY, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => VehicleController.recordFuel(req, res).catch(next)
);

vehicleRouter.post(
  '/maintenance',
  requireRoles([UserRoleEnum.NON_FACULTY, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => VehicleController.createMaintenanceRecord(req, res).catch(next)
);

vehicleRouter.patch(
  '/maintenance/:id',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.NON_FACULTY]),
  (req, res, next) => VehicleController.updateMaintenanceStatus(req, res).catch(next)
);

export default vehicleRouter;
