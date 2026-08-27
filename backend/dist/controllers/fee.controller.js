"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeController = void 0;
const zod_1 = require("zod");
const fee_service_1 = require("../services/fee.service");
const createFeeCategorySchema = zod_1.z.object({
    code: zod_1.z.string().min(2, 'Category code is required'),
    name: zod_1.z.string().min(2, 'Category name is required'),
    description: zod_1.z.string().optional(),
});
const createFeeStructureSchema = zod_1.z.object({
    code: zod_1.z.string().min(2, 'Structure code is required'),
    name: zod_1.z.string().min(2, 'Structure name is required'),
    academicYearId: zod_1.z.string().min(1, 'Academic year is required'),
    classId: zod_1.z.string().optional(),
    departmentId: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    items: zod_1.z.array(zod_1.z.object({
        feeCategoryId: zod_1.z.string().min(1, 'Fee category is required'),
        amount: zod_1.z.number().positive('Amount must be greater than zero'),
        isOptional: zod_1.z.boolean().optional(),
        dueDate: zod_1.z.string().optional(),
        installmentCount: zod_1.z.number().int().positive().optional(),
    })).min(1, 'At least one fee item is required'),
});
const assignFeeSchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1, 'Student ID is required'),
    feeStructureId: zod_1.z.string().min(1, 'Fee structure ID is required'),
    academicYearId: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    customInstallments: zod_1.z.number().int().min(1).max(12).optional(),
});
const applyDiscountSchema = zod_1.z.object({
    feeAssignmentId: zod_1.z.string().min(1, 'Fee assignment ID is required'),
    type: zod_1.z.enum(['FIXED_AMOUNT', 'PERCENTAGE', 'SCHOLARSHIP', 'CONCESSION', 'WAIVER']),
    amount: zod_1.z.number().positive().optional(),
    percentage: zod_1.z.number().min(0.01).max(100).optional(),
    reason: zod_1.z.string().min(3, 'Detailed justification reason is required'),
});
const collectPaymentSchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1, 'Student ID is required'),
    feeAssignmentId: zod_1.z.string().min(1, 'Fee assignment ID is required'),
    amount: zod_1.z.number().positive('Payment amount must be greater than zero'),
    paymentMethod: zod_1.z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'ONLINE', 'CHEQUE', 'OTHER']),
    transactionReference: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
