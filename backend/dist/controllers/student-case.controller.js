"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentCaseController = void 0;
const student_case_service_1 = require("../services/student-case.service");
const response_1 = require("../utils/response");
class StudentCaseController {
    static async createCase(req, res, next) {
        try {
            const createdById = req.user.id;
            const { studentId, caseType, priority, title, description, assignedToUserId } = req.body;
            const studentCase = await student_case_service_1.StudentCaseService.createCase({
                studentId,
                caseType,
                priority,
                title,
                description,
                createdById,
                assignedToUserId,
            });
            return (0, response_1.sendSuccess)(res, studentCase, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async getCases(req, res, next) {
        try {
            const user = req.user;
            const { status, caseType, priority, studentId } = req.query;
            const result = await student_case_service_1.StudentCaseService.getCases(user.id, user.activeRole, {
                status: status,
                caseType: caseType,
                priority: priority,
                studentId: studentId,
            });
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async getCaseById(req, res, next) {
        try {
            const user = req.user;
            const caseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const studentCase = await student_case_service_1.StudentCaseService.getCaseById(caseId, user.id, user.activeRole);
            return (0, response_1.sendSuccess)(res, studentCase, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async updateCaseStatus(req, res, next) {
        try {
            const updaterId = req.user.id;
            const caseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const { status, assignedToUserId, resolution, note } = req.body;
            const updated = await student_case_service_1.StudentCaseService.updateCaseStatus(caseId, updaterId, {
                status,
                assignedToUserId,
                resolution,
                note,
            });
            return (0, response_1.sendSuccess)(res, updated, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async addCaseAction(req, res, next) {
        try {
            const userId = req.user.id;
            const caseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const { note, actionType } = req.body;
            if (!note) {
                return res.status(400).json({ success: false, error: { message: 'note is required.', code: 'VALIDATION_ERROR' } });
            }
            const action = await student_case_service_1.StudentCaseService.addCaseAction(caseId, userId, note, actionType);
            return (0, response_1.sendSuccess)(res, action, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async getCaseStats(req, res, next) {
        try {
            const stats = await student_case_service_1.StudentCaseService.getCaseStats();
            return (0, response_1.sendSuccess)(res, stats, 200);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.StudentCaseController = StudentCaseController;
