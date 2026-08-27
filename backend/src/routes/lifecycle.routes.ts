import { Router } from 'express';
import { lifecycleController } from '../controllers/lifecycle.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { UserRoleEnum } from '../types';

const router = Router();

router.use(requireAuth);

// Student Lifecycle
router.patch('/students/:studentId/status', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]), (req, res, next) => lifecycleController.updateStudentStatus(req, res, next));
router.post('/students/:studentId/exit-checklist', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]), (req, res, next) => lifecycleController.processStudentExit(req, res, next));
router.post('/students/:studentId/alumni', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]), (req, res, next) => lifecycleController.createAlumni(req, res, next));
router.get('/alumni', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]), (req, res, next) => lifecycleController.getAlumni(req, res, next));

// Staff Lifecycle
router.post('/staff/:userId/onboarding', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]), (req, res, next) => lifecycleController.processStaffOnboarding(req, res, next));
router.get('/staff/:userId/handover-check', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]), (req, res, next) => lifecycleController.getStaffHandoverResponsibilities(req, res, next));
router.post('/staff/:userId/exit-handover', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]), (req, res, next) => lifecycleController.processStaffExit(req, res, next));

export default router;
