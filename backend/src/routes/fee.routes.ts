import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { FeeController } from '../controllers/fee.controller';
import { UserRoleEnum } from '../types';

const router = Router();

// Universal Fee Module Guard: Super Admin & Office Admin only
const financialRoles = [UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN];

router.use(requireAuth);
router.use(requireRoles(financialRoles));

// Fee Categories
router.get('/categories', FeeController.getCategories);
router.post('/categories', FeeController.createCategory);

// Fee Structures
router.get('/structures', FeeController.getStructures);
router.get('/structures/:id', FeeController.getStructureById);
router.post('/structures', FeeController.createStructure);

// Fee Assignments
router.post('/assign', FeeController.assignFee);
router.get('/assignments', FeeController.getAssignments);

// Discounts & Scholarships
router.post('/discount', FeeController.applyDiscount);

// Payments & Receipts
router.post('/pay', FeeController.collectPayment);

// Refunds & Reversals
router.post('/refund', FeeController.processRefund);

// Student Financial Profile Ledger
router.get('/student/:studentId', FeeController.getStudentFinancialProfile);

// Financial Dashboard & Outstanding Reports
router.get('/dashboard', FeeController.getDashboard);
router.get('/reports/outstanding', FeeController.getOutstandingReport);

export default router;
