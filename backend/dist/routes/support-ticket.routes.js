"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const support_ticket_controller_1 = require("../controllers/support-ticket.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.requireAuth);
// Any authenticated user can create a ticket and view their own
router.post('/', support_ticket_controller_1.SupportTicketController.createTicket);
router.get('/', support_ticket_controller_1.SupportTicketController.getTickets);
router.get('/stats', support_ticket_controller_1.SupportTicketController.getTicketStats);
router.get('/:id', support_ticket_controller_1.SupportTicketController.getTicketById);
router.patch('/:id', support_ticket_controller_1.SupportTicketController.updateTicket);
router.post('/:id/comments', support_ticket_controller_1.SupportTicketController.addComment);
exports.default = router;
