"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.communicationRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const communication_controller_1 = require("../controllers/communication.controller");
const whatsapp_webhook_controller_1 = require("../controllers/whatsapp-webhook.controller");
const types_1 = require("../types");
exports.communicationRouter = (0, express_1.Router)();
// Public Webhook Endpoints for Meta / WhatsApp Business API
exports.communicationRouter.get('/integrations/whatsapp/webhook', whatsapp_webhook_controller_1.WhatsAppWebhookController.verifyWebhook);
exports.communicationRouter.post('/integrations/whatsapp/webhook', whatsapp_webhook_controller_1.WhatsAppWebhookController.handleWebhook);
// Protected Communication Platform Endpoints
exports.communicationRouter.use(auth_1.requireAuth);
exports.communicationRouter.get('/templates', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD, types_1.UserRoleEnum.FACULTY]), (req, res, next) => communication_controller_1.CommunicationController.getTemplates(req, res).catch(next));
exports.communicationRouter.post('/whatsapp/send-template', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD, types_1.UserRoleEnum.FACULTY]), (req, res, next) => communication_controller_1.CommunicationController.sendWhatsAppTemplate(req, res).catch(next));
exports.communicationRouter.get('/logs', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN]), (req, res, next) => communication_controller_1.CommunicationController.getCommunicationLogs(req, res).catch(next));
exports.communicationRouter.post('/process-queue', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN]), (req, res, next) => communication_controller_1.CommunicationController.triggerQueueWorker(req, res).catch(next));
exports.default = exports.communicationRouter;
