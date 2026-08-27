import { Response } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { PermissionService } from '../services/permission.service';
import { z } from 'zod';

const assignRoleSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID required'),
  roleName: z.string().min(1, 'Role name required'),
  departmentId: z.string().optional(),
});

const suspendUserSchema = z.object({
  reason: z.string().min(1, 'Suspension reason required'),
});

export class PermissionController {
  static async getUserPermissions(req: AuthRequest, res: Response) {
    const permissions = await PermissionService.getUserPermissions(req.user!.activeRole);
    return sendSuccess(res, permissions, 200);
  }

  static async assignUserRole(req: AuthRequest, res: Response) {
    const validated = assignRoleSchema.parse(req.body);
    const updated = await PermissionService.assignUserRole(
      req.user!.id,
      validated.targetUserId,
      validated.roleName,
      validated.departmentId
    );
    return sendSuccess(res, updated, 200);
  }

  static async suspendUser(req: AuthRequest, res: Response) {
    const validated = suspendUserSchema.parse(req.body);
    const updated = await PermissionService.suspendUserAccount(
      req.user!.id,
      req.params.id as string,
      validated.reason
    );
    return sendSuccess(res, updated, 200);
  }

  static async activateUser(req: AuthRequest, res: Response) {
    const updated = await PermissionService.activateUserAccount(req.user!.id, req.params.id as string);
    return sendSuccess(res, updated, 200);
  }
}
