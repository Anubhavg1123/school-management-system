import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { NotificationController } from '../controllers/notification.controller';

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get('/', (req, res, next) => NotificationController.getUserNotifications(req, res).catch(next));
notificationRouter.patch('/:id/read', (req, res, next) => NotificationController.markAsRead(req, res).catch(next));
notificationRouter.post('/read-all', (req, res, next) => NotificationController.markAllAsRead(req, res).catch(next));
notificationRouter.delete('/:id', (req, res, next) => NotificationController.deleteNotification(req, res).catch(next));

export default notificationRouter;
