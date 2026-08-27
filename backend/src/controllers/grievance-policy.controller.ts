import { Request, Response, NextFunction } from 'express';
import { grievancePolicyService } from '../services/grievance-policy.service';
import { sendSuccess } from '../utils/response';

export class GrievancePolicyController {
  // Grievances
  async submitGrievance(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const result = await grievancePolicyService.submitGrievance({
        ...req.body,
        submittedByUserId: user.id,
      });
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async getGrievances(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const result = await grievancePolicyService.getGrievances(
        user.id,
        user.activeRole
      );
      return sendSuccess(res, { grievances: result });
    } catch (err) {
      next(err);
    }
  }

  async updateGrievanceStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await grievancePolicyService.updateGrievanceStatus(
        id,
        req.body
      );
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // Feedback
  async submitFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const result = await grievancePolicyService.submitFeedback({
        ...req.body,
        submittedByUserId: user.id,
      });
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async getFeedbackMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await grievancePolicyService.getFeedbackMetrics(
        req.query.targetType as string
      );
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // Policies
  async publishPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const result = await grievancePolicyService.publishPolicy({
        ...req.body,
        createdByUserId: user.id,
      });
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async getPolicies(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await grievancePolicyService.getPolicies(
        req.query.category as string
      );
      return sendSuccess(res, { policies: result });
    } catch (err) {
      next(err);
    }
  }

  async acknowledgePolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const policyId = Array.isArray(req.params.policyId) ? req.params.policyId[0] : req.params.policyId;
      const result = await grievancePolicyService.acknowledgePolicy(
        policyId,
        user.id
      );
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // Compliance
  async createComplianceChecklist(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await grievancePolicyService.createComplianceChecklist(req.body);
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async getComplianceChecklist(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await grievancePolicyService.getComplianceChecklist();
      return sendSuccess(res, { checklist: result });
    } catch (err) {
      next(err);
    }
  }

  async verifyComplianceItem(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await grievancePolicyService.verifyComplianceItem(
        id,
        user.id
      );
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const grievancePolicyController = new GrievancePolicyController();
