import { Response, NextFunction } from 'express';
import { AuthRequest, UserStatusEnum } from '../types';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../prisma';
import { sendError } from '../utils/response';

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required. No token provided.', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, 'Authentication required. Invalid token format.', 401, 'UNAUTHORIZED');
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return sendError(res, 'Session expired or invalid token.', 401, 'TOKEN_INVALID');
    }

    // Check user in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return sendError(res, 'User account no longer exists.', 401, 'USER_NOT_FOUND');
    }

    // Verify account status
    if (user.status === UserStatusEnum.PENDING_APPROVAL) {
      return sendError(res, 'Your registration is still pending approval.', 403, 'ACCOUNT_PENDING_APPROVAL');
    }

    if (user.status === UserStatusEnum.LOCKED) {
      if (user.lockoutUntil && new Date() < user.lockoutUntil) {
        return sendError(
          res,
          `Account is temporarily locked due to failed attempts. Please try again after ${user.lockoutUntil.toLocaleTimeString()}.`,
          403,
          'ACCOUNT_LOCKED'
        );
      }
    }

    if (user.status !== UserStatusEnum.ACTIVE) {
      return sendError(res, `Account is currently ${user.status.toLowerCase()}. Please contact administration.`, 403, 'ACCOUNT_INACTIVE');
    }

    // Extract user roles and permissions
    const assignedRoles = user.userRoles.map((ur) => ur.role.name);
    if (user.activeRole && !assignedRoles.includes(user.activeRole)) {
      assignedRoles.push(user.activeRole);
    }
    const activeRole = payload.activeRole && assignedRoles.includes(payload.activeRole)
      ? payload.activeRole
      : (user.activeRole || assignedRoles[0] || 'FACULTY');

    const activeUserRole = user.userRoles.find((ur) => ur.role.name === activeRole);
    const departmentId = activeUserRole?.departmentId || null;

    // Collect all permissions for user roles
    const permissionSet = new Set<string>();
    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissionSet.add(rp.permission.code);
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username || undefined,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      roles: assignedRoles,
      activeRole,
      departmentId,
      permissions: Array.from(permissionSet),
    };

    next();
  } catch (error) {
    next(error);
  }
};
