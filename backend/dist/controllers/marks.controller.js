"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarksController = void 0;
const response_1 = require("../utils/response");
const marks_service_1 = require("../services/marks.service");
const zod_1 = require("zod");
const submitMarksSchema = zod_1.z.object({
    examinationSubjectId: zod_1.z.string().min(1, 'Exam subject ID required'),
    marks: zod_1.z.array(zod_1.z.object({
        studentId: zod_1.z.string().min(1, 'Student ID required'),
        obtainedTheoryMarks: zod_1.z.number().optional(),
        obtainedPracticalMarks: zod_1.z.number().optional(),
        obtainedInternalMarks: zod_1.z.number().optional(),
        isAbsent: zod_1.z.boolean().optional(),
        remarks: zod_1.z.string().optional(),
    })),
    isDraft: zod_1.z.boolean().optional(),
});
const verifyMarksSchema = zod_1.z.object({
    action: zod_1.z.enum(['VERIFIED', 'RETURNED_FOR_CORRECTION']),
    reason: zod_1.z.string().optional(),
});
const requestCorrectionSchema = zod_1.z.object({
    studentMarksId: zod_1.z.string().min(1, 'Marks ID required'),
    requestedMarks: zod_1.z.number().nonnegative('Requested marks must be non-negative'),
    reason: zod_1.z.string().min(1, 'Correction reason required'),
});
class MarksController {
    static async submitMarks(req, res) {
        const validated = submitMarksSchema.parse(req.body);
        const results = await marks_service_1.MarksService.submitStudentMarksBatch(req.user.id, validated.examinationSubjectId, validated.marks, validated.isDraft ?? true);
        return (0, response_1.sendSuccess)(res, results, 200);
    }
    static async verifyMarks(req, res) {
        const validated = verifyMarksSchema.parse(req.body);
        const result = await marks_service_1.MarksService.verifySubjectMarks(req.user.id, req.params.subjectId, validated.action, validated.reason);
        return (0, response_1.sendSuccess)(res, result, 200);
    }
    static async requestCorrection(req, res) {
        const validated = requestCorrectionSchema.parse(req.body);
        const correction = await marks_service_1.MarksService.requestMarksCorrection(req.user.id, validated.studentMarksId, validated.requestedMarks, validated.reason);
        return (0, response_1.sendSuccess)(res, correction, 201);
    }
    static async reviewCorrection(req, res) {
        const { action } = req.body;
        const result = await marks_service_1.MarksService.reviewMarksCorrection(req.user.id, req.params.id, action);
        return (0, response_1.sendSuccess)(res, result, 200);
    }
}
exports.MarksController = MarksController;
