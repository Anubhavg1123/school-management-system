import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { NoticeController } from '../controllers/notice.controller';
import { UserRoleEnum } from '../types';

export const noticeRouter = Router();

noticeRouter.use(requireAuth);

noticeRouter.get('/', (req, res, next) => NoticeController.getNoticesForUser(req, res).catch(next));

noticeRouter.get('/recipient-estimate', (req, res, next) =>
  NoticeController.estimateRecipientCount(req, res).catch(next)
);

noticeRouter.post(
  '/',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  (req, res, next) => NoticeController.createNotice(req, res).catch(next)
);

noticeRouter.post('/:id/acknowledge', (req, res, next) =>
  NoticeController.acknowledgeNotice(req, res).catch(next)
);

noticeRouter.post('/process-scheduler', (req, res, next) =>
  NoticeController.processScheduler(req, res).catch(next)
);

export default noticeRouter;
