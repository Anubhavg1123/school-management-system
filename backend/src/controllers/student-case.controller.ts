import { Request, Response, NextFunction } from 'express';
import { StudentCaseService } from '../services/student-case.service';
import { sendSuccess } from '../utils/response';

export class StudentCaseController {
  static async createCase(req: Request, res: Response, next: NextFunction) {
    try {
      const createdById = (req as any).user.id;
      const { studentId, caseType, priority, title, description, assignedToUserId } = req.body;
      const studentCase = await StudentCaseService.createCase({
        studentId,
        caseType,
        priority,
        title,
        description,
        createdById,
        assignedToUserId,
      });
      return sendSuccess(res, studentCase, 201);
    } catch (err) {
      next(err);
    }
  }

  static async getCases(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { status, caseType, priority, studentId } = req.query;
      const result = await StudentCaseService.getCases(user.id, user.activeRole, {
        status: status as string,
        caseType: caseType as string,
        priority: priority as string,
        studentId: studentId as string,
      });
      return sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  static async getCaseById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const caseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const studentCase = await StudentCaseService.getCaseById(caseId, user.id, user.activeRole);
      return sendSuccess(res, studentCase, 200);
    } catch (err) {
      next(err);
    }
  }

  static async updateCaseStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const updaterId = (req as any).user.id;
      const caseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status, assignedToUserId, resolution, note } = req.body;
      const updated = await StudentCaseService.updateCaseStatus(caseId, updaterId, {
        status,
        assignedToUserId,
        resolution,
        note,
      });
      return sendSuccess(res, updated, 200);
    } catch (err) {
      next(err);
    }
  }

  static async addCaseAction(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const caseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { note, actionType } = req.body;

      if (!note) {
        return res.status(400).json({ success: false, error: { message: 'note is required.', code: 'VALIDATION_ERROR' } });
      }

      const action = await StudentCaseService.addCaseAction(caseId, userId, note, actionType);
      return sendSuccess(res, action, 201);
    } catch (err) {
      next(err);
    }
  }

  static async getCaseStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await StudentCaseService.getCaseStats();
      return sendSuccess(res, stats, 200);
    } catch (err) {
      next(err);
    }
  }
}
