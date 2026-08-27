import { Request, Response, NextFunction } from 'express';
import { EmergencyService } from '../services/emergency.service';
import { sendSuccess } from '../utils/response';

export class EmergencyController {
  static async createAlert(req: Request, res: Response, next: NextFunction) {
    try {
      const createdById = (req as any).user.id;
      const { title, message, priority, targetAudience, channels } = req.body;
      const alert = await EmergencyService.createEmergencyAlert(createdById, {
        title,
        message,
        priority,
        targetAudience,
        channels,
      });
      return sendSuccess(res, alert, 201);
    } catch (err) {
      next(err);
    }
  }

  static async getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, priority } = req.query;
      const alerts = await EmergencyService.getEmergencyAlerts({
        status: status as string,
        priority: priority as string,
      });
      return sendSuccess(res, { alerts }, 200);
    } catch (err) {
      next(err);
    }
  }

  static async cancelAlert(req: Request, res: Response, next: NextFunction) {
    try {
      const cancelledById = (req as any).user.id;
      const alertId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { reason } = req.body;
      const alert = await EmergencyService.cancelEmergencyAlert(alertId, cancelledById, reason);
      return sendSuccess(res, alert, 200);
    } catch (err) {
      next(err);
    }
  }

  static async updateCampusStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const updatedById = (req as any).user.id;
      const { status, reason } = req.body;
      const log = await EmergencyService.updateCampusStatus(updatedById, status, reason);
      return sendSuccess(res, log, 200);
    } catch (err) {
      next(err);
    }
  }

  static async getCampusStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await EmergencyService.getCampusStatus();
      return sendSuccess(res, status, 200);
    } catch (err) {
      next(err);
    }
  }
}
