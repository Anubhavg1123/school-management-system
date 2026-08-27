import { Response } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { PrincipalService } from '../services/principal.service';

export class PrincipalController {
  static async getDashboardMetrics(req: AuthRequest, res: Response) {
    const metrics = await PrincipalService.getDashboardMetrics();
    return sendSuccess(res, metrics, 200);
  }

  static async getExecutiveSummary(req: AuthRequest, res: Response) {
    const summary = await PrincipalService.getExecutiveSummary();
    return sendSuccess(res, summary, 200);
  }

  static async getDepartmentOverview(req: AuthRequest, res: Response) {
    const departments = await PrincipalService.getDepartmentOverview();
    return sendSuccess(res, departments, 200);
  }

  static async searchGlobal(req: AuthRequest, res: Response) {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const results = await PrincipalService.searchGlobal(q);
    return sendSuccess(res, results, 200);
  }

  static async logOverride(req: AuthRequest, res: Response) {
    const { action, entityType, entityId, reason, beforeState, afterState } = req.body;
    const log = await PrincipalService.logOverride(req.user!.id, action, entityType, entityId, reason, beforeState, afterState);
    return sendSuccess(res, log, 201);
  }

  static async getSystemHealth(req: AuthRequest, res: Response) {
    const health = await PrincipalService.getSystemHealth();
    return sendSuccess(res, health, 200);
  }
}
