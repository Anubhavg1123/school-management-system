import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { CommunicationController } from '../controllers/communication.controller';
import { WhatsAppWebhookController } from '../controllers/whatsapp-webhook.controller';
import { UserRoleEnum } from '../types';

export const communicationRouter = Router();

// Public Webhook Endpoints for Meta / WhatsApp Business API
communicationRouter.get('/integrations/whatsapp/webhook', WhatsAppWebhookController.verifyWebhook);
communicationRouter.post('/integrations/whatsapp/webhook', WhatsAppWebhookController.handleWebhook);

// Protected Communication Platform Endpoints
communicationRouter.use(requireAuth);

communicationRouter.get(
  '/templates',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  (req, res, next) => CommunicationController.getTemplates(req, res).catch(next)
);

communicationRouter.post(
  '/whatsapp/send-template',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  (req, res, next) => CommunicationController.sendWhatsAppTemplate(req, res).catch(next)
);

communicationRouter.get(
  '/logs',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => CommunicationController.getCommunicationLogs(req, res).catch(next)
);

communicationRouter.post(
  '/process-queue',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  (req, res, next) => CommunicationController.triggerQueueWorker(req, res).catch(next)
);

export default communicationRouter;
