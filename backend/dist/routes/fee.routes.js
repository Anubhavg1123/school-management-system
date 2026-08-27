"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const fee_controller_1 = require("../controllers/fee.controller");
const types_1 = require("../types");
const router = (0, express_1.Router)();
// Universal Fee Module Guard: Super Admin & Office Admin only
const financialRoles = [types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN];
router.use(auth_1.requireAuth);
router.use((0, rbac_1.requireRoles)(financialRoles));
// Fee Categories
router.get('/categories', fee_controller_1.FeeController.getCategories);
router.post('/categories', fee_controller_1.FeeController.createCategory);
// Fee Structures
router.get('/structures', fee_controller_1.FeeController.getStructures);
router.get('/structures/:id', fee_controller_1.FeeController.getStructureById);
router.post('/structures', fee_controller_1.FeeController.createStructure);
// Fee Assignments
router.post('/assign', fee_controller_1.FeeController.assignFee);
router.get('/assignments', fee_controller_1.FeeController.getAssignments);
// Discounts & Scholarships
router.post('/discount', fee_controller_1.FeeController.applyDiscount);
// Payments & Receipts
router.post('/pay', fee_controller_1.FeeController.collectPayment);
// Refunds & Reversals
router.post('/refund', fee_controller_1.FeeController.processRefund);
// Student Financial Profile Ledger
router.get('/student/:studentId', fee_controller_1.FeeController.getStudentFinancialProfile);
// Financial Dashboard & Outstanding Reports
router.get('/dashboard', fee_controller_1.FeeController.getDashboard);
router.get('/reports/outstanding', fee_controller_1.FeeController.getOutstandingReport);
exports.default = router;
