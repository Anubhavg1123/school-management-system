"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalWorkflowController = void 0;
const response_1 = require("../utils/response");
const approval_workflow_service_1 = require("../services/approval-workflow.service");
const zod_1 = require("zod");
const createApprovalSchema = zod_1.z.object({
    requestType: zod_1.z.string().min(1, 'Request type required'),
    entityType: zod_1.z.string().min(1, 'Entity type required'),
    entityId: zod_1.z.string().min(1, 'Entity ID required'),
    targetDepartmentId: zod_1.z.string().optional(),
    reason: zod_1.z.string().optional(),
});
const reviewApprovalSchema = zod_1.z.object({
    action: zod_1.z.enum(['APPROVED', 'REJECTED', 'RETURNED_FOR_CORRECTION']),
    reason: zod_1.z.string().optional(),
});
class ApprovalWorkflowController {
    static async createRequest(req, res) {
        const validated = createApprovalSchema.parse(req.body);
        const request = await approval_workflow_service_1.ApprovalWorkflowService.createApprovalRequest({
            ...validated,
            requestedByUserId: req.user.id,
        });
        return (0, response_1.sendSuccess)(res, request, 201);
    }
    static async getPendingApprovals(req, res) {
        const requests = await approval_workflow_service_1.ApprovalWorkflowService.getPendingApprovalsForUser(req.user.id, req.user.activeRole);
        return (0, response_1.sendSuccess)(res, requests, 200);
    }
    static async reviewRequest(req, res) {
        const validated = reviewApprovalSchema.parse(req.body);
        const updated = await approval_workflow_service_1.ApprovalWorkflowService.reviewApprovalRequest(req.user.id, req.user.activeRole, req.params.id, validated.action, validated.reason);
        return (0, response_1.sendSuccess)(res, updated, 200);
    }
}
exports.ApprovalWorkflowController = ApprovalWorkflowController;
