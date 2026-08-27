import { Request, Response, NextFunction } from 'express';
import { lifecycleService } from '../services/lifecycle.service';
import { sendSuccess } from '../utils/response';

export class LifecycleController {
  async updateStudentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;
      const result = await lifecycleService.updateStudentStatus(
        studentId,
        req.body.status,
        req.body.reason
      );
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async processStudentExit(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const studentId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;
      const result = await lifecycleService.processStudentExitChecklist({
        ...req.body,
        studentId,
        approvedByUserId: user?.id,
      });
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async createAlumni(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;
      const result = await lifecycleService.createAlumniProfile({
        ...req.body,
        studentId,
      });
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async getAlumni(req: Request, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? Number(req.query.year) : undefined;
      const result = await lifecycleService.getAlumniProfiles(year);
      return sendSuccess(res, { alumni: result });
    } catch (err) {
      next(err);
    }
  }

  async processStaffOnboarding(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const result = await lifecycleService.processStaffOnboarding({
        ...req.body,
        userId,
        verifiedByUserId: user?.id,
      });
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getStaffHandoverResponsibilities(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const result = await lifecycleService.getStaffHandoverResponsibilities(userId);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async processStaffExit(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const result = await lifecycleService.processStaffExitHandover({
        ...req.body,
        userId,
        verifiedByUserId: user?.id,
      });
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const lifecycleController = new LifecycleController();
