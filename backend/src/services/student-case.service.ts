import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export interface CreateStudentCasePayload {
  studentId: string;
  caseType?: string;
  priority?: string;
  title: string;
  description: string;
  createdById: string;
  assignedToUserId?: string;
}

export class StudentCaseService {
  /**
   * 1. Create a new Student Support Case
   */
  static async createCase(payload: CreateStudentCasePayload) {
    if (!payload.studentId || !payload.title || !payload.description) {
      throw new AppError('studentId, title, and description are required.', 400, 'VALIDATION_ERROR');
    }

    const student = await prisma.student.findUnique({ where: { id: payload.studentId } });
    if (!student) {
      throw new AppError('Student record not found.', 404, 'NOT_FOUND');
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    const caseNumber = `CASE-${dateStr}-${rand}`;

    const studentCase = await prisma.studentCase.create({
      data: {
        studentId: payload.studentId,
        caseNumber,
        caseType: payload.caseType || 'ACADEMIC',
        priority: payload.priority || 'NORMAL',
        title: payload.title,
        description: payload.description,
        status: payload.assignedToUserId ? 'ASSIGNED' : 'CREATED',
        assignedToUserId: payload.assignedToUserId || null,
        createdById: payload.createdById,
      },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            section: { include: { class: true } },
          },
        },
        createdBy: { select: { firstName: true, lastName: true, activeRole: true } },
        assignedTo: { select: { firstName: true, lastName: true, email: true, activeRole: true } },
      },
    });

    // Record initial action
    await prisma.studentCaseAction.create({
      data: {
        caseId: studentCase.id,
        actionType: 'CREATED',
        note: `Case created with priority ${studentCase.priority}.`,
        performedByUserId: payload.createdById,
      },
    });

    return studentCase;
  }

  /**
   * 2. List Student Cases with RBAC scoping
   */
  static async getCases(
    requesterId: string,
    requesterRole: string,
    filters?: { status?: string; caseType?: string; priority?: string; studentId?: string }
  ) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.caseType) where.caseType = filters.caseType;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.studentId) where.studentId = filters.studentId;

    // RBAC isolation
    if (requesterRole === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: requesterId } });
      if (!student) return { cases: [], total: 0 };
      where.studentId = student.id;
    } else if (requesterRole === 'PARENT') {
      const relationships = await prisma.guardianStudentRelationship.findMany({
        where: { guardianUserId: requesterId },
        select: { studentId: true },
      });
      const studentIds = relationships.map((r) => r.studentId);
      where.studentId = { in: studentIds };
    } else if (['FACULTY'].includes(requesterRole)) {
      where.OR = [{ createdById: requesterId }, { assignedToUserId: requesterId }];
    }

    const cases = await prisma.studentCase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            section: { include: { class: true } },
          },
        },
        assignedTo: { select: { firstName: true, lastName: true, email: true, activeRole: true } },
        createdBy: { select: { firstName: true, lastName: true, activeRole: true } },
        _count: { select: { actions: true } },
      },
      take: 100,
    });

    return { cases, total: cases.length };
  }

  /**
   * 3. Get Case By ID
   */
  static async getCaseById(caseId: string, requesterId: string, requesterRole: string) {
    const studentCase = await prisma.studentCase.findUnique({
      where: { id: caseId },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            section: { include: { class: true } },
          },
        },
        assignedTo: { select: { firstName: true, lastName: true, email: true, activeRole: true } },
        createdBy: { select: { firstName: true, lastName: true, activeRole: true } },
        actions: {
          include: {
            performedBy: { select: { firstName: true, lastName: true, activeRole: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!studentCase) {
      throw new AppError('Student case not found.', 404, 'NOT_FOUND');
    }

    // Role check
    if (requesterRole === 'STUDENT' && studentCase.student.userId !== requesterId) {
      throw new AppError('Access Denied: You cannot view this case.', 403, 'FORBIDDEN');
    }

    return studentCase;
  }

  /**
   * 4. Update Case Status & Lifecycle Transition
   */
  static async updateCaseStatus(
    caseId: string,
    updaterId: string,
    payload: { status: string; assignedToUserId?: string; resolution?: string; note?: string }
  ) {
    const studentCase = await prisma.studentCase.findUnique({ where: { id: caseId } });
    if (!studentCase) {
      throw new AppError('Student case not found.', 404, 'NOT_FOUND');
    }

    const updateData: any = { status: payload.status };
    if (payload.assignedToUserId) updateData.assignedToUserId = payload.assignedToUserId;
    if (payload.resolution) updateData.resolution = payload.resolution;
    if (['RESOLVED', 'CLOSED'].includes(payload.status)) updateData.closedAt = new Date();

    const updated = await prisma.studentCase.update({
      where: { id: caseId },
      data: updateData,
      include: {
        student: { include: { user: true } },
        assignedTo: true,
      },
    });

    // Record action
    await prisma.studentCaseAction.create({
      data: {
        caseId,
        actionType: 'STATUS_CHANGE',
        note: payload.note || `Status transitioned from ${studentCase.status} to ${payload.status}.${payload.resolution ? ' Resolution: ' + payload.resolution : ''}`,
        performedByUserId: updaterId,
      },
    });

    return updated;
  }

  /**
   * 5. Add Progress Note to Case
   */
  static async addCaseAction(caseId: string, userId: string, note: string, actionType = 'NOTE_ADDED') {
    const studentCase = await prisma.studentCase.findUnique({ where: { id: caseId } });
    if (!studentCase) {
      throw new AppError('Student case not found.', 404, 'NOT_FOUND');
    }

    return prisma.studentCaseAction.create({
      data: {
        caseId,
        actionType,
        note,
        performedByUserId: userId,
      },
      include: {
        performedBy: { select: { firstName: true, lastName: true, activeRole: true } },
      },
    });
  }

  /**
   * 6. Case Aggregation Statistics
   */
  static async getCaseStats() {
    const allCases = await prisma.studentCase.findMany({
      select: { status: true, caseType: true, priority: true },
    });

    const statusCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};

    allCases.forEach((c) => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
      typeCounts[c.caseType] = (typeCounts[c.caseType] || 0) + 1;
      priorityCounts[c.priority] = (priorityCounts[c.priority] || 0) + 1;
    });

    return {
      totalCases: allCases.length,
      openCases: (statusCounts['CREATED'] || 0) + (statusCounts['ASSIGNED'] || 0) + (statusCounts['UNDER_REVIEW'] || 0) + (statusCounts['ACTION_REQUIRED'] || 0),
      resolvedCases: (statusCounts['RESOLVED'] || 0) + (statusCounts['CLOSED'] || 0),
      statusCounts,
      typeCounts,
      priorityCounts,
    };
  }
}
