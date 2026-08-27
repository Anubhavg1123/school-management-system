import { Request, Response, NextFunction } from 'express';
import { operationsIntelligenceService } from '../services/operations-intelligence.service';
import { sendSuccess } from '../utils/response';

export class OperationsIntelligenceController {
  async getDailySummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await operationsIntelligenceService.getDailyOperationsSummary();
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await operationsIntelligenceService.generateOperationalRecommendations();
      return sendSuccess(res, { recommendations: result });
    } catch (err) {
      next(err);
    }
  }

  async updateRecommendationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await operationsIntelligenceService.updateRecommendationStatus(
        id,
        {
          status: req.body.status,
          reasonForDismissal: req.body.reasonForDismissal,
          reviewedByUserId: user?.id,
        }
      );
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getStudent360(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;
      const result = await operationsIntelligenceService.getStudent360Profile(studentId);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getStaff360(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const result = await operationsIntelligenceService.getStaff360Profile(userId);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async createIncident(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const result = await operationsIntelligenceService.createIncident({
        ...req.body,
        reportedByUserId: user?.id,
      });
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async getIncidents(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await operationsIntelligenceService.getIncidents();
      return sendSuccess(res, { incidents: result });
    } catch (err) {
      next(err);
    }
  }

  async updateIncident(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await operationsIntelligenceService.updateIncident(
        id,
        req.body
      );
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async createDataCorrection(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const result = await operationsIntelligenceService.createDataCorrectionRequest({
        ...req.body,
        requestedByUserId: user?.id,
      });
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async processDataCorrection(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await operationsIntelligenceService.processDataCorrectionRequest(
        id,
        {
          status: req.body.status,
          approvedByUserId: user?.id,
          rejectionReason: req.body.rejectionReason,
        }
      );
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getDataCorrections(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await operationsIntelligenceService.getDataCorrectionRequests();
      return sendSuccess(res, { requests: result });
    } catch (err) {
      next(err);
    }
  }
}

export const operationsIntelligenceController = new OperationsIntelligenceController();
