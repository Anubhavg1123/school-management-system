import { Response } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { ApprovalWorkflowService } from '../services/approval-workflow.service';
import { z } from 'zod';

const createApprovalSchema = z.object({
  requestType: z.string().min(1, 'Request type required'),
  entityType: z.string().min(1, 'Entity type required'),
  entityId: z.string().min(1, 'Entity ID required'),
  targetDepartmentId: z.string().optional(),
  reason: z.string().optional(),
});

const reviewApprovalSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED', 'RETURNED_FOR_CORRECTION']),
  reason: z.string().optional(),
});

export class ApprovalWorkflowController {
  static async createRequest(req: AuthRequest, res: Response) {
    const validated = createApprovalSchema.parse(req.body);
    const request = await ApprovalWorkflowService.createApprovalRequest({
      ...validated,
      requestedByUserId: req.user!.id,
    });
    return sendSuccess(res, request, 201);
  }

  static async getPendingApprovals(req: AuthRequest, res: Response) {
    const requests = await ApprovalWorkflowService.getPendingApprovalsForUser(req.user!.id, req.user!.activeRole);
    return sendSuccess(res, requests, 200);
  }

  static async reviewRequest(req: AuthRequest, res: Response) {
    const validated = reviewApprovalSchema.parse(req.body);
    const updated = await ApprovalWorkflowService.reviewApprovalRequest(
      req.user!.id,
      req.user!.activeRole,
      req.params.id as string,
      validated.action,
      validated.reason
    );
    return sendSuccess(res, updated, 200);
  }
}
