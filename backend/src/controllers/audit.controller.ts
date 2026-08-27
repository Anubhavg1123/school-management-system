import { Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export class AuditController {
  static async listLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;
      const userId = req.query.userId as string | undefined;
      const action = req.query.action as string | undefined;
      const entityType = req.query.entityType as string | undefined;
      const status = req.query.status as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const result = await AuditService.getLogs({
        page,
        limit,
        userId,
        action,
        entityType,
        status,
        startDate,
        endDate,
      });

      return sendSuccess(res, result.logs, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }
}
