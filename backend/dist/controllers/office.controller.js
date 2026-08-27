"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficeController = void 0;
const response_1 = require("../utils/response");
const office_service_1 = require("../services/office.service");
const zod_1 = require("zod");
const createStudentSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name required'),
    lastName: zod_1.z.string().min(1, 'Last name required'),
    email: zod_1.z.string().email('Invalid email'),
    dob: zod_1.z.string().optional(),
    gender: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    guardianName: zod_1.z.string().min(1, 'Guardian name required'),
    guardianRelationship: zod_1.z.string().min(1, 'Guardian relationship required'),
    guardianWhatsAppNumber: zod_1.z.string().optional().default(''),
    guardianAltPhone: zod_1.z.string().optional(),
    guardianEmail: zod_1.z.string().optional(),
    admissionNumber: zod_1.z.string().optional(),
    enrollmentNumber: zod_1.z.string().optional(),
    classId: zod_1.z.string().optional(),
    sectionId: zod_1.z.string().min(1, 'Section required'),
    departmentId: zod_1.z.string().optional(),
    academicYearId: zod_1.z.string().optional(),
});
const updateStudentStatusSchema = zod_1.z.object({
    status: zod_1.z.string().min(1, 'Status required'),
    reason: zod_1.z.string().min(1, 'Reason required'),
});
const recordPaymentSchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1, 'Student ID required'),
    studentFeeAssignmentId: zod_1.z.string().min(1, 'Fee assignment ID required'),
    amount: zod_1.z.number().positive('Payment amount must be positive'),
    paymentMethod: zod_1.z.string().min(1, 'Payment method required'),
    transactionRef: zod_1.z.string().optional(),
    remarks: zod_1.z.string().optional(),
});
class OfficeController {
    static async getOfficeDashboard(req, res) {
        const metrics = await office_service_1.OfficeService.getOfficeDashboardMetrics();
        return (0, response_1.sendSuccess)(res, metrics, 200);
    }
    static async createStudentMaster(req, res) {
        const validated = createStudentSchema.parse(req.body);
        const student = await office_service_1.OfficeService.createStudentMaster(req.user.id, validated);
        return (0, response_1.sendSuccess)(res, student, 201);
    }
    static async updateStudentStatus(req, res) {
        const validated = updateStudentStatusSchema.parse(req.body);
        const student = await office_service_1.OfficeService.updateStudentStatus(req.user.id, req.params.id, validated.status, validated.reason);
        return (0, response_1.sendSuccess)(res, student, 200);
    }
    static async uploadDocument(req, res) {
        const { docType, title, fileUrl, fileSize, mimeType } = req.body;
        const doc = await office_service_1.OfficeService.uploadStudentDocument(req.user.id, req.params.id, {
            docType,
            title,
            fileUrl,
            fileSize,
            mimeType,
        });
        return (0, response_1.sendSuccess)(res, doc, 201);
    }
    static async recordFeePayment(req, res) {
        const validated = recordPaymentSchema.parse(req.body);
        const payment = await office_service_1.OfficeService.recordFeePayment(req.user.id, validated);
        return (0, response_1.sendSuccess)(res, payment, 201);
    }
}
exports.OfficeController = OfficeController;
