import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export class GrievancePolicyService {
  /**
   * Submit a grievance with privacy level protection
   */
  async submitGrievance(data: {
    category: string;
    privacyLevel?: string;
    title: string;
    description: string;
    submittedByUserId: string;
    isAnonymous?: boolean;
  }) {
    const count = await prisma.institutionalGrievance.count();
    const trackingNumber = `GRV-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const grievance = await prisma.institutionalGrievance.create({
      data: {
        trackingNumber,
        category: data.category,
        privacyLevel: data.privacyLevel || 'NORMAL',
        title: data.title,
        description: data.description,
        submittedByUserId: data.submittedByUserId,
        isAnonymous: data.isAnonymous || false,
        status: 'SUBMITTED',
      },
      include: {
        submittedByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return grievance;
  }

  /**
   * Get grievances with strict privacy scoping
   */
  async getGrievances(requestingUserId: string, userRole: string) {
    const where: any = {};

    // Non-admins only see grievances they submitted
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'OFFICE_ADMIN') {
      where.submittedByUserId = requestingUserId;
    } else if (userRole === 'OFFICE_ADMIN') {
      // Office admin cannot see CONFIDENTIAL grievances unless assigned to them
      where.OR = [
        { privacyLevel: { in: ['NORMAL', 'RESTRICTED'] } },
        { assignedToUserId: requestingUserId },
      ];
    }

    const grievances = await prisma.institutionalGrievance.findMany({
      where,
      include: {
        submittedByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedToUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Hide submitter identity if anonymous
    return grievances.map((g) => {
      if (g.isAnonymous && g.submittedByUserId !== requestingUserId && userRole !== 'SUPER_ADMIN') {
        return {
          ...g,
          submittedByUser: { id: 'ANONYMOUS', firstName: 'Anonymous', lastName: 'Submitter', email: 'hidden' },
        };
      }
      return g;
    });
  }

  /**
   * Update grievance status and record resolution
   */
  async updateGrievanceStatus(
    id: string,
    data: {
      status: string;
      assignedToUserId?: string;
      resolutionNotes?: string;
    }
  ) {
    const grievance = await prisma.institutionalGrievance.findUnique({ where: { id } });
    if (!grievance) {
      throw new AppError('Grievance not found.', 404);
    }

    const isResolved = data.status === 'RESOLVED';
    const isClosed = data.status === 'CLOSED';

    const updated = await prisma.institutionalGrievance.update({
      where: { id },
      data: {
        status: data.status,
        assignedToUserId: data.assignedToUserId !== undefined ? data.assignedToUserId : grievance.assignedToUserId,
        resolutionNotes: data.resolutionNotes !== undefined ? data.resolutionNotes : grievance.resolutionNotes,
        resolvedAt: isResolved ? new Date() : grievance.resolvedAt,
        closedAt: isClosed ? new Date() : grievance.closedAt,
      },
    });

    return updated;
  }

  /**
   * Submit institutional feedback
   */
  async submitFeedback(data: {
    targetType: string;
    targetId?: string;
    submittedByUserId: string;
    rating: number;
    comments?: string;
    academicYearId?: string;
  }) {
    if (data.rating < 1 || data.rating > 5) {
      throw new AppError('Rating must be between 1 and 5 stars.', 400);
    }

    return prisma.institutionalFeedback.create({
      data: {
        targetType: data.targetType,
        targetId: data.targetId,
        submittedByUserId: data.submittedByUserId,
        rating: data.rating,
        comments: data.comments,
        academicYearId: data.academicYearId,
      },
    });
  }

  /**
   * Get aggregated feedback metrics
   */
  async getFeedbackMetrics(targetType?: string) {
    const where: any = {};
    if (targetType) where.targetType = targetType;

    const feedbacks = await prisma.institutionalFeedback.findMany({ where });
    const count = feedbacks.length;
    const avgRating = count > 0 ? feedbacks.reduce((acc, f) => acc + f.rating, 0) / count : 0;

    return {
      totalResponses: count,
      averageRating: parseFloat(avgRating.toFixed(2)),
      breakdown: {
        5: feedbacks.filter((f) => f.rating === 5).length,
        4: feedbacks.filter((f) => f.rating === 4).length,
        3: feedbacks.filter((f) => f.rating === 3).length,
        2: feedbacks.filter((f) => f.rating === 2).length,
        1: feedbacks.filter((f) => f.rating === 1).length,
      },
      feedbacks,
    };
  }

  /**
   * Publish a new versioned policy (never overwrites historical version)
   */
  async publishPolicy(data: {
    policyCode: string;
    title: string;
    category: string;
    effectiveDate: string | Date;
    reviewDate?: string | Date;
    documentUrl?: string;
    content: string;
    createdByUserId: string;
  }) {
    const existing = await prisma.institutionalPolicy.findFirst({
      where: { policyCode: data.policyCode },
      orderBy: { version: 'desc' },
    });

    const newVersion = existing ? existing.version + 1 : 1;

    // Archive previous version if exists
    if (existing && existing.status === 'PUBLISHED') {
      await prisma.institutionalPolicy.update({
        where: { id: existing.id },
        data: { status: 'ARCHIVED' },
      });
    }

    const policy = await prisma.institutionalPolicy.create({
      data: {
        policyCode: data.policyCode,
        title: data.title,
        category: data.category,
        version: newVersion,
        effectiveDate: new Date(data.effectiveDate),
        reviewDate: data.reviewDate ? new Date(data.reviewDate) : null,
        documentUrl: data.documentUrl,
        content: data.content,
        status: 'PUBLISHED',
        createdByUserId: data.createdByUserId,
      },
    });

    return policy;
  }

  /**
   * Get all published policies and version history
   */
  async getPolicies(category?: string) {
    const where: any = {};
    if (category) where.category = category;

    return prisma.institutionalPolicy.findMany({
      where,
      include: {
        acknowledgements: { select: { userId: true, acknowledgedAt: true } },
      },
      orderBy: [{ policyCode: 'asc' }, { version: 'desc' }],
    });
  }

  /**
   * Acknowledge policy by user
   */
  async acknowledgePolicy(policyId: string, userId: string) {
    const policy = await prisma.institutionalPolicy.findUnique({ where: { id: policyId } });
    if (!policy) {
      throw new AppError('Policy not found.', 404);
    }

    return prisma.policyAcknowledgement.upsert({
      where: {
        policyId_policyVersion_userId: {
          policyId,
          policyVersion: policy.version,
          userId,
        },
      },
      update: { acknowledgedAt: new Date() },
      create: {
        policyId,
        policyVersion: policy.version,
        userId,
      },
    });
  }

  /**
   * Create or update compliance checklist items
   */
  async createComplianceChecklist(data: {
    category: string;
    title: string;
    description?: string;
    frequency?: string;
    dueDate: string | Date;
  }) {
    return prisma.complianceChecklistItem.create({
      data: {
        category: data.category,
        title: data.title,
        description: data.description,
        frequency: data.frequency || 'MONTHLY',
        dueDate: new Date(data.dueDate),
        status: 'PENDING',
      },
    });
  }

  /**
   * Get compliance checklist with overdue status calculation
   */
  async getComplianceChecklist() {
    const items = await prisma.complianceChecklistItem.findMany({
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    return items.map((item) => ({
      ...item,
      isOverdue: item.status === 'PENDING' && new Date(item.dueDate) < now,
    }));
  }

  /**
   * Verify and complete compliance item
   */
  async verifyComplianceItem(id: string, verifiedByUserId: string) {
    return prisma.complianceChecklistItem.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        verifiedByUserId,
        verifiedAt: new Date(),
      },
    });
  }
}

export const grievancePolicyService = new GrievancePolicyService();
