import { Response, NextFunction } from 'express';
import { AuthRequest, UserRoleEnum } from '../types';
import { sendError } from '../utils/response';

/**
 * Ensures authenticated user has one of the allowed roles.
 */
export const requireRoles = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401, 'UNAUTHORIZED');
    }

    // Super Admin has universal access
    if (req.user.roles.includes(UserRoleEnum.SUPER_ADMIN)) {
      return next();
    }

    const hasRole = allowedRoles.some((role) => req.user?.roles.includes(role));
    if (!hasRole) {
      return sendError(
        res,
        'Access denied. You do not have the required role to access this resource.',
        403,
        'FORBIDDEN_ROLE'
      );
    }

    next();
  };
};

/**
 * Ensures authenticated user has all specified permissions.
 */
export const requirePermissions = (requiredPermissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401, 'UNAUTHORIZED');
    }

    // Super Admin has all permissions
    if (req.user.roles.includes(UserRoleEnum.SUPER_ADMIN)) {
      return next();
    }

    const hasAll = requiredPermissions.every((perm) => req.user?.permissions.includes(perm));
    if (!hasAll) {
      return sendError(
        res,
        'Access denied. You lack required permissions for this action.',
        403,
        'FORBIDDEN_PERMISSION',
        { missingPermissions: requiredPermissions.filter((p) => !req.user?.permissions.includes(p)) }
      );
    }

    next();
  };
};

/**
 * Scopes HOD requests to their assigned department.
 */
export const requireDepartmentScope = (paramKey = 'departmentId') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401, 'UNAUTHORIZED');
    }

    // Super Admin or Office Admin bypasses department scope
    if (
      req.user.roles.includes(UserRoleEnum.SUPER_ADMIN) ||
      req.user.roles.includes(UserRoleEnum.OFFICE_ADMIN)
    ) {
      return next();
    }

    // If HOD, verify department match
    if (req.user.roles.includes(UserRoleEnum.HOD)) {
      const targetDeptId = req.params[paramKey] || req.query[paramKey] || req.body[paramKey];
      if (targetDeptId && targetDeptId !== req.user.departmentId) {
        return sendError(
          res,
          'Access denied. HODs can only access resources within their own department.',
          403,
          'DEPARTMENT_SCOPE_VIOLATION'
        );
      }
    }

    next();
  };
};
