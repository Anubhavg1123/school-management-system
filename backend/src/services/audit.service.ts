import { prisma } from '../prisma';
import { logger } from '../utils/logger';

export interface CreateAuditLogParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeState?: any;
  afterState?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  status?: 'SUCCESS' | 'FAILURE';
  errorMessage?: string | null;
}

export class AuditService {
  static async log(params: CreateAuditLogParams) {
    try {
      let validUserId: string | null = null;
      if (params.userId) {
        const user = await prisma.user.findUnique({ where: { id: params.userId }, select: { id: true } });
        if (user) validUserId = user.id;
      }

      return await prisma.auditLog.create({
        data: {
          userId: validUserId,
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
    } catch (error: any) {
      logger.error(`Failed to write audit log: ${error.message}`);
    }
  }

  static async getLogs(query: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    entityType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.action) where.action = { contains: query.action };
    if (query.entityType) where.entityType = query.entityType;
    if (query.status) where.status = query.status;

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
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
      prisma.auditLog.count({ where }),
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
