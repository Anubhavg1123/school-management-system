"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarksService = void 0;
const prisma_1 = require("../prisma");
const errorHandler_1 = require("../middleware/errorHandler");
class MarksService {
    /**
     * 1. Transactional Bulk Faculty Marks Entry (DRAFT or SUBMITTED)
     */
    static async submitStudentMarksBatch(facultyUserId, examinationSubjectId, marks, isDraft = true) {
        const examPaper = await prisma_1.prisma.examinationSubject.findUnique({
            where: { id: examinationSubjectId },
            include: { examination: true, class: true, subject: true },
        });
        if (!examPaper)
            throw new errorHandler_1.AppError('Examination subject paper not found.', 404);
        const results = [];
        const status = isDraft ? 'DRAFT' : 'SUBMITTED';
        for (const item of marks) {
            const theory = item.isAbsent ? 0 : item.obtainedTheoryMarks ?? 0;
            const practical = item.isAbsent ? 0 : item.obtainedPracticalMarks ?? 0;
            const internal = item.isAbsent ? 0 : item.obtainedInternalMarks ?? 0;
            // Range Validation (Obtained <= Max)
            if (theory > examPaper.maxTheoryMarks) {
                throw new errorHandler_1.AppError(`Validation Error: Theory marks (${theory}) exceed maximum theory marks (${examPaper.maxTheoryMarks}) for student ID ${item.studentId}.`, 400);
            }
            if (practical > examPaper.maxPracticalMarks) {
                throw new errorHandler_1.AppError(`Validation Error: Practical marks (${practical}) exceed maximum practical marks (${examPaper.maxPracticalMarks}).`, 400);
            }
            if (internal > examPaper.maxInternalMarks) {
                throw new errorHandler_1.AppError(`Validation Error: Internal marks (${internal}) exceed maximum internal marks (${examPaper.maxInternalMarks}).`, 400);
            }
            const totalObtainedMarks = theory + practical + internal;
            const rec = await prisma_1.prisma.studentMarks.upsert({
                where: {
                    examinationSubjectId_studentId: {
                        examinationSubjectId,
                        studentId: item.studentId,
                    },
                },
                update: {
                    obtainedTheoryMarks: theory,
                    obtainedPracticalMarks: practical,
                    obtainedInternalMarks: internal,
                    totalObtainedMarks,
                    isAbsent: item.isAbsent ?? false,
                    remarks: item.remarks || null,
                    status,
                    enteredByUserId: facultyUserId,
                },
                create: {
                    examinationSubjectId,
                    studentId: item.studentId,
                    subjectId: examPaper.subjectId,
                    obtainedTheoryMarks: theory,
                    obtainedPracticalMarks: practical,
                    obtainedInternalMarks: internal,
                    totalObtainedMarks,
                    isAbsent: item.isAbsent ?? false,
                    remarks: item.remarks || null,
                    status,
                    enteredByUserId: facultyUserId,
                },
            });
            results.push(rec);
        }
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: facultyUserId,
                action: isDraft ? 'STUDENT_MARKS_SAVED_DRAFT' : 'STUDENT_MARKS_SUBMITTED',
                entityType: 'ExaminationSubject',
                entityId: examinationSubjectId,
                afterState: JSON.stringify({ count: marks.length, status }),
            },
        });
        return results;
    }
    /**
     * 2. HOD / Principal Marks Verification (SUBMITTED -> VERIFIED)
     */
    static async verifySubjectMarks(reviewerUserId, examinationSubjectId, action, reason) {
        const status = action === 'VERIFIED' ? 'VERIFIED' : 'RETURNED_FOR_CORRECTION';
        const updated = await prisma_1.prisma.studentMarks.updateMany({
            where: { examinationSubjectId },
            data: { status },
        });
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: reviewerUserId,
                action: `MARKS_${action}`,
                entityType: 'ExaminationSubject',
                entityId: examinationSubjectId,
                afterState: JSON.stringify({ status, reason }),
            },
        });
        return { updatedCount: updated.count, status };
    }
    /**
     * 3. Request Post-Publication Marks Correction
     */
    static async requestMarksCorrection(requestedByUserId, studentMarksId, requestedMarks, reason) {
        const studentMarks = await prisma_1.prisma.studentMarks.findUnique({
            where: { id: studentMarksId },
        });
        if (!studentMarks)
            throw new errorHandler_1.AppError('Student marks record not found.', 404);
        const correction = await prisma_1.prisma.marksCorrectionRequest.create({
            data: {
                studentMarksId,
                requestedByUserId,
                existingMarks: studentMarks.totalObtainedMarks,
                requestedMarks,
                reason,
                status: 'PENDING',
            },
        });
        return correction;
    }
    /**
     * 4. Review Post-Publication Marks Correction & Trigger New Result Versioning
     */
    static async reviewMarksCorrection(reviewerUserId, requestId, action) {
        const request = await prisma_1.prisma.marksCorrectionRequest.findUnique({
            where: { id: requestId },
            include: { studentMarks: true },
        });
        if (!request)
            throw new errorHandler_1.AppError('Marks correction request not found.', 404);
        const updatedRequest = await prisma_1.prisma.$transaction(async (tx) => {
            const reqUpdated = await tx.marksCorrectionRequest.update({
                where: { id: requestId },
                data: {
                    status: action,
                    reviewedByUserId: reviewerUserId,
                },
            });
            if (action === 'APPROVED') {
                // Update StudentMarks totalObtainedMarks
                await tx.studentMarks.update({
                    where: { id: request.studentMarksId },
                    data: {
                        totalObtainedMarks: request.requestedMarks,
                        status: 'VERIFIED',
                    },
                });
            }
            return reqUpdated;
        });
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: reviewerUserId,
                action: `MARKS_CORRECTION_${action}`,
                entityType: 'MarksCorrectionRequest',
                entityId: requestId,
                afterState: JSON.stringify({ action, requestedMarks: request.requestedMarks }),
            },
        });
        return updatedRequest;
    }
}
exports.MarksService = MarksService;
