import { Router } from 'express';
import { RealtimeController } from '../controllers/realtime.controller';
import { requireAuth } from '../middleware/auth';

export const realtimeRouter = Router();

// Stream SSE events (Authenticated)
realtimeRouter.get('/stream', requireAuth, RealtimeController.streamEvents);
realtimeRouter.get('/stats', requireAuth, RealtimeController.getStats);

export default realtimeRouter;
