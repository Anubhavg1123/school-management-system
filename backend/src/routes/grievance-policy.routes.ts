import { Router } from 'express';
import { grievancePolicyController } from '../controllers/grievance-policy.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { UserRoleEnum } from '../types';

const router = Router();

router.use(requireAuth);

// Grievances
router.post('/', (req, res, next) => grievancePolicyController.submitGrievance(req, res, next));
router.get('/', (req, res, next) => grievancePolicyController.getGrievances(req, res, next));
router.patch('/:id/status', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]), (req, res, next) => grievancePolicyController.updateGrievanceStatus(req, res, next));

// Feedback
router.post('/feedback', (req, res, next) => grievancePolicyController.submitFeedback(req, res, next));
router.get('/feedback/metrics', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]), (req, res, next) => grievancePolicyController.getFeedbackMetrics(req, res, next));

// Policies
router.post('/policies', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]), (req, res, next) => grievancePolicyController.publishPolicy(req, res, next));
router.get('/policies', (req, res, next) => grievancePolicyController.getPolicies(req, res, next));
router.post('/policies/:policyId/acknowledge', (req, res, next) => grievancePolicyController.acknowledgePolicy(req, res, next));

// Compliance
router.post('/compliance', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]), (req, res, next) => grievancePolicyController.createComplianceChecklist(req, res, next));
router.get('/compliance', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]), (req, res, next) => grievancePolicyController.getComplianceChecklist(req, res, next));
router.patch('/compliance/:id/verify', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]), (req, res, next) => grievancePolicyController.verifyComplianceItem(req, res, next));

export default router;
