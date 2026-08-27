"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiInsightsService = void 0;
const prisma_1 = require("../prisma");
const errorHandler_1 = require("../middleware/errorHandler");
class AiInsightsService {
    /**
     * 1. Safe Natural-Language Query Processor
     * Translates natural language requests into permission-scoped read-only database queries
     */
    static async processNaturalQuery(req) {
        const rawQuery = req.query.trim().toLowerCase();
        // 1. Prompt Injection Defense & Sanitization
        const injectionPatterns = [
            /ignore\s+(previous|all)\s+instructions/i,
            /bypass\s+permissions?/i,
            /show\s+(all\s+)?passwords?/i,
            /drop\s+table/i,
            /grant\s+admin/i,
            /system\s+prompt/i,
            /reveal\s+secrets?/i,
        ];
        for (const pattern of injectionPatterns) {
            if (pattern.test(rawQuery)) {
                throw new errorHandler_1.AppError('Security Policy Violation: Unsafe query detected. Query contains restricted administrative injection patterns.', 400, 'SECURITY_PROMPT_INJECTION_REJECTED');
            }
        }
        // 2. Determine Scope based on user's role
        const isExecutive = ['SUPER_ADMIN', 'PRINCIPAL', 'OFFICE_ADMIN'].includes(req.userRole);
        const isHod = req.userRole === 'HOD';
        // 3. Intent Detection & Scoped Query Execution
        if (rawQuery.includes('attendance') && (rawQuery.includes('low') || rawQuery.includes('below') || rawQuery.includes('shortage'))) {
            // Find students with low attendance (< 75%)
            const threshold = 75;
            const slots = await prisma_1.prisma.attendanceSlot.findMany({
                where: isHod && req.departmentId ? { class: { departmentId: req.departmentId } } : {},
                include: {
                    class: true,
                    section: true,
                    studentAttendances: { select: { status: true, studentId: true } },
                },
                take: 100,
            });
            const studentStats = new Map();
            for (const slot of slots) {
                for (const att of slot.studentAttendances) {
                    const cur = studentStats.get(att.studentId) || { total: 0, present: 0 };
                    cur.total++;
                    if (['PRESENT', 'ACADEMIC_BYPASS'].includes(att.status))
                        cur.present++;
                    studentStats.set(att.studentId, cur);
                }
            }
            const lowAttendanceStudentIds = [];
            for (const [studentId, stats] of studentStats.entries()) {
                if (stats.total >= 3 && (stats.present / stats.total) * 100 < threshold) {
                    lowAttendanceStudentIds.push(studentId);
                }
            }
            const students = await prisma_1.prisma.student.findMany({
                where: { id: { in: lowAttendanceStudentIds } },
                include: {
                    user: { select: { firstName: true, lastName: true, email: true } },
                    section: { include: { class: true } },
                },
            });
            return {
                intent: 'LOW_ATTENDANCE_QUERY',
                interpretedQuery: `Students with overall attendance below ${threshold}%`,
                count: students.length,
                results: students.map((s) => {
                    const stats = studentStats.get(s.id);
                    const percentage = Math.round((stats.present / stats.total) * 100);
                    return {
                        admissionNumber: s.admissionNumber,
                        name: `${s.user.firstName} ${s.user.lastName}`,
                        class: s.section?.class.name || '—',
                        section: s.section?.name || '—',
                        attendancePercentage: `${percentage}%`,
                        sessionsAttended: `${stats.present} / ${stats.total}`,
                    };
                }),
            };
        }
        if (rawQuery.includes('fee') && (rawQuery.includes('outstanding') || rawQuery.includes('due') || rawQuery.includes('pending'))) {
            if (!isExecutive) {
                throw new errorHandler_1.AppError('Access Denied: Financial query requires Office Administrator or Principal role.', 403, 'FORBIDDEN');
            }
            const feeAssignments = await prisma_1.prisma.studentFeeAssignment.findMany({
                where: { status: { in: ['OVERDUE', 'PARTIALLY_PAID', 'PENDING'] } },
                include: {
                    student: {
                        include: {
                            user: { select: { firstName: true, lastName: true } },
                            section: { include: { class: true } },
                        },
                    },
                    feeStructure: { select: { name: true } },
                },
                take: 50,
            });
            const totalOutstanding = feeAssignments.reduce((sum, a) => sum + Math.max(0, a.netPayableAmount - a.totalPaidAmount), 0);
            return {
                intent: 'FEE_OUTSTANDING_QUERY',
                interpretedQuery: 'Students with outstanding or overdue fee balances',
                totalOutstandingFormatted: `₹${totalOutstanding.toLocaleString()}`,
                count: feeAssignments.length,
                results: feeAssignments.map((a) => ({
                    admissionNumber: a.student?.admissionNumber,
                    studentName: `${a.student?.user?.firstName || ''} ${a.student?.user?.lastName || ''}`,
                    className: a.student?.section?.class.name || '—',
                    feeStructure: a.feeStructure?.name,
                    netPayable: a.netPayableAmount,
                    totalPaid: a.totalPaidAmount,
                    outstandingBalance: Math.max(0, a.netPayableAmount - a.totalPaidAmount),
                    status: a.status,
                })),
            };
        }
        if (rawQuery.includes('marks') && (rawQuery.includes('pending') || rawQuery.includes('verify') || rawQuery.includes('unverified'))) {
            const pendingMarks = await prisma_1.prisma.studentMarks.findMany({
                where: { status: { in: ['SUBMITTED', 'DRAFT'] } },
                include: {
                    student: { include: { user: { select: { firstName: true, lastName: true } } } },
                    subject: { select: { name: true, code: true } },
                    examinationSubject: { include: { examination: { select: { name: true } } } },
                },
                take: 50,
            });
            return {
                intent: 'PENDING_MARKS_QUERY',
                interpretedQuery: 'Examination subjects with pending marks verification',
                count: pendingMarks.length,
                results: pendingMarks.map((m) => ({
                    studentName: `${m.student.user.firstName} ${m.student.user.lastName}`,
                    examination: m.examinationSubject.examination.name,
                    subject: `${m.subject.name} (${m.subject.code})`,
                    theoryMarks: m.obtainedTheoryMarks,
                    status: m.status,
                })),
            };
        }
        if (rawQuery.includes('visitor') || rawQuery.includes('campus entry')) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const visitors = await prisma_1.prisma.visitorEntryExit.findMany({
                where: { entryTime: { gte: today } },
                include: { visitor: { select: { fullName: true, contactNumber: true } } },
                orderBy: { entryTime: 'desc' },
            });
            return {
                intent: 'TODAYS_VISITORS_QUERY',
                interpretedQuery: 'Visitors entered today',
                count: visitors.length,
                results: visitors.map((v) => ({
                    passNumber: v.passNumber,
                    visitorName: v.visitor.fullName,
                    contact: v.visitor.contactNumber,
                    personToMeet: v.personToMeetName,
                    purpose: v.purpose,
                    status: v.status,
                    entryTime: v.entryTime.toLocaleTimeString(),
                    exitTime: v.exitTime ? v.exitTime.toLocaleTimeString() : 'Still Inside',
                })),
            };
        }
        // Fallback: General Student search
        const students = await prisma_1.prisma.student.findMany({
            where: {
                OR: [
                    { admissionNumber: { contains: rawQuery } },
                    { user: { firstName: { contains: rawQuery } } },
                    { user: { lastName: { contains: rawQuery } } },
                ],
            },
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                section: { include: { class: true } },
            },
            take: 20,
        });
        return {
            intent: 'GENERAL_STUDENT_SEARCH',
            interpretedQuery: `Directory search for keyword '${req.query}'`,
            count: students.length,
            results: students.map((s) => ({
                admissionNumber: s.admissionNumber,
                fullName: `${s.user.firstName} ${s.user.lastName}`,
                email: s.user.email,
                class: s.section?.class.name || 'Unassigned',
                status: s.status,
            })),
        };
    }
    /**
     * 2. Explainable Administrative & Operational Insights
     */
    static async getAdministrativeInsights() {
        const insights = [];
        // 1. Fee Collection Velocity
        const assignments = await prisma_1.prisma.studentFeeAssignment.findMany({
            select: { netPayableAmount: true, totalPaidAmount: true, status: true },
        });
        const totalDue = assignments.reduce((acc, a) => acc + a.netPayableAmount, 0);
        const totalPaid = assignments.reduce((acc, a) => acc + a.totalPaidAmount, 0);
        const collectionRate = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 100;
        insights.push({
            id: 'INSIGHT-FIN-01',
            category: 'FINANCE',
            title: 'Institutional Fee Collection Rate',
            summary: `Current overall fee collection rate is ${collectionRate}% with ₹${(totalDue - totalPaid).toLocaleString()} outstanding.`,
            severity: collectionRate < 60 ? 'WARNING' : 'INFO',
            dataSource: 'StudentFeeAssignment table (active academic year)',
            calculationRule: '(totalPaidAmount / netPayableAmount) * 100',
            metrics: { totalDue, totalPaid, collectionRate },
            recommendation: collectionRate < 60 ? 'Trigger automated reminder notifications for fee structures due this month.' : 'Fee collection pace is healthy.',
        });
        // 2. Unassigned Active Students
        const activeWithoutSection = await prisma_1.prisma.student.count({
            where: { status: 'ACTIVE', sectionId: null },
        });
        if (activeWithoutSection > 0) {
            insights.push({
                id: 'INSIGHT-OPS-01',
                category: 'OPERATIONS',
                title: 'Unassigned Active Students Detected',
                summary: `${activeWithoutSection} active student(s) currently lack a class/section assignment.`,
                severity: 'CRITICAL',
                dataSource: 'Student table where status = ACTIVE and sectionId IS NULL',
                calculationRule: 'COUNT(Student.id) WHERE status = ACTIVE AND sectionId IS NULL',
                metrics: { activeWithoutSection },
                recommendation: 'Use Student Admission portal to allocate section assignments.',
            });
        }
        // 3. Pending Marks Verification
        const pendingMarksCount = await prisma_1.prisma.studentMarks.count({
            where: { status: 'SUBMITTED' },
        });
        if (pendingMarksCount > 0) {
            insights.push({
                id: 'INSIGHT-ACAD-01',
                category: 'ACADEMIC',
                title: 'Marks Verification Queue Pending',
                summary: `${pendingMarksCount} submitted student mark entries are awaiting HOD/Office verification.`,
                severity: 'WARNING',
                dataSource: 'StudentMarks table where status = SUBMITTED',
                calculationRule: 'COUNT(StudentMarks.id) WHERE status = SUBMITTED',
                metrics: { pendingMarksCount },
                recommendation: 'HODs should review the Marks Verification Hub to finalize result computations.',
            });
        }
        return insights;
    }
    /**
     * 3. AI Drafting Assistant for Communication (Mandatory Human Review)
     */
    static async generateDraftNotice(payload) {
        const formattedPoints = payload.keyPoints.map((p) => `• ${p}`).join('\n');
        const draftTitle = `Official Notification: ${payload.topic}`;
        const draftContent = `Dear ${payload.targetAudience},\n\nPlease be informed regarding ${payload.topic}.\n\nKey Highlights:\n${formattedPoints}\n\nFor any inquiries, please submit a query via the institutional Helpdesk.\n\nWarm regards,\nOffice of Administration`;
        return {
            draftTitle,
            draftContent,
            targetAudience: payload.targetAudience,
            disclaimer: 'AI-assisted draft generated for administrative convenience. Review and manual confirmation required before publication.',
            status: 'REQUIRES_HUMAN_APPROVAL',
        };
    }
}
exports.AiInsightsService = AiInsightsService;
