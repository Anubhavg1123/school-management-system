import { Router } from 'express';
import { StudentCaseController } from '../controllers/student-case.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { UserRoleEnum } from '../types';

export const studentCaseRouter = Router();

studentCaseRouter.use(requireAuth);

// Student cases list & stats
studentCaseRouter.get('/', StudentCaseController.getCases);
studentCaseRouter.get('/stats', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]), StudentCaseController.getCaseStats);
studentCaseRouter.get('/:id', StudentCaseController.getCaseById);

// Create case (Super Admin, Office, HOD, Faculty)
studentCaseRouter.post(
  '/',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  StudentCaseController.createCase
);

// Update case status / resolve (Super Admin, Office, HOD, Assigned Faculty)
studentCaseRouter.patch(
  '/:id/status',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  StudentCaseController.updateCaseStatus
);

// Add progress action note
studentCaseRouter.post(
  '/:id/actions',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  StudentCaseController.addCaseAction
);

export default studentCaseRouter;
