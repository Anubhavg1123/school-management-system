import { Router } from 'express';
import { SupportTicketController } from '../controllers/support-ticket.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Any authenticated user can create a ticket and view their own
router.post('/', SupportTicketController.createTicket);
router.get('/', SupportTicketController.getTickets);
router.get('/stats', SupportTicketController.getTicketStats);
router.get('/:id', SupportTicketController.getTicketById);
router.patch('/:id', SupportTicketController.updateTicket);
router.post('/:id/comments', SupportTicketController.addComment);

export default router;
