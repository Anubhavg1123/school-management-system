"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficeService = void 0;
const prisma_1 = require("../prisma");
const errorHandler_1 = require("../middleware/errorHandler");
class OfficeService {
    /**
     * 1. Real-Time Central Office Dashboard KPIs
     */
    static async getOfficeDashboardMetrics() {
        const totalStudents = await prisma_1.prisma.student.count();
        const activeStudents = await prisma_1.prisma.student.count({ where: { status: 'ACTIVE' } });
        const leftStudents = await prisma_1.prisma.student.count({ where: { status: 'LEFT_INSTITUTION' } });
        const pendingAdmissions = await prisma_1.prisma.student.count({ where: { status: 'PENDING_ADMISSION' } });
        const pendingUserApprovals = await prisma_1.prisma.registrationRequest.count({
            where: { status: 'PENDING' },
        });
        const feeAssignments = await prisma_1.prisma.studentFeeAssignment.findMany({
            select: { netPayableAmount: true, totalPaidAmount: true },
        });
        let feesDue = 0;
        let feesCollected = 0;
        for (const f of feeAssignments) {
            feesDue += f.netPayableAmount;
            feesCollected += f.totalPaidAmount;
        }
        const outstandingFees = Math.max(0, feesDue - feesCollected);
        return {
            totalStudents,
            activeStudents,
            leftStudents,
            pendingAdmissions,
            pendingUserApprovals,
            feesDue,
            feesCollected,
            outstandingFees,
        };
    }
    /**
     * 2. Student Admission Intake & Master Registration (Mandatory Parent WhatsApp Verification)
     */
    static async createStudentMaster(creatorUserId, payload) {
        // Parent WhatsApp number is MANDATORY according to requirements
        if (!payload.guardianWhatsAppNumber || payload.guardianWhatsAppNumber.trim().length < 5) {
            throw new errorHandler_1.AppError('Parent/Guardian WhatsApp number is mandatory for student admission intake.', 400, 'MANDATORY_PARENT_WHATSAPP_REQUIRED');
        }
        // Resolve or create user account for student
        const existingUser = await prisma_1.prisma.user.findUnique({ where: { email: payload.email } });
        if (existingUser) {
            throw new errorHandler_1.AppError(`User with email '${payload.email}' already exists.`, 409);
        }
        // Auto-generate unique admission number if omitted
        const admissionNumber = payload.admissionNumber || `ADM-${Date.now()}`;
        const enrollmentNumber = payload.enrollmentNumber || `ENR-${Date.now()}`;
        // Create user & student in database transaction
        const student = await prisma_1.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: payload.email,
                    passwordHash: '$2b$10$e8N/O8q7S1W4b1q2z3x4uOa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5', // default temp hash
                    firstName: payload.firstName,
                    lastName: payload.lastName,
                    whatsAppNumber: payload.guardianWhatsAppNumber,
                    userCategory: 'STUDENT',
                    status: 'ACTIVE',
                    activeRole: 'STUDENT',
                },
            });
            const std = await tx.student.create({
                data: {
                    userId: user.id,
                    admissionNumber,
                    enrollmentNumber,
                    sectionId: payload.sectionId,
                    departmentId: payload.departmentId || null,
                    academicYearId: payload.academicYearId || null,
                    status: 'ACTIVE',
                    guardians: {
                        create: [
                            {
                                fullName: payload.guardianName,
                                relationship: payload.guardianRelationship,
                                phone: payload.guardianWhatsAppNumber,
                                email: payload.guardianEmail || null,
                                isPrimary: true,
                            },
                        ],
                    },
                },
                include: {
                    user: true,
                    guardians: true,
                    section: { include: { class: true } },
                },
            });
            return std;
        });
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: creatorUserId,
                action: 'STUDENT_MASTER_CREATED',
                entityType: 'Student',
                entityId: student.id,
                afterState: JSON.stringify({ admissionNumber: student.admissionNumber, email: payload.email }),
            },
        });
        return student;
    }
    /**
     * 3. Student Status Management (Transitions e.g. ACTIVE -> LEFT_INSTITUTION)
     * Prevents future attendance and academic sessions without deleting historical data.
     */
    static async updateStudentStatus(operatorUserId, studentId, newStatus, reason) {
        const student = await prisma_1.prisma.student.findUnique({
            where: { id: studentId },
            include: { user: true },
        });
        if (!student) {
            throw new errorHandler_1.AppError('Student not found.', 404);
        }
        const previousStatus = student.status;
        // Update status while preserving all historical records
        const updated = await prisma_1.prisma.$transaction(async (tx) => {
            const std = await tx.student.update({
                where: { id: studentId },
                data: { status: newStatus },
            });
            // Also update user account status if LEFT_INSTITUTION or SUSPENDED
            if (newStatus === 'LEFT_INSTITUTION' || newStatus === 'SUSPENDED') {
                await tx.user.update({
                    where: { id: student.userId },
                    data: { status: 'INACTIVE' },
                });
            }
            await tx.studentTransferLog.create({
                data: {
                    studentId,
                    fromStatus: previousStatus,
                    toStatus: newStatus,
                    transferType: 'STATUS_CHANGE',
                    reason: reason || 'Office status update',
                    transferredByUserId: operatorUserId,
                },
            });
            return std;
        });
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: operatorUserId,
                action: 'STUDENT_STATUS_UPDATED',
                entityType: 'Student',
                entityId: studentId,
                beforeState: JSON.stringify({ status: previousStatus }),
                afterState: JSON.stringify({ status: newStatus, reason }),
            },
        });
        return updated;
    }
    /**
     * 4. Student Document Vault
     */
    static async uploadStudentDocument(operatorUserId, studentId, payload) {
        const student = await prisma_1.prisma.student.findUnique({ where: { id: studentId } });
        if (!student)
            throw new errorHandler_1.AppError('Student not found.', 404);
        const doc = await prisma_1.prisma.studentDocument.create({
            data: {
                studentId,
                docType: payload.docType,
                title: payload.title,
                fileUrl: payload.fileUrl,
                fileSize: payload.fileSize || null,
                mimeType: payload.mimeType || null,
                uploadedByUserId: operatorUserId,
            },
        });
        return doc;
    }
    /**
     * 5. Record Payment & Generate Official Receipt
     */
    static async recordFeePayment(operatorUserId, payload) {
        const feeAssignment = await prisma_1.prisma.studentFeeAssignment.findUnique({
            where: { id: payload.studentFeeAssignmentId },
            include: { student: { include: { user: true } }, feeStructure: true },
        });
        if (!feeAssignment) {
            throw new errorHandler_1.AppError('Student fee assignment not found.', 404);
        }
        const newAmountPaid = feeAssignment.totalPaidAmount + payload.amount;
        const isPaidInFull = newAmountPaid >= feeAssignment.netPayableAmount;
        const newStatus = isPaidInFull ? 'PAID' : 'PARTIALLY_PAID';
        const transactionReference = payload.transactionRef || `TXN-REF-${Date.now()}`;
        const receiptNumber = `RCP-${Date.now()}`;
        const paymentNumber = `PAY-${Date.now()}`;
        const payment = await prisma_1.prisma.$transaction(async (tx) => {
            // 1. Create Payment record
            const pm = await tx.payment.create({
                data: {
                    paymentNumber,
                    studentId: payload.studentId,
                    feeAssignmentId: payload.studentFeeAssignmentId,
                    academicYearId: feeAssignment.academicYearId,
                    amount: payload.amount,
                    paymentMethod: payload.paymentMethod,
                    transactionReference,
                    receivedByUserId: operatorUserId,
                    status: 'SUCCESS',
                },
            });
            // 2. Update StudentFeeAssignment status
            await tx.studentFeeAssignment.update({
                where: { id: payload.studentFeeAssignmentId },
                data: {
                    totalPaidAmount: newAmountPaid,
                    status: newStatus,
                },
            });
            // 3. Issue Official Receipt
            const receipt = await tx.receipt.create({
                data: {
                    receiptNumber,
                    paymentId: pm.id,
                    studentId: payload.studentId,
                    amountPaid: payload.amount,
                    totalAssigned: feeAssignment.netPayableAmount,
                    totalRemainingBalance: Math.max(0, feeAssignment.netPayableAmount - newAmountPaid),
                    issuedByUserId: operatorUserId,
                },
            });
            return { payment: pm, receipt };
        });
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: operatorUserId,
                action: 'PAYMENT_RECORDED_AND_VERIFIED',
                entityType: 'Payment',
                entityId: payment.payment.id,
                afterState: JSON.stringify({ amount: payload.amount, receiptNumber, status: newStatus }),
            },
        });
        return payment;
    }
}
exports.OfficeService = OfficeService;
