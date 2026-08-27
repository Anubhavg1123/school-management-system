"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const prisma_1 = require("../prisma");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const errorHandler_1 = require("../middleware/errorHandler");
const config_1 = require("../config");
const audit_service_1 = require("./audit.service");
const types_1 = require("../types");
class AuthService {
    static async register(data) {
        // Validate password strength
        const strength = (0, password_1.validatePasswordStrength)(data.password);
        if (!strength.valid) {
            throw new errorHandler_1.AppError(strength.message || 'Weak password.', 400, 'WEAK_PASSWORD');
        }
        // Check if email or username exists
        const existingEmail = await prisma_1.prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
        if (existingEmail) {
            throw new errorHandler_1.AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
        }
        const existingUsername = await prisma_1.prisma.user.findUnique({ where: { username: data.username.toLowerCase() } });
        if (existingUsername) {
            throw new errorHandler_1.AppError('This username is already taken.', 409, 'USERNAME_TAKEN');
        }
        // Disallow self-registration for higher administrative / leadership roles
        const forbiddenSelfRoles = ['HOD', 'SUPER_ADMIN', 'PRINCIPAL', 'COORDINATOR', 'CLASS_COORDINATOR'];
        if (data.requestedRole && forbiddenSelfRoles.includes(data.requestedRole.toUpperCase())) {
            throw new errorHandler_1.AppError('Higher administrative and department leadership roles (HOD, Class Coordinator, Principal) cannot be requested via self-registration. They must be appointed by institutional authorities.', 400, 'UNAUTHORIZED_ROLE_REQUEST');
        }
        // Resolve requested role from category if needed
        let targetRoleName = data.requestedRole;
        if (!targetRoleName) {
            if (data.userCategory === 'TEACHING_STAFF')
                targetRoleName = 'FACULTY';
            else if (data.userCategory === 'NON_TEACHING_STAFF')
                targetRoleName = 'NON_FACULTY';
            else if (data.userCategory === 'ADMINISTRATIVE')
                targetRoleName = 'OFFICE_ADMIN';
            else if (data.userCategory === 'STUDENT')
                targetRoleName = 'STUDENT';
            else
                targetRoleName = 'PARENT';
        }
        // Find requested role
        const role = await prisma_1.prisma.role.findUnique({ where: { name: targetRoleName } });
        if (!role) {
            throw new errorHandler_1.AppError(`Invalid role requested: ${targetRoleName}`, 400, 'INVALID_ROLE');
        }
        // Hash password
        const passwordHash = await (0, password_1.hashPassword)(data.password);
        // Create user and registration request in transaction
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: data.email.toLowerCase(),
                    username: data.username.toLowerCase(),
                    passwordHash,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone || null,
                    whatsAppNumber: data.whatsAppNumber || null,
                    altPhone: data.altPhone || null,
                    dob: data.dob ? new Date(data.dob) : null,
                    gender: data.gender || null,
                    address: data.address || null,
                    emergencyContactName: data.emergencyContactName || null,
                    emergencyContactPhone: data.emergencyContactPhone || null,
                    userCategory: data.userCategory || 'TEACHING_STAFF',
                    idProofType: data.idProofType || null,
                    idProofNumber: data.idProofNumber || null,
                    status: types_1.UserStatusEnum.PENDING_APPROVAL,
                },
            });
            const registration = await tx.registrationRequest.create({
                data: {
                    userId: user.id,
                    requestedRoleId: role.id,
                    departmentId: data.departmentId || null,
                    dob: data.dob ? new Date(data.dob) : null,
                    gender: data.gender || null,
                    whatsAppNumber: data.whatsAppNumber || null,
                    altPhone: data.altPhone || null,
                    address: data.address || null,
                    emergencyContactName: data.emergencyContactName || null,
                    emergencyContactPhone: data.emergencyContactPhone || null,
                    userCategory: data.userCategory || 'TEACHING_STAFF',
                    applicationNotes: data.applicationNotes || null,
                    idProofUrl: data.idProofUrl || null,
                    status: types_1.RegistrationStatusEnum.PENDING,
                },
            });
            return { user, registration };
        });
        // Audit log
        await audit_service_1.AuditService.log({
            userId: result.user.id,
            action: 'USER_REGISTRATION_SUBMITTED',
            entityType: 'RegistrationRequest',
            entityId: result.registration.id,
            afterState: { email: result.user.email, role: targetRoleName, dept: data.departmentId },
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
        });
        return {
            message: 'Registration request submitted successfully. It will be reviewed by an administrator.',
            registrationId: result.registration.id,
            status: 'PENDING_APPROVAL',
        };
    }
    static async login(data) {
        const identifier = data.identifier.toLowerCase().trim();
        // Find user by email or username
        const user = await prisma_1.prisma.user.findFirst({
            where: {
                OR: [{ email: identifier }, { username: identifier }],
            },
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
            await audit_service_1.AuditService.log({
                action: 'LOGIN_FAILED_UNKNOWN_USER',
                entityType: 'User',
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                status: 'FAILURE',
                errorMessage: `Unknown identifier attempted: ${identifier}`,
            });
            throw new errorHandler_1.AppError('Invalid email/username or password.', 401, 'INVALID_CREDENTIALS');
        }
        // Check account lockout
        if (user.status === types_1.UserStatusEnum.LOCKED || (user.lockoutUntil && new Date() < user.lockoutUntil)) {
            if (user.lockoutUntil && new Date() < user.lockoutUntil) {
                const remainingMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
                await audit_service_1.AuditService.log({
                    userId: user.id,
                    action: 'LOGIN_BLOCKED_LOCKED_ACCOUNT',
                    entityType: 'User',
                    entityId: user.id,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent,
                    status: 'FAILURE',
                    errorMessage: `Account locked. ${remainingMinutes} mins remaining.`,
                });
                throw new errorHandler_1.AppError(`Account is locked due to too many failed attempts. Try again in ${remainingMinutes} minute(s).`, 403, 'ACCOUNT_LOCKED');
            }
            else {
                // Lockout expired, reset lockout
                await prisma_1.prisma.user.update({
                    where: { id: user.id },
                    data: { failedLoginAttempts: 0, lockoutUntil: null, status: types_1.UserStatusEnum.ACTIVE },
                });
            }
        }
        // Check password
        const isPasswordValid = await (0, password_1.comparePassword)(data.password, user.passwordHash);
        if (!isPasswordValid) {
            const newAttempts = user.failedLoginAttempts + 1;
            const willLockout = newAttempts >= config_1.config.security.maxLoginAttempts;
            const lockoutUntil = willLockout
                ? new Date(Date.now() + config_1.config.security.lockoutDurationMinutes * 60 * 1000)
                : null;
            await prisma_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: newAttempts,
                    lockoutUntil,
                    status: willLockout ? types_1.UserStatusEnum.LOCKED : user.status,
                },
            });
            await audit_service_1.AuditService.log({
                userId: user.id,
                action: willLockout ? 'ACCOUNT_LOCKOUT_TRIGGERED' : 'LOGIN_FAILED_INVALID_PASSWORD',
                entityType: 'User',
                entityId: user.id,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                status: 'FAILURE',
                errorMessage: willLockout ? 'Max failed login attempts exceeded. Account locked.' : `Attempt ${newAttempts}`,
            });
            if (willLockout) {
                throw new errorHandler_1.AppError(`Maximum login attempts exceeded. Your account has been temporarily locked for ${config_1.config.security.lockoutDurationMinutes} minutes.`, 403, 'ACCOUNT_LOCKED');
            }
            throw new errorHandler_1.AppError('Invalid email/username or password.', 401, 'INVALID_CREDENTIALS');
        }
        // Check account status
        if (user.status === types_1.UserStatusEnum.PENDING_APPROVAL || user.status === 'PENDING_APPROVAL') {
            throw new errorHandler_1.AppError('Your registration is currently pending review by an administrator.', 403, 'ACCOUNT_PENDING_APPROVAL');
        }
        if (user.status === types_1.UserStatusEnum.APPROVED_PENDING_ROLE ||
            user.status === 'APPROVED_PENDING_ROLE' ||
            user.status === 'ROLE_ASSIGNMENT_REQUIRED') {
            throw new errorHandler_1.AppError('Your account has been approved, but an operational role has not yet been assigned. Please contact the school administrator.', 403, 'ROLE_ASSIGNMENT_REQUIRED');
        }
        if (user.status === types_1.UserStatusEnum.SUSPENDED) {
            throw new errorHandler_1.AppError('Your account has been suspended. Please contact the administrator.', 403, 'ACCOUNT_SUSPENDED');
        }
        if (user.status === types_1.UserStatusEnum.INACTIVE) {
            throw new errorHandler_1.AppError('Your account is deactivated. Please contact the administrator.', 403, 'ACCOUNT_INACTIVE');
        }
        // Extract roles
        const assignedRoles = user.userRoles.map((ur) => ur.role.name);
        if (assignedRoles.length === 0) {
            throw new errorHandler_1.AppError('Your account has been approved, but an operational role has not yet been assigned. Please contact the school administrator.', 403, 'ROLE_ASSIGNMENT_REQUIRED');
        }
        // Role Selection Verification
        let activeRole = assignedRoles[0];
        if (data.selectedRole) {
            if (!assignedRoles.includes(data.selectedRole)) {
                await audit_service_1.AuditService.log({
                    userId: user.id,
                    action: 'LOGIN_ROLE_SPOOF_ATTEMPT',
                    entityType: 'User',
                    entityId: user.id,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent,
                    status: 'FAILURE',
                    errorMessage: `User attempted to log in as ${data.selectedRole} but only possesses [${assignedRoles.join(', ')}]`,
                });
                throw new errorHandler_1.AppError(`Unauthorized: You do not have the '${data.selectedRole}' role assigned to your account.`, 403, 'ROLE_NOT_ASSIGNED');
            }
            activeRole = data.selectedRole;
        }
        const activeUserRole = user.userRoles.find((ur) => ur.role.name === activeRole);
        const departmentId = activeUserRole?.departmentId || null;
        // Permissions
        const permissionSet = new Set();
        for (const ur of user.userRoles) {
            for (const rp of ur.role.rolePermissions) {
                permissionSet.add(rp.permission.code);
            }
        }
        const permissions = Array.from(permissionSet);
        // Reset failed attempts & update last login
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: 0,
                lockoutUntil: null,
                lastLoginAt: new Date(),
            },
        });
        // Generate tokens
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            username: user.username || undefined,
            roles: assignedRoles,
            activeRole,
            departmentId: departmentId || undefined,
        };
        const accessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
        const { token: refreshToken, hash: refreshTokenHash, expiresAt: refreshExpiresAt } = (0, jwt_1.generateRefreshToken)(tokenPayload);
        // Save refresh token
        await prisma_1.prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: refreshTokenHash,
                deviceInfo: data.userAgent || 'Unknown Device',
                expiresAt: refreshExpiresAt,
            },
        });
        // Audit log successful login
        await audit_service_1.AuditService.log({
            userId: user.id,
            action: 'USER_LOGIN_SUCCESS',
            entityType: 'User',
            entityId: user.id,
            afterState: { role: activeRole },
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                whatsAppNumber: user.whatsAppNumber,
                userCategory: user.userCategory,
                status: user.status,
                roles: assignedRoles,
                activeRole,
                departmentId,
                permissions,
            },
            tokens: {
                accessToken,
                refreshToken,
                expiresIn: config_1.config.jwt.accessExpiresIn,
            },
        };
    }
    static async refreshToken(refreshTokenStr, ipAddress, userAgent) {
        let payload;
        try {
            payload = (0, jwt_1.verifyRefreshToken)(refreshTokenStr);
        }
        catch {
            throw new errorHandler_1.AppError('Invalid or expired refresh token.', 401, 'INVALID_REFRESH_TOKEN');
        }
        const tokenHash = (0, jwt_1.hashTokenString)(refreshTokenStr);
        const tokenRecord = await prisma_1.prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: { user: { include: { userRoles: { include: { role: true } } } } },
        });
        if (!tokenRecord || tokenRecord.isRevoked || new Date() > tokenRecord.expiresAt) {
            throw new errorHandler_1.AppError('Refresh token has been revoked or expired.', 401, 'REFRESH_TOKEN_EXPIRED');
        }
        // Revoke old refresh token (Token Rotation)
        await prisma_1.prisma.refreshToken.update({
            where: { id: tokenRecord.id },
            data: { isRevoked: true },
        });
        const user = tokenRecord.user;
        if (user.status !== types_1.UserStatusEnum.ACTIVE) {
            throw new errorHandler_1.AppError('User account is not active.', 403, 'ACCOUNT_INACTIVE');
        }
        const assignedRoles = user.userRoles.map((ur) => ur.role.name);
        const activeRole = payload.activeRole && assignedRoles.includes(payload.activeRole)
            ? payload.activeRole
            : assignedRoles[0];
        const newTokenPayload = {
            userId: user.id,
            email: user.email,
            username: user.username || undefined,
            roles: assignedRoles,
            activeRole,
            departmentId: payload.departmentId || undefined,
        };
        const newAccessToken = (0, jwt_1.generateAccessToken)(newTokenPayload);
        const { token: newRefreshToken, hash: newRefreshTokenHash, expiresAt } = (0, jwt_1.generateRefreshToken)(newTokenPayload);
        await prisma_1.prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: newRefreshTokenHash,
                deviceInfo: userAgent || 'Unknown Device',
                expiresAt,
            },
        });
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    }
    static async logout(userId, refreshTokenStr, ipAddress) {
        if (refreshTokenStr) {
            const tokenHash = (0, jwt_1.hashTokenString)(refreshTokenStr);
            await prisma_1.prisma.refreshToken.updateMany({
                where: { tokenHash },
                data: { isRevoked: true },
            });
        }
        await audit_service_1.AuditService.log({
            userId,
            action: 'USER_LOGOUT',
            entityType: 'User',
            entityId: userId,
            ipAddress,
        });
        return { message: 'Logged out successfully.' };
    }
    static async logoutAllSessions(userId, ipAddress) {
        await prisma_1.prisma.refreshToken.updateMany({
            where: { userId, isRevoked: false },
            data: { isRevoked: true },
        });
        await audit_service_1.AuditService.log({
            userId,
            action: 'USER_LOGOUT_ALL_SESSIONS',
            entityType: 'User',
            entityId: userId,
            ipAddress,
        });
        return { message: 'All active sessions have been revoked successfully.' };
    }
    static async changePassword(userId, currentPass, newPass, ipAddress) {
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new errorHandler_1.AppError('User not found.', 404, 'USER_NOT_FOUND');
        }
        const isMatch = await (0, password_1.comparePassword)(currentPass, user.passwordHash);
        if (!isMatch) {
            throw new errorHandler_1.AppError('Current password does not match.', 400, 'INCORRECT_PASSWORD');
        }
        const strength = (0, password_1.validatePasswordStrength)(newPass);
        if (!strength.valid) {
            throw new errorHandler_1.AppError(strength.message || 'Weak new password.', 400, 'WEAK_PASSWORD');
        }
        const newHash = await (0, password_1.hashPassword)(newPass);
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.user.update({
                where: { id: userId },
                data: { passwordHash: newHash },
            }),
            // Revoke all existing refresh tokens upon password change
            prisma_1.prisma.refreshToken.updateMany({
                where: { userId, isRevoked: false },
                data: { isRevoked: true },
            }),
        ]);
        await audit_service_1.AuditService.log({
            userId,
            action: 'PASSWORD_CHANGED',
            entityType: 'User',
            entityId: userId,
            ipAddress,
        });
        return { message: 'Password updated successfully. Please log in again.' };
    }
}
exports.AuthService = AuthService;
