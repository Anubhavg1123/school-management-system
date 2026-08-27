import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { RegistrationService } from '../services/registration.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export const approveRegistrationSchema = z.object({
  role: z.string().optional(),
  departmentId: z.string().optional(),
  employeeOrAdmissionCode: z.string().optional(),
  designation: z.string().optional(),
  reviewerNotes: z.string().optional(),
});

export const rejectRegistrationSchema = z.object({
  reason: z.string().min(3, 'A valid rejection reason must be provided (min 3 characters).'),
});

export const underReviewSchema = z.object({
  reviewerNotes: z.string().optional(),
});

export class RegistrationController {
  static async getPending(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const roleId = req.query.roleId as string | undefined;
      const departmentId = req.query.departmentId as string | undefined;
      const includeUnderReview = req.query.includeUnderReview !== 'false';

      const result = await RegistrationService.getPendingRegistrations({
        page,
        limit,
        roleId,
        departmentId,
        includeUnderReview,
      });

      return sendSuccess(res, result.requests, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getRecentlyReviewed(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const result = await RegistrationService.getRecentlyReviewed(limit);
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await RegistrationService.getRegistrationById(id);
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async markUnderReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await RegistrationService.markUnderReview({
        id,
        reviewerId: req.user!.id,
        reviewerNotes: req.body.reviewerNotes,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
      });

      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async approve(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await RegistrationService.approveRegistration({
        id,
        reviewerId: req.user!.id,
        role: req.body.role,
        departmentId: req.body.departmentId,
        employeeOrAdmissionCode: req.body.employeeOrAdmissionCode,
        designation: req.body.designation,
        reviewerNotes: req.body.reviewerNotes,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
      });

      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async reject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await RegistrationService.rejectRegistration({
        id,
        reviewerId: req.user!.id,
        reason: req.body.reason,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
      });

      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}
