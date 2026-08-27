import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from './audit.service';

const TICKET_CATEGORIES = ['LOGIN', 'ATTENDANCE', 'FEE', 'ASSIGNMENT', 'RESULT', 'PROFILE', 'GENERAL', 'OTHER'] as const;
const TICKET_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED'] as const;

// Roles that can manage all tickets (not just own)
const STAFF_ROLES = ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PRINCIPAL'];

function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `TKT-${year}-${rand}`;
}

export class SupportTicketService {
  /**
   * Create a new support ticket (any authenticated user)
   */
  static async createTicket(params: {
    userId: string;
    category: string;
    description: string;
    priority?: string;
  }) {
    if (!TICKET_CATEGORIES.includes(params.category as any)) {
      throw new AppError(`Invalid category. Valid: ${TICKET_CATEGORIES.join(', ')}`, 400, 'INVALID_CATEGORY');
    }

    let ticketNumber = generateTicketNumber();
    // Ensure uniqueness
    const exists = await prisma.supportTicket.findUnique({ where: { ticketNumber } });
    if (exists) ticketNumber = generateTicketNumber() + '-' + Date.now().toString().slice(-4);

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: params.userId,
        category: params.category,
        description: params.description,
        priority: params.priority || 'NORMAL',
        status: 'OPEN',
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, activeRole: true } },
      },
    });

    await AuditService.log({
      userId: params.userId,
      action: 'SUPPORT_TICKET_CREATED',
      entityType: 'SupportTicket',
      entityId: ticket.id,
      afterState: { ticketNumber: ticket.ticketNumber, category: ticket.category },
    });

    return ticket;
  }

  /**
   * Get tickets visible to requester (own tickets, or all if staff)
   */
  static async getTickets(
    requesterId: string,
    requesterRole: string,
    filters: { status?: string; category?: string; priority?: string; page?: number; limit?: number }
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const isStaff = STAFF_ROLES.includes(requesterRole);
    const where: any = {};
    if (!isStaff) where.userId = requesterId; // Non-staff can only see own tickets
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.priority) where.priority = filters.priority;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, activeRole: true } },
          assignedTo: { select: { firstName: true, lastName: true, email: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a single ticket (with ownership check)
   */
  static async getTicketById(ticketId: string, requesterId: string, requesterRole: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, activeRole: true } },
        assignedTo: { select: { firstName: true, lastName: true, email: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { firstName: true, lastName: true, activeRole: true } },
          },
          where: STAFF_ROLES.includes(requesterRole) ? {} : { isInternal: false },
        },
      },
    });

    if (!ticket) throw new AppError('Ticket not found.', 404, 'TICKET_NOT_FOUND');

    const isStaff = STAFF_ROLES.includes(requesterRole);
    if (!isStaff && ticket.userId !== requesterId) {
      throw new AppError('Access Denied: You can only view your own support tickets.', 403, 'FORBIDDEN');
    }

    return ticket;
  }

  /**
   * Update ticket status/assignment (staff only)
   */
  static async updateTicket(
    ticketId: string,
    updaterId: string,
    updaterRole: string,
    params: { status?: string; assignedToUserId?: string; resolution?: string }
  ) {
    if (!STAFF_ROLES.includes(updaterRole)) {
      throw new AppError('Access Denied: Only staff can update ticket status.', 403, 'FORBIDDEN');
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new AppError('Ticket not found.', 404, 'TICKET_NOT_FOUND');

    if (params.status && !TICKET_STATUSES.includes(params.status as any)) {
      throw new AppError(`Invalid status. Valid: ${TICKET_STATUSES.join(', ')}`, 400, 'INVALID_STATUS');
    }

    const updateData: any = {};
    if (params.status) updateData.status = params.status;
    if (params.assignedToUserId !== undefined) updateData.assignedToUserId = params.assignedToUserId;
    if (params.resolution !== undefined) updateData.resolution = params.resolution;
    if (params.status === 'CLOSED' || params.status === 'RESOLVED') {
      updateData.closedAt = new Date();
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        assignedTo: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    await AuditService.log({
      userId: updaterId,
      action: 'SUPPORT_TICKET_UPDATED',
      entityType: 'SupportTicket',
      entityId: ticketId,
      beforeState: { status: ticket.status },
      afterState: updateData,
    });

    return updated;
  }

  /**
   * Add comment to ticket
   */
  static async addComment(
    ticketId: string,
    commenterId: string,
    commenterRole: string,
    params: { comment: string; isInternal?: boolean }
  ) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new AppError('Ticket not found.', 404, 'TICKET_NOT_FOUND');

    const isStaff = STAFF_ROLES.includes(commenterRole);
    if (!isStaff && ticket.userId !== commenterId) {
      throw new AppError('Access Denied: You can only comment on your own tickets.', 403, 'FORBIDDEN');
    }

    // Non-staff cannot add internal notes
    const isInternal = isStaff ? (params.isInternal || false) : false;

    const comment = await prisma.supportTicketComment.create({
      data: {
        ticketId,
        userId: commenterId,
        comment: params.comment,
        isInternal,
      },
      include: {
        user: { select: { firstName: true, lastName: true, activeRole: true } },
      },
    });

    // If ticket was waiting and user replied, move to open
    if (ticket.status === 'WAITING' && !isStaff) {
      await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: 'OPEN' } });
    }

    return comment;
  }

  /**
   * Get support summary statistics (staff only)
   */
  static async getTicketStats() {
    const [open, inProgress, waiting, resolved, closed] = await Promise.all([
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.supportTicket.count({ where: { status: 'WAITING' } }),
      prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
      prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
    ]);

    const byCategory = await prisma.supportTicket.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    const byPriority = await prisma.supportTicket.groupBy({
      by: ['priority'],
      _count: { id: true },
    });

    return {
      statusSummary: { open, inProgress, waiting, resolved, closed, total: open + inProgress + waiting + resolved + closed },
      byCategory: byCategory.map((c) => ({ category: c.category, count: c._count.id })),
      byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count.id })),
    };
  }
}
