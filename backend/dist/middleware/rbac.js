"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireDepartmentScope = exports.requirePermissions = exports.requireRoles = void 0;
const types_1 = require("../types");
const response_1 = require("../utils/response");
/**
 * Ensures authenticated user has one of the allowed roles.
 */
const requireRoles = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'Authentication required.', 401, 'UNAUTHORIZED');
        }
        // Super Admin has universal access
        if (req.user.roles.includes(types_1.UserRoleEnum.SUPER_ADMIN)) {
            return next();
        }
        const hasRole = allowedRoles.some((role) => req.user?.roles.includes(role));
        if (!hasRole) {
            return (0, response_1.sendError)(res, 'Access denied. You do not have the required role to access this resource.', 403, 'FORBIDDEN_ROLE');
        }
        next();
    };
};
exports.requireRoles = requireRoles;
/**
 * Ensures authenticated user has all specified permissions.
 */
const requirePermissions = (requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'Authentication required.', 401, 'UNAUTHORIZED');
        }
        // Super Admin has all permissions
        if (req.user.roles.includes(types_1.UserRoleEnum.SUPER_ADMIN)) {
            return next();
        }
        const hasAll = requiredPermissions.every((perm) => req.user?.permissions.includes(perm));
        if (!hasAll) {
            return (0, response_1.sendError)(res, 'Access denied. You lack required permissions for this action.', 403, 'FORBIDDEN_PERMISSION', { missingPermissions: requiredPermissions.filter((p) => !req.user?.permissions.includes(p)) });
        }
        next();
    };
};
exports.requirePermissions = requirePermissions;
/**
 * Scopes HOD requests to their assigned department.
 */
const requireDepartmentScope = (paramKey = 'departmentId') => {
    return (req, res, next) => {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'Authentication required.', 401, 'UNAUTHORIZED');
        }
        // Super Admin or Office Admin bypasses department scope
        if (req.user.roles.includes(types_1.UserRoleEnum.SUPER_ADMIN) ||
            req.user.roles.includes(types_1.UserRoleEnum.OFFICE_ADMIN)) {
            return next();
        }
        // If HOD, verify department match
        if (req.user.roles.includes(types_1.UserRoleEnum.HOD)) {
            const targetDeptId = req.params[paramKey] || req.query[paramKey] || req.body[paramKey];
            if (targetDeptId && targetDeptId !== req.user.departmentId) {
                return (0, response_1.sendError)(res, 'Access denied. HODs can only access resources within their own department.', 403, 'DEPARTMENT_SCOPE_VIOLATION');
            }
        }
        next();
    };
};
exports.requireDepartmentScope = requireDepartmentScope;
