"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportTicketController = void 0;
const support_ticket_service_1 = require("../services/support-ticket.service");
const response_1 = require("../utils/response");
class SupportTicketController {
    static async createTicket(req, res, next) {
        try {
            const userId = req.user.id;
            const { category, description, priority } = req.body;
            if (!category || !description) {
                return res.status(400).json({ success: false, error: { message: 'category and description are required.', code: 'VALIDATION_ERROR' } });
            }
            const ticket = await support_ticket_service_1.SupportTicketService.createTicket({ userId, category, description, priority });
            return (0, response_1.sendSuccess)(res, ticket, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async getTickets(req, res, next) {
        try {
            const requesterId = req.user.id;
            const requesterRole = req.user.activeRole;
            const { status, category, priority, page, limit } = req.query;
            const result = await support_ticket_service_1.SupportTicketService.getTickets(requesterId, requesterRole, {
                status: status,
                category: category,
                priority: priority,
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
            });
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async getTicketById(req, res, next) {
        try {
            const requesterId = req.user.id;
            const requesterRole = req.user.activeRole;
            const ticketId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const ticket = await support_ticket_service_1.SupportTicketService.getTicketById(ticketId, requesterId, requesterRole);
            return (0, response_1.sendSuccess)(res, ticket, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async updateTicket(req, res, next) {
        try {
            const updaterId = req.user.id;
            const updaterRole = req.user.activeRole;
            const ticketId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const { status, assignedToUserId, resolution } = req.body;
            const ticket = await support_ticket_service_1.SupportTicketService.updateTicket(ticketId, updaterId, updaterRole, { status, assignedToUserId, resolution });
            return (0, response_1.sendSuccess)(res, ticket, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async addComment(req, res, next) {
        try {
            const commenterId = req.user.id;
            const commenterRole = req.user.activeRole;
            const ticketId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const { comment, isInternal } = req.body;
            if (!comment) {
                return res.status(400).json({ success: false, error: { message: 'comment is required.', code: 'VALIDATION_ERROR' } });
            }
            const result = await support_ticket_service_1.SupportTicketService.addComment(ticketId, commenterId, commenterRole, { comment, isInternal });
            return (0, response_1.sendSuccess)(res, result, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async getTicketStats(req, res, next) {
        try {
            const stats = await support_ticket_service_1.SupportTicketService.getTicketStats();
            return (0, response_1.sendSuccess)(res, stats, 200);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.SupportTicketController = SupportTicketController;
