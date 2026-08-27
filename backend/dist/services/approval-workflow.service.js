"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalWorkflowService = void 0;
const prisma_1 = require("../prisma");
const errorHandler_1 = require("../middleware/errorHandler");
class ApprovalWorkflowService {
    /**
     * 1. Initiate Generic Approval Request
     */
    static async createApprovalRequest(payload) {
        // Check if matching workflow rule exists
        const firstRule = await prisma_1.prisma.approvalWorkflowRule.findFirst({
            where: { stepOrder: 1 },
            orderBy: { createdAt: 'asc' },
        });
        const initialApproverRole = firstRule ? firstRule.approverRole : 'SUPER_ADMIN';
        const request = await prisma_1.prisma.genericApprovalRequest.create({
            data: {
                requestType: payload.requestType,
                entityType: payload.entityType,
                entityId: payload.entityId,
                requestedByUserId: payload.requestedByUserId,
                targetDepartmentId: payload.targetDepartmentId || null,
                currentStepOrder: 1,
                currentApproverRole: initialApproverRole,
                status: 'PENDING',
                reason: payload.reason || null,
            },
        });
        return request;
    }
    /**
     * 2. Fetch Pending Approvals for User based on Role & Department
     */
    static async getPendingApprovalsForUser(userId, activeRole) {
        const where = {
            status: { in: ['PENDING', 'UNDER_REVIEW'] },
        };
        if (activeRole === 'HOD') {
            const dept = await prisma_1.prisma.department.findFirst({ where: { hodUserId: userId } });
            if (dept) {
                where.OR = [
                    { currentApproverRole: 'HOD', targetDepartmentId: dept.id },
                    { currentApproverRole: 'HOD', targetDepartmentId: null },
                ];
            }
            else {
                where.currentApproverRole = 'HOD';
            }
        }
        else if (activeRole === 'OFFICE_ADMIN') {
            where.currentApproverRole = { in: ['OFFICE_ADMIN', 'HOD'] };
        }
        else if (activeRole === 'SUPER_ADMIN') {
            // Super Admin sees all pending approvals
        }
        else {
            where.requestedByUserId = userId;
        }
        const requests = await prisma_1.prisma.genericApprovalRequest.findMany({
            where,
            include: {
                requestedByUser: { select: { firstName: true, lastName: true, email: true, activeRole: true } },
                department: { select: { name: true, code: true } },
                histories: { orderBy: { actionAt: 'desc' } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return requests;
    }
    /**
     * 3. Process Approval Decision (APPROVE / REJECT / RETURN_FOR_CORRECTION)
     */
    static async reviewApprovalRequest(reviewerUserId, reviewerRole, requestId, action, reason) {
        const request = await prisma_1.prisma.genericApprovalRequest.findUnique({
            where: { id: requestId },
        });
        if (!request) {
            throw new errorHandler_1.AppError('Approval request not found.', 404);
        }
        if (request.status === 'APPROVED' || request.status === 'REJECTED') {
            throw new errorHandler_1.AppError('Approval request has already been finalized.', 400);
        }
        // Role check: Ensure reviewer holds approver role or is Super Admin
        if (reviewerRole !== 'SUPER_ADMIN' && reviewerRole !== request.currentApproverRole) {
            throw new errorHandler_1.AppError(`Authorization violation: Requires role '${request.currentApproverRole}' to review this approval step.`, 403);
        }
        const updatedRequest = await prisma_1.prisma.$transaction(async (tx) => {
            // Record History
            await tx.genericApprovalHistory.create({
                data: {
                    requestId,
                    stepOrder: request.currentStepOrder,
                    actionByUserId: reviewerUserId,
                    actionRole: reviewerRole,
                    action,
                    reason: reason || null,
                },
            });
            if (action === 'APPROVED') {
                // Check if next workflow step exists
                const nextRule = await tx.approvalWorkflowRule.findFirst({
                    where: { stepOrder: request.currentStepOrder + 1 },
                });
                if (nextRule) {
                    // Advance to next step
                    return tx.genericApprovalRequest.update({
                        where: { id: requestId },
                        data: {
                            currentStepOrder: nextRule.stepOrder,
                            currentApproverRole: nextRule.approverRole,
                            status: 'UNDER_REVIEW',
                        },
                    });
                }
                else {
                    // Final Approval -> Update Request and Entity State
                    const reqFinal = await tx.genericApprovalRequest.update({
                        where: { id: requestId },
                        data: { status: 'APPROVED' },
                    });
                    // Execute Target Entity State Transition
                    if (request.entityType === 'User') {
                        await tx.user.update({
                            where: { id: request.entityId },
                            data: { status: 'ACTIVE' },
                        });
                    }
                    else if (request.entityType === 'FacultyLeave') {
                        await tx.facultyLeave.update({
                            where: { id: request.entityId },
                            data: { status: 'APPROVED', reviewedByUserId: reviewerUserId, reviewedAt: new Date() },
                        });
                    }
                    else if (request.entityType === 'AcademicBypassRequest') {
                        await tx.academicBypassRequest.update({
                            where: { id: request.entityId },
                            data: { status: 'APPROVED', approvedByUserId: reviewerUserId },
                        });
                    }
                    else if (request.entityType === 'Vehicle') {
                        await tx.facultyVehicleRegistration.update({
                            where: { id: request.entityId },
                            data: { status: 'APPROVED', approvedByUserId: reviewerUserId, approvedAt: new Date() },
                        });
                    }
                    return reqFinal;
                }
            }
            else {
                // REJECTED or RETURNED_FOR_CORRECTION
                const newStatus = action === 'REJECTED' ? 'REJECTED' : 'RETURNED_FOR_CORRECTION';
                const reqFinal = await tx.genericApprovalRequest.update({
                    where: { id: requestId },
                    data: { status: newStatus, reason: reason || null },
                });
                if (action === 'REJECTED' && request.entityType === 'User') {
                    await tx.user.update({
                        where: { id: request.entityId },
                        data: { status: 'INACTIVE' },
                    });
                }
                return reqFinal;
            }
        });
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: reviewerUserId,
                action: `APPROVAL_REQUEST_${action}`,
                entityType: 'GenericApprovalRequest',
                entityId: requestId,
                afterState: JSON.stringify({ action, reviewerRole, reason }),
            },
        });
        return updatedRequest;
    }
}
exports.ApprovalWorkflowService = ApprovalWorkflowService;
