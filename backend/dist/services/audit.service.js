"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const prisma_1 = require("../prisma");
const logger_1 = require("../utils/logger");
class AuditService {
    static async log(params) {
        try {
            return await prisma_1.prisma.auditLog.create({
                data: {
                    userId: params.userId || null,
                    action: params.action,
                    entityType: params.entityType,
                    entityId: params.entityId ? String(params.entityId) : null,
                    beforeState: params.beforeState ? JSON.stringify(params.beforeState) : null,
                    afterState: params.afterState ? JSON.stringify(params.afterState) : null,
                    ipAddress: params.ipAddress || null,
                    userAgent: params.userAgent || null,
                    status: params.status || 'SUCCESS',
                    errorMessage: params.errorMessage || null,
                },
            });
        }
        catch (error) {
            logger_1.logger.error(`Failed to write audit log: ${error.message}`);
        }
    }
    static async getLogs(query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (query.userId)
            where.userId = query.userId;
        if (query.action)
            where.action = { contains: query.action };
        if (query.entityType)
            where.entityType = query.entityType;
        if (query.status)
            where.status = query.status;
        if (query.startDate || query.endDate) {
            where.createdAt = {};
            if (query.startDate)
                where.createdAt.gte = new Date(query.startDate);
            if (query.endDate)
                where.createdAt.lte = new Date(query.endDate);
        }
        const [logs, total] = await Promise.all([
            prisma_1.prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            }),
            prisma_1.prisma.auditLog.count({ where }),
        ]);
        return {
            logs,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
exports.AuditService = AuditService;
