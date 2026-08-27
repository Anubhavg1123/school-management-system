import { Router } from 'express';
import { DiagnosticsController } from '../controllers/diagnostics.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { UserRoleEnum } from '../types';

export const diagnosticsRouter = Router();

// Webhook ingestion endpoint (can be public or bearer auth depending on provider)
diagnosticsRouter.post('/webhooks/ingest', DiagnosticsController.recordWebhook);

// Admin-only diagnostics
diagnosticsRouter.use(requireAuth);
diagnosticsRouter.use(requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]));

diagnosticsRouter.get('/system-check', DiagnosticsController.runSystemDiagnostics);
diagnosticsRouter.get('/data-quality', DiagnosticsController.runDataQualityAudit);
diagnosticsRouter.get('/webhooks', DiagnosticsController.getWebhookLogs);

export default diagnosticsRouter;
