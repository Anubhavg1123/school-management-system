import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserService } from '../services/user.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export const createUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  whatsAppNumber: z.string().optional(),
  altPhone: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  userCategory: z.enum(['TEACHING_STAFF', 'NON_TEACHING_STAFF', 'ADMINISTRATIVE', 'STUDENT', 'OTHER']).optional(),
  role: z.string().min(1, 'Role is required'),
  departmentId: z.string().optional(),
  designation: z.string().optional(),
  employeeCode: z.string().optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  whatsAppNumber: z.string().optional(),
  altPhone: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  userCategory: z.enum(['TEACHING_STAFF', 'NON_TEACHING_STAFF', 'ADMINISTRATIVE', 'STUDENT', 'OTHER']).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED']),
});

export const assignRolesSchema = z.object({
  roles: z.array(
    z.object({
      roleName: z.string(),
      departmentId: z.string().optional(),
      isPrimary: z.boolean().optional(),
    })
  ).min(1, 'At least one role must be provided'),
  reason: z.string().optional(),
});

export const assignOperationalRoleSchema = z.object({
  role: z.string().min(1, 'Operational role is required'),
  departmentId: z.string().optional(),
  designation: z.string().optional(),
  employeeOrAdmissionCode: z.string().optional(),
  reason: z.string().optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'New password must be at least 8 characters').optional(),
});

export class UserController {
  static async listUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string | undefined;
      const role = req.query.role as string | undefined;
      const status = req.query.status as string | undefined;
      const departmentId = req.query.departmentId as string | undefined;
      const userCategory = req.query.userCategory as string | undefined;

      const result = await UserService.getUsers({
        page,
        limit,
        search,
        role,
        status,
        departmentId,
        userCategory,
      });

      return sendSuccess(res, result.users, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await UserService.getUserById(id);
      return sendSuccess(res, user, 200);
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const user = await UserService.createUser(
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, user, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const targetId = paramId || req.user!.id;
      const result = await UserService.updateUser(
        targetId,
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await UserService.updateUserStatus(
        id,
        req.body.status,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async assignOperationalRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await UserService.assignOperationalRole(
        id,
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async assignRoles(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await UserService.assignRoles(
        id,
        req.body.roles,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined,
        req.body.reason
      );
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await UserService.resetUserPassword(
        id,
        req.body.newPassword,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getUserAuditTrail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const trail = await UserService.getUserAuditTrail(id);
      return sendSuccess(res, trail, 200);
    } catch (error) {
      next(error);
    }
  }

  static async listRoles(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const roles = await UserService.getRoles();
      return sendSuccess(res, roles, 200);
    } catch (error) {
      next(error);
    }
  }

  static async listPermissions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const permissions = await UserService.getPermissions();
      return sendSuccess(res, permissions, 200);
    } catch (error) {
      next(error);
    }
  }
}
