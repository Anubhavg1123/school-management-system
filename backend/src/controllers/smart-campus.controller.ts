import { Request, Response, NextFunction } from 'express';
import { SmartCampusService } from '../services/smart-campus.service';
import { sendSuccess } from '../utils/response';

export class SmartCampusController {
  static async preRegisterVisitor(req: Request, res: Response, next: NextFunction) {
    try {
      const hostUserId = (req as any).user.id;
      const { visitorFullName, contactNumber, expectedDate, purpose } = req.body;
      const record = await SmartCampusService.preRegisterVisitor(hostUserId, {
        visitorFullName,
        contactNumber,
        expectedDate,
        purpose,
      });
      return sendSuccess(res, record, 201);
    } catch (err) {
      next(err);
    }
  }

  static async getPreRegisteredVisitors(req: Request, res: Response, next: NextFunction) {
    try {
      const { expectedDate, status, hostUserId } = req.query;
      const records = await SmartCampusService.getPreRegisteredVisitors({
        expectedDate: expectedDate as string,
        status: status as string,
        hostUserId: hostUserId as string,
      });
      return sendSuccess(res, { records }, 200);
    } catch (err) {
      next(err);
    }
  }

  static async checkInPreRegisteredVisitor(req: Request, res: Response, next: NextFunction) {
    try {
      const securityUserId = (req as any).user.id;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const entryExit = await SmartCampusService.checkInPreRegisteredVisitor(id, securityUserId);
      return sendSuccess(res, entryExit, 200);
    } catch (err) {
      next(err);
    }
  }

  static async getLiveOccupancy(req: Request, res: Response, next: NextFunction) {
    try {
      const occupancy = await SmartCampusService.getLiveCampusOccupancy();
      return sendSuccess(res, occupancy, 200);
    } catch (err) {
      next(err);
    }
  }

  static async getVehicleAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const alerts = await SmartCampusService.getVehicleDocumentAlerts();
      return sendSuccess(res, alerts, 200);
    } catch (err) {
      next(err);
    }
  }
}
