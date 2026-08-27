import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export class InstitutionalWorkflowService {
  /**
   * Create an approval delegation for an approver
   */
  async createDelegation(data: {
    originalApproverUserId: string;
    delegateUserId: string;
    startDate: string | Date;
    endDate: string | Date;
    reason: string;
    scope?: string;
  }) {
    if (data.originalApproverUserId === data.delegateUserId) {
      throw new AppError('Cannot delegate approval authority to oneself.', 400);
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (end < start) {
      throw new AppError('Delegation end date cannot be earlier than start date.', 400);
    }

    // Verify both users exist
    const [originalUser, delegateUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: data.originalApproverUserId } }),
      prisma.user.findUnique({ where: { id: data.delegateUserId } }),
    ]);

    if (!originalUser || !delegateUser) {
      throw new AppError('Original approver or delegate user not found.', 404);
    }

    const delegation = await prisma.approvalDelegation.create({
      data: {
        originalApproverUserId: data.originalApproverUserId,
        delegateUserId: data.delegateUserId,
        startDate: start,
        endDate: end,
        reason: data.reason,
        scope: data.scope || 'ALL',
        isActive: true,
      },
      include: {
        originalApprover: { select: { id: true, firstName: true, lastName: true, email: true } },
        delegateUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return delegation;
  }

  /**
   * Get active delegations for a user (either as approver or delegate)
   */
  async getDelegations(userId?: string) {
    const now = new Date();
    const where: any = {};

    if (userId) {
      where.OR = [
        { originalApproverUserId: userId },
        { delegateUserId: userId },
      ];
    }

    const delegations = await prisma.approvalDelegation.findMany({
      where,
      include: {
        originalApprover: { select: { id: true, firstName: true, lastName: true, email: true } },
        delegateUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return delegations.map((d) => ({
      ...d,
      isCurrentlyEffective: d.isActive && now >= d.startDate && now <= d.endDate,
    }));
  }

  /**
   * Revoke or deactivate a delegation
   */
  async revokeDelegation(id: string, requestingUserId: string, isSuperAdmin: boolean = false) {
    const delegation = await prisma.approvalDelegation.findUnique({ where: { id } });
    if (!delegation) {
      throw new AppError('Delegation not found.', 404);
    }

    if (!isSuperAdmin && delegation.originalApproverUserId !== requestingUserId) {
      throw new AppError('Only the original approver or Super Admin can revoke this delegation.', 403);
    }

    const updated = await prisma.approvalDelegation.update({
      where: { id },
      data: { isActive: false },
    });

    return updated;
  }

  /**
   * Check if a user has active delegated authority for a target approver and scope
   */
  async hasActiveDelegation(delegateUserId: string, originalApproverUserId: string, scope: string = 'ALL'): Promise<boolean> {
    const now = new Date();
    const active = await prisma.approvalDelegation.findFirst({
      where: {
        originalApproverUserId,
        delegateUserId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        OR: [{ scope: 'ALL' }, { scope }],
      },
    });

    return !!active;
  }

  /**
   * Configure or update SLA parameters for a workflow
   */
  async configureSla(data: {
    workflowType: string;
    targetHours: number;
    reminderHours: number;
    escalateToRole?: string;
    escalateToUserId?: string;
    isActive?: boolean;
  }) {
    const config = await prisma.workflowSlaConfig.upsert({
      where: { workflowType: data.workflowType },
      update: {
        targetHours: data.targetHours,
        reminderHours: data.reminderHours,
        escalateToRole: data.escalateToRole,
        escalateToUserId: data.escalateToUserId,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      create: {
        workflowType: data.workflowType,
        targetHours: data.targetHours,
        reminderHours: data.reminderHours,
        escalateToRole: data.escalateToRole,
        escalateToUserId: data.escalateToUserId,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return config;
  }

  /**
   * Get all SLA configurations
   */
  async getSlaConfigs() {
    return prisma.workflowSlaConfig.findMany({
      orderBy: { workflowType: 'asc' },
    });
  }

  /**
   * Evaluate SLA status for pending workflow items
   */
  async evaluatePendingSlaStatus() {
    const configs = await prisma.workflowSlaConfig.findMany({ where: { isActive: true } });
    const configMap = new Map(configs.map((c) => [c.workflowType, c]));

    const now = new Date();

    // Check pending user registrations
    const pendingRegistrations = await prisma.registrationRequest.findMany({
      where: { status: 'PENDING' },
      select: { id: true, createdAt: true, userCategory: true, user: { select: { email: true } } },
    });

    const userSla = configMap.get('USER_APPROVAL') || { targetHours: 48, reminderHours: 24 };
    const registrationSlaItems = pendingRegistrations.map((r) => {
      const elapsedHours = (now.getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60);
      return {
        id: r.id,
        workflow: 'USER_APPROVAL',
        item: `Registration: ${r.user?.email || 'New User'} (${r.userCategory})`,
        createdAt: r.createdAt,
        elapsedHours: Math.round(elapsedHours),
        targetHours: userSla.targetHours,
        status: elapsedHours > userSla.targetHours ? 'OVERDUE' : elapsedHours > userSla.reminderHours ? 'WARNING' : 'ON_TRACK',
      };
    });

    // Check pending generic approval requests
    const pendingApprovals = await prisma.genericApprovalRequest.findMany({
      where: { status: 'PENDING' },
      select: { id: true, createdAt: true, requestType: true, currentApproverRole: true },
    });

    const approvalSla = configMap.get('GENERIC_APPROVAL') || { targetHours: 24, reminderHours: 12 };
    const approvalSlaItems = pendingApprovals.map((l) => {
      const elapsedHours = (now.getTime() - new Date(l.createdAt).getTime()) / (1000 * 60 * 60);
      return {
        id: l.id,
        workflow: 'GENERIC_APPROVAL',
        item: `Approval: ${l.requestType} (${l.currentApproverRole})`,
        createdAt: l.createdAt,
        elapsedHours: Math.round(elapsedHours),
        targetHours: approvalSla.targetHours,
        status: elapsedHours > approvalSla.targetHours ? 'OVERDUE' : elapsedHours > approvalSla.reminderHours ? 'WARNING' : 'ON_TRACK',
      };
    });

    return {
      summary: {
        totalPending: registrationSlaItems.length + approvalSlaItems.length,
        overdueCount: [...registrationSlaItems, ...approvalSlaItems].filter((i) => i.status === 'OVERDUE').length,
        warningCount: [...registrationSlaItems, ...approvalSlaItems].filter((i) => i.status === 'WARNING').length,
        onTrackCount: [...registrationSlaItems, ...approvalSlaItems].filter((i) => i.status === 'ON_TRACK').length,
      },
      items: [...registrationSlaItems, ...approvalSlaItems],
    };
  }
}

export const institutionalWorkflowService = new InstitutionalWorkflowService();
