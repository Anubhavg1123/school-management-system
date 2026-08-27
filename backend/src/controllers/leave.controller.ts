import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { LeaveService } from '../services/leave.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export const requestLeaveSchema = z.object({
  leaveType: z.enum(['CASUAL', 'MEDICAL', 'DUTY', 'EARNED', 'MATERNITY_PATERNITY', 'OTHER']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export const reviewLeaveSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});

export class LeaveController {
  static async requestLeave(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const leave = await LeaveService.requestLeave({
        userId: req.user!.id,
        leaveType: req.body.leaveType,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        reason: req.body.reason,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
      });

      return sendSuccess(res, leave, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getMyLeaves(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const leaves = await LeaveService.getMyLeaves(req.user!.id);
      return sendSuccess(res, leaves, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getPendingLeaves(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const leaves = await LeaveService.getPendingLeaves({
        departmentId: req.user!.departmentId || undefined,
        userRole: req.user!.activeRole,
      });
      return sendSuccess(res, leaves, 200);
    } catch (error) {
      next(error);
    }
  }

  static async reviewLeave(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await LeaveService.reviewLeave({
        id,
        reviewerId: req.user!.id,
        reviewerRole: req.user!.activeRole,
        reviewerDepartmentId: req.user!.departmentId,
        action: req.body.action,
        rejectionReason: req.body.rejectionReason,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
      });

      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}
