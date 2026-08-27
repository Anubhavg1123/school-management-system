import { Request, Response, NextFunction } from 'express';
import { SupportTicketService } from '../services/support-ticket.service';
import { sendSuccess } from '../utils/response';

export class SupportTicketController {
  static async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { category, description, priority } = req.body;

      if (!category || !description) {
        return res.status(400).json({ success: false, error: { message: 'category and description are required.', code: 'VALIDATION_ERROR' } });
      }

      const ticket = await SupportTicketService.createTicket({ userId, category, description, priority });
      return sendSuccess(res, ticket, 201);
    } catch (err) {
      next(err);
    }
  }

  static async getTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const requesterId = (req as any).user.id;
      const requesterRole = (req as any).user.activeRole;
      const { status, category, priority, page, limit } = req.query;

      const result = await SupportTicketService.getTickets(requesterId, requesterRole, {
        status: status as string,
        category: category as string,
        priority: priority as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      return sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  static async getTicketById(req: Request, res: Response, next: NextFunction) {
    try {
      const requesterId = (req as any).user.id;
      const requesterRole = (req as any).user.activeRole;
      const ticketId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const ticket = await SupportTicketService.getTicketById(ticketId, requesterId, requesterRole);
      return sendSuccess(res, ticket, 200);
    } catch (err) {
      next(err);
    }
  }

  static async updateTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const updaterId = (req as any).user.id;
      const updaterRole = (req as any).user.activeRole;
      const ticketId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status, assignedToUserId, resolution } = req.body;
      const ticket = await SupportTicketService.updateTicket(ticketId, updaterId, updaterRole, { status, assignedToUserId, resolution });
      return sendSuccess(res, ticket, 200);
    } catch (err) {
      next(err);
    }
  }

  static async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const commenterId = (req as any).user.id;
      const commenterRole = (req as any).user.activeRole;
      const ticketId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { comment, isInternal } = req.body;

      if (!comment) {
        return res.status(400).json({ success: false, error: { message: 'comment is required.', code: 'VALIDATION_ERROR' } });
      }

      const result = await SupportTicketService.addComment(ticketId, commenterId, commenterRole, { comment, isInternal });
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  static async getTicketStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await SupportTicketService.getTicketStats();
      return sendSuccess(res, stats, 200);
    } catch (err) {
      next(err);
    }
  }
}
