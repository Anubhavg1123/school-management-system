"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HodPortalService = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const audit_service_1 = require("./audit.service");
const prisma = new client_1.PrismaClient();
class HodPortalService {
    /**
     * Core Security Helper: Resolves authenticated HOD's assigned department.
     * If requestedDepartmentId is passed, verifies that the user is authorized (SUPER_ADMIN or assigned HOD).
     * Throws 403 Forbidden if HOD attempts cross-department access.
     */
    static async getHodDepartment(userId, requestedDeptId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                userRoles: {
                    include: { role: true },
                },
            },
        });
        if (!user) {
            throw new errorHandler_1.AppError('Authenticated user record not found.', 404);
        }
        const isSuperAdmin = user.activeRole === 'SUPER_ADMIN' || user.userRoles.some((ur) => ur.role.name === 'SUPER_ADMIN');
        // Find department where user is designated HOD
        let assignedDept = await prisma.department.findFirst({
            where: { hodUserId: userId },
        });
        // Fallback: check UserRole.departmentId
        if (!assignedDept) {
            const hodRole = user.userRoles.find((ur) => ur.role.name === 'HOD' && ur.departmentId);
            if (hodRole && hodRole.departmentId) {
                assignedDept = await prisma.department.findUnique({
                    where: { id: hodRole.departmentId },
                });
            }
        }
        if (!assignedDept && !isSuperAdmin) {
            throw new errorHandler_1.AppError('Access Denied: You are not assigned as HOD for any department.', 403);
        }
        // Super Admin override or requested department verification
        if (requestedDeptId) {
            if (!isSuperAdmin && assignedDept && assignedDept.id !== requestedDeptId) {
                throw new errorHandler_1.AppError('Access Denied: You are not authorized to manage resources outside your assigned department.', 403);
            }
            const targetDept = await prisma.department.findUnique({ where: { id: requestedDeptId } });
            if (!targetDept)
                throw new errorHandler_1.AppError('Requested department not found.', 404);
            return targetDept;
        }
        if (!assignedDept) {
            // Super admin without explicit requested Dept -> default to first active department
            const defaultDept = await prisma.department.findFirst({ where: { status: 'ACTIVE' } });
            if (!defaultDept)
                throw new errorHandler_1.AppError('No active department found.', 404);
            return defaultDept;
        }
        return assignedDept;
    }
    /**
     * 1. HOD DASHBOARD - Computes real department metrics from database
     */
    static async getHodDashboard(userId, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const currentDay = dayNames[new Date().getDay()];
        const activeAcademicYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
        const academicYearId = activeAcademicYear?.id;
        // Faculty in department & user IDs
        const deptFacultyList = await prisma.faculty.findMany({ where: { departmentId: dept.id } });
        const totalFaculty = deptFacultyList.length;
        const activeFaculty = deptFacultyList.filter((f) => f.status === 'ACTIVE').length;
        const deptFacultyUserIds = deptFacultyList.map((f) => f.userId);
        // Faculty on leave today
        const activeLeaves = await prisma.facultyLeave.findMany({
            where: {
                userId: { in: deptFacultyUserIds },
                status: 'APPROVED',
                startDate: { lte: new Date() },
                endDate: { gte: new Date() },
            },
            include: { user: true },
        });
        // Students & Classes
        const totalStudents = await prisma.student.count({ where: { departmentId: dept.id, status: 'ACTIVE' } });
        const departmentClasses = await prisma.class.findMany({
            where: { departmentId: dept.id, ...(academicYearId ? { academicYearId } : {}) },
            include: { sections: true },
        });
        const totalSections = departmentClasses.reduce((acc, cls) => acc + cls.sections.length, 0);
        const subjects = await prisma.subject.findMany({ where: { departmentId: dept.id } });
        // Today's Timetable Schedule for Department
        const todayTimetable = await prisma.timetableEntry.findMany({
            where: {
                departmentId: dept.id,
                dayOfWeek: currentDay,
                status: 'ACTIVE',
            },
            include: {
                class: true,
                section: true,
                subject: true,
                faculty: { include: { user: true } },
                room: true,
                timeSlot: true,
            },
            orderBy: { timeSlot: { periodNumber: 'asc' } },
        });
        // Pending Approvals in Department
        const pendingFacultyLeaves = await prisma.facultyLeave.findMany({
            where: {
                userId: { in: deptFacultyUserIds },
                status: 'PENDING',
            },
            include: { user: true },
            orderBy: { createdAt: 'desc' },
        });
        const pendingAttendanceCorrections = await prisma.studentAttendanceCorrection.findMany({
            where: {
                studentAttendance: { student: { departmentId: dept.id } },
                status: 'PENDING',
            },
            include: {
                studentAttendance: {
                    include: { student: { include: { user: true } }, attendanceSlot: { include: { subject: true } } },
                },
                requestedBy: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        const pendingExtraClasses = await prisma.extraClassRequest.findMany({
            where: {
                class: { departmentId: dept.id },
                status: 'PENDING',
            },
            include: {
                class: true,
                section: true,
                subject: true,
                faculty: { include: { user: true } },
                room: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        // Low Attendance Students Count (<75%)
        const allStudentsInDept = await prisma.student.findMany({
            where: { departmentId: dept.id, status: 'ACTIVE' },
            include: { studentAttendances: { select: { status: true } } },
        });
        let lowAttendanceStudentCount = 0;
        allStudentsInDept.forEach((std) => {
            const total = std.studentAttendances.length;
            if (total > 0) {
                const present = std.studentAttendances.filter((a) => a.status === 'PRESENT' || a.status === 'ACADEMIC_BYPASS').length;
                if (Math.round((present / total) * 100) < 75) {
                    lowAttendanceStudentCount++;
                }
            }
        });
        // Department Notices
        const departmentNotices = await prisma.departmentNotice.findMany({
            where: { departmentId: dept.id },
            include: { createdBy: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });
        return {
            department: {
                id: dept.id,
                name: dept.name,
                code: dept.code,
                status: dept.status,
            },
            academicYear: activeAcademicYear?.name || 'Not Configured',
            metrics: {
                totalFaculty,
                activeFaculty,
                facultyOnLeaveCount: activeLeaves.length,
                totalStudents,
                activeClassesCount: departmentClasses.length,
                totalSections,
                totalSubjectsCount: subjects.length,
                todayClassesCount: todayTimetable.length,
                pendingLeavesCount: pendingFacultyLeaves.length,
                pendingCorrectionsCount: pendingAttendanceCorrections.length,
                pendingExtraClassesCount: pendingExtraClasses.length,
                lowAttendanceStudentCount,
            },
            facultyOnLeaveToday: activeLeaves.map((l) => ({
                leaveId: l.id,
                facultyName: `${l.user.firstName} ${l.user.lastName}`,
                leaveType: l.leaveType,
            })),
            todaySchedule: todayTimetable.map((t) => ({
                id: t.id,
                className: t.class.name,
                sectionName: t.section.name,
                subjectName: t.subject.name,
                facultyName: `${t.faculty.user.firstName} ${t.faculty.user.lastName}`,
                room: t.room.roomNumber,
                period: t.timeSlot.name,
                startTime: t.timeSlot.startTime,
                endTime: t.timeSlot.endTime,
            })),
            pendingApprovals: {
                leaves: pendingFacultyLeaves.map((l) => ({
                    ...l,
                    facultyName: `${l.user.firstName} ${l.user.lastName}`,
                })),
                corrections: pendingAttendanceCorrections,
                extraClasses: pendingExtraClasses,
            },
            recentNotices: departmentNotices,
        };
    }
    /**
     * 2. DEPARTMENT PROFILE - View & Update department profile
     */
    static async getDepartmentProfile(userId, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        const hodUser = dept.hodUserId
            ? await prisma.user.findUnique({ where: { id: dept.hodUserId } })
            : null;
        const facultyCount = await prisma.faculty.count({ where: { departmentId: dept.id } });
        const studentCount = await prisma.student.count({ where: { departmentId: dept.id, status: 'ACTIVE' } });
        const classCount = await prisma.class.count({ where: { departmentId: dept.id } });
        const subjectCount = await prisma.subject.count({ where: { departmentId: dept.id } });
        const hodHistory = await prisma.departmentHodHistory.findMany({
            where: { departmentId: dept.id },
            include: { hod: true, assignedBy: true },
            orderBy: { createdAt: 'desc' },
        });
        return {
            id: dept.id,
            code: dept.code,
            name: dept.name,
            description: dept.description,
            status: dept.status,
            createdAt: dept.createdAt,
            hod: hodUser
                ? {
                    userId: hodUser.id,
                    name: `${hodUser.firstName} ${hodUser.lastName}`,
                    email: hodUser.email,
                    phone: hodUser.phone,
                }
                : null,
            counts: {
                facultyCount,
                studentCount,
                classCount,
                subjectCount,
            },
            hodHistory: hodHistory.map((h) => ({
                id: h.id,
                hodName: `${h.hod.firstName} ${h.hod.lastName}`,
                assignedBy: h.assignedBy ? `${h.assignedBy.firstName} ${h.assignedBy.lastName}` : 'System',
                startDate: h.startDate,
                endDate: h.endDate,
                status: h.status,
            })),
        };
    }
    static async updateDepartmentProfile(userId, payload, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        const updated = await prisma.department.update({
            where: { id: dept.id },
            data: {
                description: payload.description ?? undefined,
                status: payload.status ?? undefined,
            },
        });
        await audit_service_1.AuditService.log({
            userId,
            action: 'DEPARTMENT_PROFILE_UPDATED',
            entityType: 'Department',
            entityId: dept.id,
            afterState: payload,
        });
        return updated;
    }
    /**
     * 3. DEPARTMENT FACULTY MANAGEMENT - Scoped faculty list with search & pagination
     */
    static async getDepartmentFaculty(userId, query, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        const page = query?.page || 1;
        const limit = query?.limit || 25;
        const skip = (page - 1) * limit;
        const where = { departmentId: dept.id };
        if (query?.status)
            where.status = query.status;
        if (query?.search) {
            where.OR = [
                { employeeCode: { contains: query.search } },
                { user: { firstName: { contains: query.search } } },
                { user: { lastName: { contains: query.search } } },
                { user: { email: { contains: query.search } } },
            ];
        }
        const [facultyList, total] = await Promise.all([
            prisma.faculty.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: true,
                    subjectAssignments: {
                        where: { status: 'ACTIVE' },
                        include: { class: true, section: true, subject: true },
                    },
                    coordinatorHistories: {
                        where: { status: 'ACTIVE' },
                        include: { section: { include: { class: true } } },
                    },
                },
                orderBy: { employeeCode: 'asc' },
            }),
            prisma.faculty.count({ where }),
        ]);
        return {
            faculty: facultyList.map((f) => ({
                id: f.id,
                userId: f.userId,
                employeeCode: f.employeeCode,
                firstName: f.user.firstName,
                lastName: f.user.lastName,
                email: f.user.email,
                phone: f.user.phone,
                whatsAppNumber: f.user.whatsAppNumber,
                designation: f.designation,
                status: f.status,
                isHod: f.isHod,
                isCoordinator: f.coordinatorHistories.length > 0,
                coordinatorSection: f.coordinatorHistories[0]
                    ? `${f.coordinatorHistories[0].section.class.name} - ${f.coordinatorHistories[0].section.name}`
                    : null,
                assignedSubjectsCount: f.subjectAssignments.length,
                assignedSubjects: f.subjectAssignments.map((sa) => ({
                    subjectName: sa.subject.name,
                    subjectCode: sa.subject.code,
                    className: sa.class.name,
                    sectionName: sa.section?.name || 'All',
                })),
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * 4. FACULTY PROFILE FOR HOD - Detailed academic & operational view
     */
    static async getFacultyProfileForHod(userId, facultyId, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        const faculty = await prisma.faculty.findFirst({
            where: { id: facultyId, departmentId: dept.id },
            include: {
                user: true,
                department: true,
                subjectAssignments: {
                    include: { class: true, section: true, subject: true },
                },
                coordinatorHistories: {
                    include: { section: { include: { class: true } } },
                },
                timetableEntries: {
                    where: { status: 'ACTIVE' },
                    include: { class: true, section: true, subject: true, room: true, timeSlot: true },
                },
                extraClasses: {
                    include: { class: true, section: true, subject: true, room: true },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
                substituteAssignments: {
                    include: { class: true, section: true, subject: true, timeSlot: true },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });
        if (!faculty) {
            throw new errorHandler_1.AppError('Faculty record not found or does not belong to your department.', 404);
        }
        const leaves = await prisma.facultyLeave.findMany({
            where: { userId: faculty.userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        return {
            facultyId: faculty.id,
            userId: faculty.userId,
            employeeCode: faculty.employeeCode,
            firstName: faculty.user.firstName,
            lastName: faculty.user.lastName,
            email: faculty.user.email,
            phone: faculty.user.phone,
            whatsAppNumber: faculty.user.whatsAppNumber,
            designation: faculty.designation,
            joiningDate: faculty.joiningDate,
            status: faculty.status,
            isHod: faculty.isHod,
            subjectAssignments: faculty.subjectAssignments,
            coordinatorHistories: faculty.coordinatorHistories,
            weeklyPeriodCount: faculty.timetableEntries.length,
            timetable: faculty.timetableEntries,
            recentExtraClasses: faculty.extraClasses,
            substituteDuties: faculty.substituteAssignments,
            leaveHistory: leaves,
        };
    }
    /**
     * 5. ASSIGN FACULTY SUBJECT & CLASS SECTION
     */
    static async assignFacultySubject(userId, payload, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        // Verify Faculty belongs to Department
        const faculty = await prisma.faculty.findFirst({
            where: { id: payload.facultyId, departmentId: dept.id, status: 'ACTIVE' },
        });
        if (!faculty) {
            throw new errorHandler_1.AppError('Faculty must be an active member of your department.', 400);
        }
        // Verify Class belongs to Department
        const cls = await prisma.class.findFirst({
            where: { id: payload.classId, departmentId: dept.id },
        });
        if (!cls) {
            throw new errorHandler_1.AppError('Class does not belong to your department.', 400);
        }
        // Verify Subject
        const subject = await prisma.subject.findUnique({ where: { id: payload.subjectId } });
        if (!subject)
            throw new errorHandler_1.AppError('Subject not found.', 404);
        let academicYearId = payload.academicYearId;
        if (!academicYearId) {
            const activeYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
            if (!activeYear)
                throw new errorHandler_1.AppError('No active academic year configured.', 400);
            academicYearId = activeYear.id;
        }
        const assignment = await prisma.facultySubjectAssignment.create({
            data: {
                academicYearId,
                facultyId: payload.facultyId,
                classId: payload.classId,
                sectionId: payload.sectionId || undefined,
                subjectId: payload.subjectId,
                status: 'ACTIVE',
            },
            include: {
                faculty: { include: { user: true } },
                class: true,
                section: true,
                subject: true,
            },
        });
        await audit_service_1.AuditService.log({
            userId,
            action: 'FACULTY_SUBJECT_ASSIGNED',
            entityType: 'FacultySubjectAssignment',
            entityId: assignment.id,
            afterState: { facultyId: payload.facultyId, subjectId: payload.subjectId, classId: payload.classId },
        });
        return assignment;
    }
    /**
     * 6. FACULTY WORKLOAD MANAGEMENT - Department-wide workload summary
     */
    static async getFacultyWorkloadSummary(userId, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        const facultyList = await prisma.faculty.findMany({
            where: { departmentId: dept.id, status: 'ACTIVE' },
            include: {
                user: true,
                subjectAssignments: {
                    where: { status: 'ACTIVE' },
                    include: { class: true, section: true, subject: true },
                },
                timetableEntries: { where: { status: 'ACTIVE' } },
                coordinatorHistories: {
                    where: { status: 'ACTIVE' },
                    include: { section: { include: { class: true } } },
                },
                extraClasses: { where: { status: 'APPROVED' } },
                substituteAssignments: { where: { status: 'CONFIRMED' } },
            },
        });
        return facultyList.map((f) => {
            const weeklyPeriodCount = f.timetableEntries.length;
            return {
                facultyId: f.id,
                employeeCode: f.employeeCode,
                facultyName: `${f.user.firstName} ${f.user.lastName}`,
                designation: f.designation,
                assignedCoursesCount: f.subjectAssignments.length,
                weeklyPeriodCount,
                approvedExtraClassesCount: f.extraClasses.length,
                substituteLecturesCount: f.substituteAssignments.length,
                isCoordinator: f.coordinatorHistories.length > 0,
                coordinatorSection: f.coordinatorHistories[0]
                    ? `${f.coordinatorHistories[0].section.class.name} - ${f.coordinatorHistories[0].section.name}`
                    : null,
                workloadStatus: weeklyPeriodCount < 10 ? 'UNDER_UTILIZED' : weeklyPeriodCount > 25 ? 'HIGH_WORKLOAD' : 'BALANCED',
            };
        });
    }
    /**
     * 7. DEPARTMENT CLASS & CLASS COORDINATOR MANAGEMENT
     */
    static async getDepartmentClasses(userId, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        const classes = await prisma.class.findMany({
            where: { departmentId: dept.id },
            include: {
                academicYear: true,
                sections: {
                    include: {
                        students: { select: { id: true } },
                        coordinatorHistories: {
                            where: { status: 'ACTIVE' },
                            include: { faculty: { include: { user: true } } },
                        },
                    },
                },
                classSubjects: { include: { subject: true } },
            },
            orderBy: { code: 'asc' },
        });
        return classes.map((c) => ({
            id: c.id,
            name: c.name,
            code: c.code,
            academicYear: c.academicYear.name,
            sections: c.sections.map((s) => ({
                id: s.id,
                name: s.name,
                capacity: s.capacity,
                studentCount: s.students.length,
                coordinator: s.coordinatorHistories[0]
                    ? {
                        historyId: s.coordinatorHistories[0].id,
                        facultyId: s.coordinatorHistories[0].faculty.id,
                        name: `${s.coordinatorHistories[0].faculty.user.firstName} ${s.coordinatorHistories[0].faculty.user.lastName}`,
                        email: s.coordinatorHistories[0].faculty.user.email,
                    }
                    : null,
                whatsAppGroupStatus: s.whatsAppGroupStatus || 'UNCONFIGURED',
                whatsAppGroupId: s.whatsAppGroupId || null,
            })),
            subjectCount: c.classSubjects.length,
        }));
    }
    static async assignClassCoordinator(userId, sectionId, facultyId, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        const section = await prisma.section.findUnique({
            where: { id: sectionId },
            include: { class: true },
        });
        if (!section || section.class.departmentId !== dept.id) {
            throw new errorHandler_1.AppError('Class section not found or does not belong to your department.', 403);
        }
        const faculty = await prisma.faculty.findFirst({
            where: { id: facultyId, departmentId: dept.id, status: 'ACTIVE' },
        });
        if (!faculty) {
            throw new errorHandler_1.AppError('Faculty must be an active member of your department.', 400);
        }
        const activeYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
        if (!activeYear)
            throw new errorHandler_1.AppError('No active academic year configured.', 400);
        const result = await prisma.$transaction(async (tx) => {
            // 1. Deactivate existing coordinator histories for section
            await tx.classCoordinatorHistory.updateMany({
                where: { sectionId, status: 'ACTIVE' },
                data: { status: 'PAST', endDate: new Date() },
            });
            // 2. Create new coordinator history
            const history = await tx.classCoordinatorHistory.create({
                data: {
                    sectionId,
                    facultyId,
                    academicYearId: activeYear.id,
                    assignedByUserId: userId,
                    status: 'ACTIVE',
                },
            });
            // 3. Update Section model coordinator reference
            await tx.section.update({
                where: { id: sectionId },
                data: { coordinatorFacultyId: facultyId },
            });
            return history;
        });
        await audit_service_1.AuditService.log({
            userId,
            action: 'CLASS_COORDINATOR_ASSIGNED',
            entityType: 'ClassCoordinatorHistory',
            entityId: result.id,
            afterState: { sectionId, facultyId },
        });
        return result;
    }
    /**
     * 8. DEPARTMENT STUDENT MANAGEMENT & LOW ATTENDANCE DASHBOARD
     */
    static async getDepartmentStudents(userId, query, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        const page = query?.page || 1;
        const limit = query?.limit || 25;
        const skip = (page - 1) * limit;
        const where = { departmentId: dept.id, status: 'ACTIVE' };
        if (query?.classId)
            where.section = { classId: query.classId };
        if (query?.sectionId)
            where.sectionId = query.sectionId;
        if (query?.search) {
            where.OR = [
                { admissionNumber: { contains: query.search } },
                { rollNumber: { contains: query.search } },
                { user: { firstName: { contains: query.search } } },
                { user: { lastName: { contains: query.search } } },
            ];
        }
        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: true,
                    section: { include: { class: true } },
                    studentAttendances: { select: { status: true } },
                },
                orderBy: { rollNumber: 'asc' },
            }),
            prisma.student.count({ where }),
        ]);
        return {
            students: students.map((s) => {
                const totalA = s.studentAttendances.length;
                const present = s.studentAttendances.filter((a) => a.status === 'PRESENT' || a.status === 'ACADEMIC_BYPASS').length;
                const attendancePercentage = totalA > 0 ? Math.round((present / totalA) * 100) : 100;
                return {
                    id: s.id,
                    userId: s.userId,
                    admissionNumber: s.admissionNumber,
                    rollNumber: s.rollNumber,
                    firstName: s.user.firstName,
                    lastName: s.user.lastName,
                    email: s.user.email,
                    phone: s.user.phone,
                    className: s.section?.class.name,
                    sectionName: s.section?.name,
                    attendancePercentage,
                    isLowAttendance: attendancePercentage < 75,
                    status: s.status,
                };
            }),
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    static async getLowAttendanceDashboard(userId, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        const students = await prisma.student.findMany({
            where: { departmentId: dept.id, status: 'ACTIVE' },
            include: {
                user: true,
                section: { include: { class: true } },
                studentAttendances: {
                    include: { attendanceSlot: { include: { subject: true } } },
                },
            },
        });
        const lowAttendanceList = [];
        students.forEach((s) => {
            const total = s.studentAttendances.length;
            if (total > 0) {
                const present = s.studentAttendances.filter((a) => a.status === 'PRESENT' || a.status === 'ACADEMIC_BYPASS').length;
                const absent = s.studentAttendances.filter((a) => a.status === 'ABSENT').length;
                const percentage = Math.round((present / total) * 100);
                if (percentage < 75) {
                    lowAttendanceList.push({
                        studentId: s.id,
                        admissionNumber: s.admissionNumber,
                        rollNumber: s.rollNumber,
                        studentName: `${s.user.firstName} ${s.user.lastName}`,
                        email: s.user.email,
                        phone: s.user.phone,
                        className: s.section?.class.name,
                        sectionName: s.section?.name,
                        totalSessions: total,
                        presentCount: present,
                        absentCount: absent,
                        attendancePercentage: percentage,
                    });
                }
            }
        });
        return lowAttendanceList.sort((a, b) => a.attendancePercentage - b.attendancePercentage);
    }
    /**
     * 9. ATTENDANCE CORRECTION & ACADEMIC BYPASS APPROVALS
     */
    static async getDepartmentCorrections(userId, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        return prisma.studentAttendanceCorrection.findMany({
            where: {
                studentAttendance: { student: { departmentId: dept.id } },
            },
            include: {
                studentAttendance: {
                    include: {
                        student: { include: { user: true } },
                        attendanceSlot: { include: { subject: true, class: true, section: true } },
                    },
                },
                requestedBy: true,
                reviewedBy: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async reviewCorrection(userId, correctionId, action, reviewNotes, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        const correction = await prisma.studentAttendanceCorrection.findUnique({
            where: { id: correctionId },
            include: { studentAttendance: { include: { student: true } } },
        });
        if (!correction || correction.studentAttendance.student.departmentId !== dept.id) {
            throw new errorHandler_1.AppError('Correction request not found or does not belong to your department.', 403);
        }
        const updatedCorrection = await prisma.$transaction(async (tx) => {
            const updated = await tx.studentAttendanceCorrection.update({
                where: { id: correctionId },
                data: {
                    status: action,
                    reviewedByUserId: userId,
                    reviewedAt: new Date(),
                    reviewNotes: reviewNotes || undefined,
                },
            });
            if (action === 'APPROVED') {
                await tx.studentAttendance.update({
                    where: { id: correction.studentAttendanceId },
                    data: { status: correction.proposedStatus },
                });
            }
            return updated;
        });
        await audit_service_1.AuditService.log({
            userId,
            action: `ATTENDANCE_CORRECTION_${action}`,
            entityType: 'StudentAttendanceCorrection',
            entityId: correctionId,
            afterState: { action, reviewNotes },
        });
        return updatedCorrection;
    }
    static async getDepartmentBypasses(userId, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        return prisma.academicBypassRequest.findMany({
            where: {
                student: { departmentId: dept.id },
            },
            include: {
                student: { include: { user: true } },
                attendanceSlot: { include: { class: true, section: true } },
                requestedBy: true,
                approvedBy: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async reviewBypass(userId, bypassId, action, notes, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        const bypass = await prisma.academicBypassRequest.findUnique({
            where: { id: bypassId },
            include: { student: true },
        });
        if (!bypass || bypass.student.departmentId !== dept.id) {
            throw new errorHandler_1.AppError('Academic bypass request not found or does not belong to your department.', 403);
        }
        const updated = await prisma.academicBypassRequest.update({
            where: { id: bypassId },
            data: {
                status: action,
                approvedByUserId: userId,
            },
        });
        await audit_service_1.AuditService.log({
            userId,
            action: `ACADEMIC_BYPASS_${action}`,
            entityType: 'AcademicBypassRequest',
            entityId: bypassId,
            afterState: { action, notes },
        });
        return updated;
    }
    /**
     * 10. FACULTY LEAVE MANAGEMENT & LEAVE-TIMETABLE INTEGRATION
     */
    static async getDepartmentLeaves(userId, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        const deptFacultyUserIds = (await prisma.faculty.findMany({ where: { departmentId: dept.id }, select: { userId: true } })).map((f) => f.userId);
        return prisma.facultyLeave.findMany({
            where: { userId: { in: deptFacultyUserIds } },
            include: {
                user: true,
                reviewedBy: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async reviewFacultyLeave(userId, leaveId, action, reviewNotes, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        const deptFacultyUserIds = (await prisma.faculty.findMany({ where: { departmentId: dept.id }, select: { userId: true } })).map((f) => f.userId);
        const leave = await prisma.facultyLeave.findUnique({
            where: { id: leaveId },
            include: { user: true },
        });
        if (!leave || !deptFacultyUserIds.includes(leave.userId)) {
            throw new errorHandler_1.AppError('Faculty leave request not found or does not belong to your department.', 403);
        }
        const updatedLeave = await prisma.facultyLeave.update({
            where: { id: leaveId },
            data: {
                status: action,
                reviewedByUserId: userId,
                reviewedAt: new Date(),
                rejectionReason: action === 'REJECTED' ? reviewNotes || undefined : undefined,
            },
        });
        // Timetable Impact Analysis if Approved
        let affectedSessions = [];
        if (action === 'APPROVED') {
            const faculty = await prisma.faculty.findFirst({ where: { userId: leave.userId } });
            if (faculty) {
                const timetableEntries = await prisma.timetableEntry.findMany({
                    where: {
                        facultyId: faculty.id,
                        status: 'ACTIVE',
                    },
                    include: { class: true, section: true, subject: true, timeSlot: true, room: true },
                });
                affectedSessions = timetableEntries;
            }
        }
        await audit_service_1.AuditService.log({
            userId,
            action: `FACULTY_LEAVE_${action}`,
            entityType: 'FacultyLeave',
            entityId: leaveId,
            afterState: { action, affectedSessionsCount: affectedSessions.length },
        });
        return {
            leave: updatedLeave,
            affectedTimetableSessions: affectedSessions.map((t) => ({
                dayOfWeek: t.dayOfWeek,
                periodName: t.timeSlot.name,
                className: t.class.name,
                sectionName: t.section.name,
                subjectName: t.subject.name,
                room: t.room.roomNumber,
            })),
            warning: affectedSessions.length > 0 ? 'Warning: Faculty leave approved. Substitute faculty must be assigned for affected timetable sessions.' : null,
        };
    }
    /**
     * 11. SUBSTITUTE FACULTY ASSIGNMENT
     */
    static async assignSubstituteFaculty(userId, payload, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        // Verify original & substitute faculty belong to active department
        const subFaculty = await prisma.faculty.findFirst({
            where: { id: payload.substituteFacultyId, status: 'ACTIVE' },
        });
        if (!subFaculty) {
            throw new errorHandler_1.AppError('Substitute faculty is not active or available.', 400);
        }
        // Check conflict: substitute on leave
        const leaveConflict = await prisma.facultyLeave.findFirst({
            where: {
                userId: subFaculty.userId,
                status: 'APPROVED',
                startDate: { lte: new Date(payload.date) },
                endDate: { gte: new Date(payload.date) },
            },
        });
        if (leaveConflict) {
            throw new errorHandler_1.AppError('Substitute faculty is on approved leave on this date.', 409);
        }
        // Check conflict: substitute already teaching at this time slot
        const subConflict = await prisma.timetableEntry.findFirst({
            where: {
                facultyId: payload.substituteFacultyId,
                timeSlotId: payload.timeSlotId,
                status: 'ACTIVE',
            },
        });
        if (subConflict) {
            throw new errorHandler_1.AppError('Substitute faculty already has another class scheduled at this time slot.', 409);
        }
        const substitute = await prisma.substituteFacultyAssignment.create({
            data: {
                originalFacultyId: payload.originalFacultyId,
                substituteFacultyId: payload.substituteFacultyId,
                classId: payload.classId,
                sectionId: payload.sectionId,
                subjectId: payload.subjectId,
                timeSlotId: payload.timeSlotId,
                date: payload.date,
                reason: payload.reason,
                assignedByUserId: userId,
                status: 'CONFIRMED',
            },
            include: {
                originalFaculty: { include: { user: true } },
                substituteFaculty: { include: { user: true } },
                class: true,
                section: true,
                subject: true,
                timeSlot: true,
            },
        });
        await audit_service_1.AuditService.log({
            userId,
            action: 'SUBSTITUTE_FACULTY_ASSIGNED',
            entityType: 'SubstituteFacultyAssignment',
            entityId: substitute.id,
            afterState: { substituteFacultyId: payload.substituteFacultyId, date: payload.date },
        });
        return substitute;
    }
    /**
     * 12. EXTRA CLASS MANAGEMENT
     */
    static async getDepartmentExtraClasses(userId, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        return prisma.extraClassRequest.findMany({
            where: { class: { departmentId: dept.id } },
            include: {
                class: true,
                section: true,
                subject: true,
                faculty: { include: { user: true } },
                room: true,
                reviewedBy: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async reviewExtraClass(userId, requestId, action, reviewNotes, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        const extra = await prisma.extraClassRequest.findUnique({
            where: { id: requestId },
            include: { class: true },
        });
        if (!extra || extra.class.departmentId !== dept.id) {
            throw new errorHandler_1.AppError('Extra class request not found or does not belong to your department.', 403);
        }
        const updated = await prisma.extraClassRequest.update({
            where: { id: requestId },
            data: {
                status: action,
                reviewedByUserId: userId,
                reviewedAt: new Date(),
                reviewNotes: reviewNotes || undefined,
            },
        });
        await audit_service_1.AuditService.log({
            userId,
            action: `EXTRA_CLASS_${action}`,
            entityType: 'ExtraClassRequest',
            entityId: requestId,
            afterState: { action, reviewNotes },
        });
        return updated;
    }
    /**
     * 13. DEPARTMENT TIMETABLE MANAGEMENT & CONFLICT ENGINE
     */
    static async getDepartmentTimetable(userId, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        return prisma.timetableEntry.findMany({
            where: { departmentId: dept.id, status: 'ACTIVE' },
            include: {
                class: true,
                section: true,
                subject: true,
                faculty: { include: { user: true } },
                room: true,
                timeSlot: true,
            },
            orderBy: [{ dayOfWeek: 'asc' }, { timeSlot: { periodNumber: 'asc' } }],
        });
    }
    static async createTimetableEntry(userId, payload, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        const activeYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
        if (!activeYear)
            throw new errorHandler_1.AppError('No active academic year configured.', 400);
        // 5-Way Conflict Detection
        // 1. Faculty Conflict
        const facConflict = await prisma.timetableEntry.findFirst({
            where: {
                facultyId: payload.facultyId,
                dayOfWeek: payload.dayOfWeek,
                timeSlotId: payload.timeSlotId,
                status: 'ACTIVE',
            },
            include: { faculty: { include: { user: true } } },
        });
        if (facConflict) {
            throw new errorHandler_1.AppError(`Conflict: Faculty ${facConflict.faculty.user.firstName} ${facConflict.faculty.user.lastName} is already assigned at this time.`, 409);
        }
        // 2. Room Conflict
        const roomConflict = await prisma.timetableEntry.findFirst({
            where: {
                roomId: payload.roomId,
                dayOfWeek: payload.dayOfWeek,
                timeSlotId: payload.timeSlotId,
                status: 'ACTIVE',
            },
            include: { room: true },
        });
        if (roomConflict) {
            throw new errorHandler_1.AppError(`Conflict: Room ${roomConflict.room.roomNumber} is already booked at this time.`, 409);
        }
        // 3. Section Conflict
        const secConflict = await prisma.timetableEntry.findFirst({
            where: {
                sectionId: payload.sectionId,
                dayOfWeek: payload.dayOfWeek,
                timeSlotId: payload.timeSlotId,
                status: 'ACTIVE',
            },
        });
        if (secConflict) {
            throw new errorHandler_1.AppError('Conflict: Section already has a class scheduled at this time slot.', 409);
        }
        const entry = await prisma.timetableEntry.create({
            data: {
                academicYearId: activeYear.id,
                departmentId: dept.id,
                classId: payload.classId,
                sectionId: payload.sectionId,
                subjectId: payload.subjectId,
                facultyId: payload.facultyId,
                roomId: payload.roomId,
                timeSlotId: payload.timeSlotId,
                dayOfWeek: payload.dayOfWeek,
                createdByUserId: userId,
                status: 'ACTIVE',
            },
            include: {
                class: true,
                section: true,
                subject: true,
                faculty: { include: { user: true } },
                room: true,
                timeSlot: true,
            },
        });
        await audit_service_1.AuditService.log({
            userId,
            action: 'TIMETABLE_ENTRY_CREATED',
            entityType: 'TimetableEntry',
            entityId: entry.id,
            afterState: { sectionId: payload.sectionId, facultyId: payload.facultyId },
        });
        return entry;
    }
    /**
     * 14. WHATSAPP GROUP CONFIGURATION
     */
    static async updateSectionWhatsAppConfig(userId, sectionId, payload, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        const section = await prisma.section.findUnique({
            where: { id: sectionId },
            include: { class: true },
        });
        if (!section || section.class.departmentId !== dept.id) {
            throw new errorHandler_1.AppError('Section not found or does not belong to your department.', 403);
        }
        const updated = await prisma.section.update({
            where: { id: sectionId },
            data: {
                whatsAppGroupId: payload.whatsAppGroupId ?? undefined,
                whatsAppGroupStatus: payload.whatsAppGroupStatus ?? undefined,
                whatsAppGroupManagedByUserId: userId,
                whatsAppGroupLastSyncAt: new Date(),
            },
        });
        await audit_service_1.AuditService.log({
            userId,
            action: 'SECTION_WHATSAPP_CONFIGURED',
            entityType: 'Section',
            entityId: sectionId,
            afterState: payload,
        });
        return updated;
    }
    /**
     * 15. DEPARTMENT ANNOUNCEMENTS & NOTICES
     */
    static async getDepartmentNotices(userId, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        return prisma.departmentNotice.findMany({
            where: { departmentId: dept.id },
            include: { createdBy: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async createDepartmentNotice(userId, payload, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        const notice = await prisma.departmentNotice.create({
            data: {
                departmentId: dept.id,
                createdByUserId: userId,
                title: payload.title,
                content: payload.content,
                targetScope: payload.targetScope || 'DEPARTMENT',
                classId: payload.classId || undefined,
                sectionId: payload.sectionId || undefined,
            },
            include: { createdBy: true },
        });
        await audit_service_1.AuditService.log({
            userId,
            action: 'DEPARTMENT_NOTICE_CREATED',
            entityType: 'DepartmentNotice',
            entityId: notice.id,
            afterState: { title: notice.title },
        });
        return notice;
    }
    /**
     * 16. DEPARTMENT REPORTS GENERATOR
     */
    static async generateDepartmentReport(userId, reportType, requestedDeptId) {
        const dept = await this.getHodDepartment(userId, requestedDeptId);
        if (reportType === 'FACULTY') {
            const faculty = await prisma.faculty.findMany({
                where: { departmentId: dept.id },
                include: { user: true, subjectAssignments: { include: { subject: true, class: true } } },
            });
            return { reportType, department: dept.name, generatedAt: new Date(), data: faculty };
        }
        if (reportType === 'STUDENTS') {
            const students = await prisma.student.findMany({
                where: { departmentId: dept.id },
                include: { user: true, section: { include: { class: true } } },
            });
            return { reportType, department: dept.name, generatedAt: new Date(), data: students };
        }
        if (reportType === 'TIMETABLE') {
            const timetable = await prisma.timetableEntry.findMany({
                where: { departmentId: dept.id, status: 'ACTIVE' },
                include: { class: true, section: true, subject: true, faculty: { include: { user: true } }, room: true, timeSlot: true },
            });
            return { reportType, department: dept.name, generatedAt: new Date(), data: timetable };
        }
        const attendanceSummary = await prisma.studentAttendance.findMany({
            where: { student: { departmentId: dept.id } },
            include: { student: { include: { user: true } }, attendanceSlot: { include: { subject: true } } },
            take: 100,
        });
        return { reportType: 'ATTENDANCE', department: dept.name, generatedAt: new Date(), data: attendanceSummary };
    }
}
exports.HodPortalService = HodPortalService;