const processRefundSchema = zod_1.z.object({
    paymentId: zod_1.z.string().min(1, 'Payment ID is required'),
    amount: zod_1.z.number().positive('Refund amount must be greater than zero'),
    reason: zod_1.z.string().min(3, 'Detailed refund reason is required'),
});
class FeeController {
    // ----------------------------------------------------
    // Fee Categories
    // ----------------------------------------------------
    static async getCategories(req, res, next) {
        try {
            const categories = await fee_service_1.FeeService.getFeeCategories();
            res.status(200).json({ success: true, data: categories });
        }
        catch (err) {
            next(err);
        }
    }
    static async createCategory(req, res, next) {
        try {
            const body = createFeeCategorySchema.parse(req.body);
            const category = await fee_service_1.FeeService.createFeeCategory(body);
            res.status(201).json({ success: true, data: category });
        }
        catch (err) {
            next(err);
        }
    }
    // ----------------------------------------------------
    // Fee Structures
    // ----------------------------------------------------
    static async getStructures(req, res, next) {
        try {
            const { academicYearId, classId, departmentId } = req.query;
            const structures = await fee_service_1.FeeService.getFeeStructures({
                academicYearId: academicYearId,
                classId: classId,
                departmentId: departmentId,
            });
            res.status(200).json({ success: true, data: structures });
        }
        catch (err) {
            next(err);
        }
    }
    static async getStructureById(req, res, next) {
        try {
            const structure = await fee_service_1.FeeService.getFeeStructureById(req.params.id);
            res.status(200).json({ success: true, data: structure });
        }
        catch (err) {
            next(err);
        }
    }
    static async createStructure(req, res, next) {
        try {
            const body = createFeeStructureSchema.parse(req.body);
            const structure = await fee_service_1.FeeService.createFeeStructure(body, req.user?.id);
            res.status(201).json({ success: true, data: structure });
        }
        catch (err) {
            next(err);
        }
    }
    // ----------------------------------------------------
    // Student Fee Assignments
    // ----------------------------------------------------
    static async assignFee(req, res, next) {
        try {
            const body = assignFeeSchema.parse(req.body);
            const assignment = await fee_service_1.FeeService.assignFeeToStudent({
                ...body,
                assignedByUserId: req.user?.id,
            });
            res.status(201).json({ success: true, data: assignment });
        }
        catch (err) {
            next(err);
        }
    }
    static async getAssignments(req, res, next) {
        try {
            const { studentId, academicYearId, status, classId, page, limit } = req.query;
            const result = await fee_service_1.FeeService.getStudentFeeAssignments({
                studentId: studentId,
                academicYearId: academicYearId,
                status: status,
                classId: classId,
                page: page ? parseInt(page, 10) : 1,
                limit: limit ? parseInt(limit, 10) : 20,
            });
            res.status(200).json({ success: true, data: result.rows, meta: result.meta });
        }
        catch (err) {
            next(err);
        }
    }
    // ----------------------------------------------------
    // Discounts & Scholarships
    // ----------------------------------------------------
    static async applyDiscount(req, res, next) {
        try {
            const body = applyDiscountSchema.parse(req.body);
            const discount = await fee_service_1.FeeService.applyDiscount({
                ...body,
                approvedByUserId: req.user?.id || '',
            });
            res.status(201).json({ success: true, data: discount });
        }
        catch (err) {
            next(err);
        }
    }
    // ----------------------------------------------------
    // Payment Collection & Receipts
    // ----------------------------------------------------
    static async collectPayment(req, res, next) {
        try {
            const body = collectPaymentSchema.parse(req.body);
            const result = await fee_service_1.FeeService.collectPayment({
                ...body,
                receivedByUserId: req.user?.id || '',
            });
            res.status(201).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    // ----------------------------------------------------
    // Refunds & Reversals
    // ----------------------------------------------------
    static async processRefund(req, res, next) {
        try {
            const body = processRefundSchema.parse(req.body);
            const refund = await fee_service_1.FeeService.processRefund({
                ...body,
                requestedByUserId: req.user?.id || '',
                approvedByUserId: req.user?.id,
            });
            res.status(201).json({ success: true, data: refund });
        }
        catch (err) {
            next(err);
        }
    }
    // ----------------------------------------------------
    // Student Financial Profile
    // ----------------------------------------------------
    static async getStudentFinancialProfile(req, res, next) {
        try {
            const profile = await fee_service_1.FeeService.getStudentFinancialProfile(req.params.studentId);
            res.status(200).json({ success: true, data: profile });
        }
        catch (err) {
            next(err);
        }
    }
    // ----------------------------------------------------
    // Financial Dashboard & Reports
    // ----------------------------------------------------
    static async getDashboard(req, res, next) {
        try {
            const dashboard = await fee_service_1.FeeService.getFinancialDashboard();
            res.status(200).json({ success: true, data: dashboard });
        }
        catch (err) {
            next(err);
        }
    }
    static async getOutstandingReport(req, res, next) {
        try {
            const { classId, departmentId, status, page, limit, format } = req.query;
            const result = await fee_service_1.FeeService.getOutstandingReport({
                classId: classId,
                departmentId: departmentId,
                status: status,
                page: page ? parseInt(page, 10) : 1,
                limit: limit ? parseInt(limit, 10) : 25,
            });
            if (format === 'csv') {
                const headers = [
                    'Admission No',
                    'Student Name',
                    'Class',
                    'Section',
                    'Department',
                    'Fee Structure',
                    'Net Payable',
                    'Total Paid',
                    'Total Refunded',
                    'Outstanding Balance',
                    'Overdue Amount',
                    'Status',
                ];
                const rows = result.rows.map((r) => [
                    `"${r.admissionNumber}"`,
                    `"${r.studentName}"`,
                    `"${r.className}"`,
                    `"${r.sectionName}"`,
                    `"${r.departmentName}"`,
                    `"${r.feeStructureName}"`,
                    r.netPayable,
                    r.totalPaid,
                    r.totalRefunded,
                    r.outstandingBalance,
                    r.overdueAmount,
                    `"${r.status}"`,
                ]);
                const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="fee_outstanding_report_${Date.now()}.csv"`);
                return res.status(200).send(csvContent);
            }
            res.status(200).json({ success: true, data: result.rows, meta: result.meta });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.FeeController = FeeController;
