import { Request, Response, NextFunction } from 'express';
import { DiagnosticsService } from '../services/diagnostics.service';
import { sendSuccess } from '../utils/response';

export class DiagnosticsController {
  static async runSystemDiagnostics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DiagnosticsService.runSystemDiagnostics();
      return sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  static async runDataQualityAudit(req: Request, res: Response, next: NextFunction) {
    try {
      const audit = await DiagnosticsService.runDataQualityAudit();
      return sendSuccess(res, audit, 200);
    } catch (err) {
      next(err);
    }
  }

  static async recordWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const { provider, eventId, eventType, payload, idempotencyKey } = req.body;
      const result = await DiagnosticsService.recordWebhookLog({
        provider: provider || 'CUSTOM',
        eventId,
        eventType: eventType || 'GENERIC_EVENT',
        payload: payload || {},
        idempotencyKey,
      });

      return sendSuccess(res, result, result.isDuplicate ? 200 : 201);
    } catch (err) {
      next(err);
    }
  }

  static async getWebhookLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await DiagnosticsService.getWebhookLogs();
      return sendSuccess(res, { logs }, 200);
    } catch (err) {
      next(err);
    }
  }
}
