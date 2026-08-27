import { Request, Response, NextFunction } from 'express';
import { institutionalWorkflowService } from '../services/institutional-workflow.service';
import { sendSuccess } from '../utils/response';

export class InstitutionalWorkflowController {
  async createDelegation(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const result = await institutionalWorkflowService.createDelegation({
        originalApproverUserId: user.id,
        delegateUserId: req.body.delegateUserId,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        reason: req.body.reason,
        scope: req.body.scope,
      });
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async getDelegations(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const isSuperAdmin = user?.activeRole === 'SUPER_ADMIN';
      const result = await institutionalWorkflowService.getDelegations(
        isSuperAdmin ? undefined : user?.id
      );
      return sendSuccess(res, { delegations: result });
    } catch (err) {
      next(err);
    }
  }

  async revokeDelegation(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const isSuperAdmin = user?.activeRole === 'SUPER_ADMIN';
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await institutionalWorkflowService.revokeDelegation(
        id,
        user.id,
        isSuperAdmin
      );
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async configureSla(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await institutionalWorkflowService.configureSla(req.body);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getSlaConfigs(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await institutionalWorkflowService.getSlaConfigs();
      return sendSuccess(res, { configs: result });
    } catch (err) {
      next(err);
    }
  }

  async evaluateSlaStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await institutionalWorkflowService.evaluatePendingSlaStatus();
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const institutionalWorkflowController = new InstitutionalWorkflowController();
