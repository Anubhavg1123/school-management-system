"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoticeService = void 0;
const prisma_1 = require("../prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const types_1 = require("../types");
class NoticeService {
    /**
     * 1. Create & Publish Notice with Role-Based Audience Authorization Checks
     */
    static async createNotice(userId, activeRole, payload) {
        if (!payload.title || !payload.content || !payload.targetAudience) {
            throw new errorHandler_1.AppError('Notice title, content, and target audience are required.', 400);
        }
        // Role-based targeting authorization checks
        if (payload.targetAudience === 'ALL' || payload.noticeType === 'EMERGENCY') {
            if (activeRole !== types_1.UserRoleEnum.SUPER_ADMIN && activeRole !== types_1.UserRoleEnum.OFFICE_ADMIN) {
                throw new errorHandler_1.AppError('Authorization violation: Only Principal / Super Admin or Office Admin can issue institution-wide or emergency notices.', 403, 'FORBIDDEN_AUDIENCE_TARGETING');
            }
        }
        if (payload.targetAudience === 'DEPARTMENT' || payload.departmentId) {
            if (activeRole === types_1.UserRoleEnum.HOD) {
                const hodDept = await prisma_1.prisma.department.findFirst({ where: { hodUserId: userId } });
                if (!hodDept || (payload.departmentId && payload.departmentId !== hodDept.id)) {
                    throw new errorHandler_1.AppError('Authorization violation: HOD can only publish notices within their assigned department.', 403);
                }
            }
        }
        if (payload.targetAudience === 'CLASS' || payload.classId) {
            if (activeRole === types_1.UserRoleEnum.FACULTY) {
                const faculty = await prisma_1.prisma.faculty.findUnique({ where: { userId } });
                if (!faculty) {
                    throw new errorHandler_1.AppError('Faculty profile not found.', 404);
                }
                // Verify faculty assignment to class
                const assignment = await prisma_1.prisma.facultySubjectAssignment.findFirst({
                    where: { facultyId: faculty.id, classId: payload.classId, status: 'ACTIVE' },
                });
                if (!assignment) {
                    throw new errorHandler_1.AppError('Authorization violation: Faculty can only publish notices to assigned classes.', 403);
                }
            }
        }
        const now = new Date();
        const pubDate = payload.publishDate ? new Date(payload.publishDate) : now;
        const expDate = payload.expiryDate ? new Date(payload.expiryDate) : null;
        const isScheduled = pubDate > now;
        const initialStatus = isScheduled ? 'SCHEDULED' : 'PUBLISHED';
        const notice = await prisma_1.prisma.notice.create({
            data: {
                title: payload.title,
                content: payload.content,
                noticeType: payload.noticeType || 'GENERAL',
                priority: payload.priority || 'MEDIUM',
                publishDate: pubDate,
                expiryDate: expDate,
                createdByUserId: userId,
                targetAudience: payload.targetAudience,
                departmentId: payload.departmentId || null,
                classId: payload.classId || null,
                sectionId: payload.sectionId || null,
                targetUserId: payload.targetUserId || null,
                targetStudentId: payload.targetStudentId || null,
                attachments: payload.attachments ? JSON.stringify(payload.attachments) : null,
                status: initialStatus,
                requireAcknowledgment: payload.requireAcknowledgment || false,
            },
            include: {
                createdBy: { select: { firstName: true, lastName: true, email: true } },
                department: { select: { name: true, code: true } },
                class: { select: { name: true, code: true } },
            },
        });
        // Audit Log
        await prisma_1.prisma.auditLog.create({
            data: {
                userId,
                action: 'NOTICE_CREATED',
                entityType: 'Notice',
                entityId: notice.id,
                afterState: JSON.stringify({ title: notice.title, audience: notice.targetAudience, status: notice.status }),
            },
        });
        return notice;
    }
    /**
     * 2. Estimate Recipient Count Before Mass Notice Broadcast
     */
    static async estimateRecipientCount(targetAudience, departmentId, classId, sectionId) {
        let count = 0;
        switch (targetAudience) {
            case 'ALL':
                count = await prisma_1.prisma.user.count({ where: { status: 'ACTIVE' } });
                break;
            case 'STUDENTS':
                count = await prisma_1.prisma.student.count({ where: { status: 'ACTIVE' } });
                break;
            case 'FACULTY':
                count = await prisma_1.prisma.faculty.count({ where: { status: 'ACTIVE' } });
                break;
            case 'NON_FACULTY':
                count = await prisma_1.prisma.user.count({ where: { activeRole: 'NON_FACULTY', status: 'ACTIVE' } });
                break;
            case 'HODS':
                count = await prisma_1.prisma.department.count({ where: { hodUserId: { not: null } } });
                break;
            case 'DEPARTMENT':
                if (departmentId) {
                    count = await prisma_1.prisma.user.count({
                        where: {
                            status: 'ACTIVE',
                            OR: [
                                { studentProfile: { departmentId } },
                                { facultyProfile: { departmentId } },
                            ],
                        },
                    });
                }
                break;
            case 'CLASS':
                if (classId) {
                    count = await prisma_1.prisma.student.count({
                        where: { section: { classId }, status: 'ACTIVE' },
                    });
                }
                break;
            case 'SECTION':
                if (sectionId) {
                    count = await prisma_1.prisma.student.count({
                        where: { sectionId, status: 'ACTIVE' },
                    });
                }
                break;
            default:
                count = 1;
        }
        return { targetAudience, estimatedRecipients: count };
    }
    /**
     * 3. Retrieve Unexpired Active Notice Board for User
     */
    static async getNoticesForUser(userId, activeRole, params) {
        const now = new Date();
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                facultyProfile: true,
                studentProfile: true,
            },
        });
        if (!user) {
            throw new errorHandler_1.AppError('User not found.', 404);
        }
        const where = {
            status: 'PUBLISHED',
            publishDate: { lte: now },
            OR: [
                { expiryDate: null },
                { expiryDate: { gte: now } },
            ],
        };
        if (params?.type)
            where.noticeType = params.type;
        if (params?.search) {
            where.AND = [
                {
                    OR: [
                        { title: { contains: params.search } },
                        { content: { contains: params.search } },
                    ],
                },
            ];
        }
        const allNotices = await prisma_1.prisma.notice.findMany({
            where,
            include: {
                createdBy: { select: { firstName: true, lastName: true, email: true } },
                department: { select: { name: true } },
                class: { select: { name: true } },
                acknowledgments: { where: { userId } },
            },
            orderBy: [{ priority: 'desc' }, { publishDate: 'desc' }],
        });
        // Filter relevant notices by user role / department / class
        const userDeptId = user.facultyProfile?.departmentId || user.studentProfile?.departmentId;
        const userSectionId = user.studentProfile?.sectionId;
        return allNotices.map((n) => {
            const isAcknowledged = n.acknowledgments.length > 0;
            return {
                id: n.id,
                title: n.title,
                content: n.content,
                noticeType: n.noticeType,
                priority: n.priority,
                publishDate: n.publishDate,
                expiryDate: n.expiryDate,
                targetAudience: n.targetAudience,
                author: `${n.createdBy.firstName} ${n.createdBy.lastName}`,
                departmentName: n.department?.name,
                className: n.class?.name,
                requireAcknowledgment: n.requireAcknowledgment,
                isAcknowledged,
                attachments: n.attachments ? JSON.parse(n.attachments) : [],
            };
        });
    }
    /**
     * 4. Acknowledge Mandatory Notice
     */
    static async acknowledgeNotice(userId, noticeId, ipAddress) {
        const notice = await prisma_1.prisma.notice.findUnique({ where: { id: noticeId } });
        if (!notice) {
            throw new errorHandler_1.AppError('Notice not found.', 404);
        }
        if (!notice.requireAcknowledgment) {
            throw new errorHandler_1.AppError('This notice does not require formal acknowledgment.', 400);
        }
        const ack = await prisma_1.prisma.noticeAcknowledgment.upsert({
            where: {
                noticeId_userId: {
                    noticeId,
                    userId,
                },
            },
            update: {
                acknowledgedAt: new Date(),
                ipAddress,
            },
            create: {
                noticeId,
                userId,
                acknowledgedAt: new Date(),
                ipAddress,
            },
        });
        return ack;
    }
    /**
     * 5. Background Scheduler Worker: Auto-Publish Scheduled Notices & Auto-Expire Passed Notices
     */
    static async processScheduledAndExpiredNotices() {
        const now = new Date();
        // Publish scheduled notices whose publish date has arrived
        const published = await prisma_1.prisma.notice.updateMany({
            where: {
                status: 'SCHEDULED',
                publishDate: { lte: now },
            },
            data: { status: 'PUBLISHED' },
        });
        // Mark passed notices as EXPIRED (Preserving historical data and audit logs!)
        const expired = await prisma_1.prisma.notice.updateMany({
            where: {
                status: 'PUBLISHED',
                expiryDate: { lte: now },
            },
            data: { status: 'EXPIRED' },
        });
        return { publishedCount: published.count, expiredCount: expired.count };
    }
}
exports.NoticeService = NoticeService;
