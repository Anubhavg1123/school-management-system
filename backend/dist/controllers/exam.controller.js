"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamController = void 0;
const response_1 = require("../utils/response");
const exam_service_1 = require("../services/exam.service");
const zod_1 = require("zod");
const createExamSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Exam name required'),
    code: zod_1.z.string().optional(),
    examType: zod_1.z.string().optional(),
    academicYearId: zod_1.z.string().min(1, 'Academic year required'),
    term: zod_1.z.string().optional(),
    startDate: zod_1.z.string().min(1, 'Start date required'),
    endDate: zod_1.z.string().min(1, 'End date required'),
    description: zod_1.z.string().optional(),
    classIds: zod_1.z.array(zod_1.z.string()).min(1, 'At least one class required'),
});
const scheduleSubjectSchema = zod_1.z.object({
    examinationId: zod_1.z.string().min(1, 'Exam ID required'),
    classId: zod_1.z.string().min(1, 'Class ID required'),
    subjectId: zod_1.z.string().min(1, 'Subject ID required'),
    maxTheoryMarks: zod_1.z.number().optional(),
    maxPracticalMarks: zod_1.z.number().optional(),
    maxInternalMarks: zod_1.z.number().optional(),
    totalMaxMarks: zod_1.z.number().optional(),
    passingMarks: zod_1.z.number().optional(),
    weightage: zod_1.z.number().optional(),
    examDate: zod_1.z.string().min(1, 'Exam date required'),
    startTime: zod_1.z.string().min(1, 'Start time required'),
    endTime: zod_1.z.string().min(1, 'End time required'),
    roomId: zod_1.z.string().optional(),
    invigilatorFacultyId: zod_1.z.string().optional(),
    instructions: zod_1.z.string().optional(),
});
class ExamController {
    static async createExam(req, res) {
        const validated = createExamSchema.parse(req.body);
        const exam = await exam_service_1.ExamService.createExam(req.user.id, validated);
        return (0, response_1.sendSuccess)(res, exam, 201);
    }
    static async scheduleSubject(req, res) {
        const validated = scheduleSubjectSchema.parse(req.body);
        const paper = await exam_service_1.ExamService.scheduleExamSubject(req.user.id, validated);
        return (0, response_1.sendSuccess)(res, paper, 200);
    }
    static async resolveEligibility(req, res) {
        const eligibilities = await exam_service_1.ExamService.resolveExamEligibility(req.params.id);
        return (0, response_1.sendSuccess)(res, eligibilities, 200);
    }
    static async recordAttendance(req, res) {
        const { examinationSubjectId, attendances } = req.body;
        const records = await exam_service_1.ExamService.recordExamAttendance(req.user.id, examinationSubjectId, attendances);
        return (0, response_1.sendSuccess)(res, records, 200);
    }
    static async updateStatus(req, res) {
        const { status } = req.body;
        const updated = await exam_service_1.ExamService.updateExamStatus(req.user.id, req.params.id, status);
        return (0, response_1.sendSuccess)(res, updated, 200);
    }
}
exports.ExamController = ExamController;
