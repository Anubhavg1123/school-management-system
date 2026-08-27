import { Router } from 'express';
import { operationsIntelligenceController } from '../controllers/operations-intelligence.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { UserRoleEnum } from '../types';

const router = Router();

router.use(requireAuth);

// Operational Daily Summary
router.get('/daily-summary', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]), (req, res, next) => operationsIntelligenceController.getDailySummary(req, res, next));

// Recommendations
router.get('/recommendations', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]), (req, res, next) => operationsIntelligenceController.getRecommendations(req, res, next));
router.patch('/recommendations/:id/status', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]), (req, res, next) => operationsIntelligenceController.updateRecommendationStatus(req, res, next));

// 360 Profiles
router.get('/student-360/:studentId', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]), (req, res, next) => operationsIntelligenceController.getStudent360(req, res, next));
router.get('/staff-360/:userId', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]), (req, res, next) => operationsIntelligenceController.getStaff360(req, res, next));

// Incidents
router.post('/incidents', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]), (req, res, next) => operationsIntelligenceController.createIncident(req, res, next));
router.get('/incidents', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]), (req, res, next) => operationsIntelligenceController.getIncidents(req, res, next));
router.patch('/incidents/:id', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]), (req, res, next) => operationsIntelligenceController.updateIncident(req, res, next));

// Data Corrections
router.post('/data-corrections', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]), (req, res, next) => operationsIntelligenceController.createDataCorrection(req, res, next));
router.patch('/data-corrections/:id', requireRoles([UserRoleEnum.SUPER_ADMIN]), (req, res, next) => operationsIntelligenceController.processDataCorrection(req, res, next));
router.get('/data-corrections', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]), (req, res, next) => operationsIntelligenceController.getDataCorrections(req, res, next));

export default router;
