import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export const registerSchema = z.object({
  email: z.string().email('Valid email address is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  whatsAppNumber: z.string().min(8, 'Valid WhatsApp number is mandatory'),
  altPhone: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  userCategory: z.enum(['TEACHING_STAFF', 'NON_TEACHING_STAFF', 'ADMINISTRATIVE', 'STUDENT', 'OTHER']).optional(),
  requestedRole: z.string().optional(),
  departmentId: z.string().optional(),
  applicationNotes: z.string().optional(),
  idProofUrl: z.string().optional(),
  idProofType: z.string().optional(),
  idProofNumber: z.string().optional(),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
  selectedRole: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');
      const result = await AuthService.register({
        ...req.body,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
        userAgent,
      });
      return sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');
      const result = await AuthService.login({
        ...req.body,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
        userAgent,
      });
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');
      const result = await AuthService.refreshToken(
        req.body.refreshToken,
        typeof ipAddress === 'string' ? ipAddress : undefined,
        userAgent
      );
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await AuthService.logout(
        req.user!.id,
        req.body.refreshToken,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async logoutAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await AuthService.logoutAllSessions(
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      return sendSuccess(res, req.user, 200);
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await AuthService.changePassword(
        req.user!.id,
        req.body.currentPassword,
        req.body.newPassword,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}
