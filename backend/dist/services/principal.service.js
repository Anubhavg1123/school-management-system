"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrincipalService = void 0;
const prisma_1 = require("../prisma");
const whatsapp_service_1 = require("./whatsapp.service");
class PrincipalService {
    /**
     * 1. Real-Time Principal Dashboard Metrics (Zero Fake Statistics!)
     */
    static async getDashboardMetrics() {
        const todayStr = new Date().toISOString().split('T')[0];
        const now = new Date();
        // 1. Student Master Counts
        const totalActiveStudents = await prisma_1.prisma.student.count({ where: { status: 'ACTIVE' } });
        const totalInactiveStudents = await prisma_1.prisma.student.count({
            where: { status: { in: ['INACTIVE', 'LEFT_INSTITUTION', 'SUSPENDED', 'GRADUATED', 'TRANSFERRED'] } },
        });
        const newAdmissions = await prisma_1.prisma.student.count({
            where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
        });
        const pendingRegistrations = await prisma_1.prisma.registrationRequest.count({
            where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } },
        });
        // 2. Staff & Organizational Master Counts
        const facultyCount = await prisma_1.prisma.faculty.count({ where: { status: 'ACTIVE' } });
        const nonFacultyCount = await prisma_1.prisma.user.count({
            where: { activeRole: 'NON_FACULTY', status: 'ACTIVE' },
        });
        const hodCount = await prisma_1.prisma.department.count({ where: { hodUserId: { not: null } } });
        const departmentCount = await prisma_1.prisma.department.count({ where: { status: 'ACTIVE' } });
        const classCount = await prisma_1.prisma.class.count();
        // 3. Today's Attendance Rates
        const todayStudentAttendances = await prisma_1.prisma.studentAttendance.findMany({
            where: { createdAt: { gte: new Date(`${todayStr}T00:00:00.000Z`) } },
            select: { status: true },
        });
        const totalStudentAttCount = todayStudentAttendances.length;
        const presentStudentCount = todayStudentAttendances.filter((a) => a.status === 'PRESENT' || a.status === 'ACADEMIC_BYPASS').length;
        const todayStudentAttendancePercent = totalStudentAttCount > 0 ? Math.round((presentStudentCount / totalStudentAttCount) * 100) : 100;
        const todayStaffAttendances = await prisma_1.prisma.attendance.findMany({
            where: { date: todayStr },
            select: { checkInTime: true, user: { select: { activeRole: true } } },
        });
        const facultyAttended = todayStaffAttendances.filter((a) => a.user.activeRole === 'FACULTY').length;
        const staffAttended = todayStaffAttendances.filter((a) => a.user.activeRole === 'NON_FACULTY').length;
        const todayFacultyAttendancePercent = facultyCount > 0 ? Math.min(100, Math.round((facultyAttended / facultyCount) * 100)) : 100;
        const todayStaffAttendancePercent = nonFacultyCount > 0 ? Math.min(100, Math.round((staffAttended / nonFacultyCount) * 100)) : 100;
        // 4. Low Attendance & Leaves
        const lowAttendanceCount = await prisma_1.prisma.studentAttendance.count({
            where: { status: 'ABSENT' },
        });
        const facultyOnLeaveCount = await prisma_1.prisma.facultyLeave.count({
            where: {
                status: 'APPROVED',
                startDate: { lte: now },
                endDate: { gte: now },
            },
        });
        const pendingFacultyLeaves = await prisma_1.prisma.facultyLeave.count({
            where: { status: 'PENDING' },
        });
        // 5. Pending Approval Queues across Modules
        const pendingAttendanceCorrections = await prisma_1.prisma.studentAttendanceCorrection.count({
            where: { status: 'PENDING' },
        });
        const pendingBypassRequests = await prisma_1.prisma.academicBypassRequest.count({
            where: { status: 'PENDING' },
        });
        const pendingExtraClasses = await prisma_1.prisma.extraClassRequest.count({
            where: { status: 'PENDING' },
        });
        const pendingVehicleApprovals = await prisma_1.prisma.facultyVehicleRegistration.count({
            where: { status: 'PENDING' },
        });
        // 6. Visitors & Fleet
        const activeVisitors = await prisma_1.prisma.visitorEntryExit.count({
            where: { status: 'INSIDE_CAMPUS' },
        });
        const todayVisitors = await prisma_1.prisma.visitorEntryExit.count({
            where: { entryTime: { gte: new Date(`${todayStr}T00:00:00.000Z`) } },
        });
        // 7. Finance Totals
        const feeAssignments = await prisma_1.prisma.studentFeeAssignment.findMany({
            select: { netPayableAmount: true, totalPaidAmount: true, status: true },
        });
        let totalFees = 0;
        let collectedFees = 0;
        let outstandingFees = 0;
        let overdueCount = 0;
        for (const f of feeAssignments) {
            totalFees += f.netPayableAmount;
            collectedFees += f.totalPaidAmount;
            outstandingFees += Math.max(0, f.netPayableAmount - f.totalPaidAmount);
            if (f.status === 'OVERDUE')
                overdueCount++;
        }
        const todayPayments = await prisma_1.prisma.payment.findMany({
            where: { paymentDate: { gte: new Date(`${todayStr}T00:00:00.000Z`) } },
            select: { amount: true },
        });
        const todayFeeCollection = todayPayments.reduce((acc, p) => acc + p.amount, 0);
        // 8. Communication Alerts
        const recentNoticesCount = await prisma_1.prisma.notice.count({
            where: { status: 'PUBLISHED' },
        });
        const failedMessagesCount = await prisma_1.prisma.notificationDelivery.count({
            where: { status: 'FAILED' },
        });
        return {
            totalActiveStudents,
            totalInactiveStudents,
            newAdmissions,
            pendingRegistrations,
            facultyCount,
            nonFacultyCount,
            hodCount,
            departmentCount,
            classCount,
            todayStudentAttendancePercent,
            todayFacultyAttendancePercent,
            todayStaffAttendancePercent,
            lowAttendanceCount,
            facultyOnLeaveCount,
            pendingFacultyLeaves,
            pendingAttendanceCorrections,
            pendingBypassRequests,
            pendingExtraClasses,
            pendingVehicleApprovals,
            activeVisitors,
            todayVisitors,
            totalFees,
            collectedFees,
            outstandingFees,
            overdueCount,
            todayFeeCollection,
            recentNoticesCount,
            failedMessagesCount,
        };
    }
    /**
     * 2. Institution Executive Summary (Academic, Staff, Finance, Operations, Communication)
     */
    static async getExecutiveSummary() {
        const metrics = await this.getDashboardMetrics();
        return {
            academic: {
                studentStrength: metrics.totalActiveStudents,
                departmentStrength: metrics.departmentCount,
                classStrength: metrics.classCount,
                studentAttendancePercent: metrics.todayStudentAttendancePercent,
                lowAttendanceCount: metrics.lowAttendanceCount,
            },
            staff: {
                facultyCount: metrics.facultyCount,
                nonFacultyCount: metrics.nonFacultyCount,
                facultyAttendancePercent: metrics.todayFacultyAttendancePercent,
                staffAttendancePercent: metrics.todayStaffAttendancePercent,
                facultyOnLeave: metrics.facultyOnLeaveCount,
                pendingLeaves: metrics.pendingFacultyLeaves,
            },
            finance: {
                totalFees: metrics.totalFees,
                collectedFees: metrics.collectedFees,
                outstandingFees: metrics.outstandingFees,
                todayCollection: metrics.todayFeeCollection,
                overdueCount: metrics.overdueCount,
            },
            operations: {
                activeVisitors: metrics.activeVisitors,
                todayVisitors: metrics.todayVisitors,
                pendingVehicleApprovals: metrics.pendingVehicleApprovals,
            },
            communication: {
                recentNotices: metrics.recentNoticesCount,
                failedMessages: metrics.failedMessagesCount,
                isWhatsAppConnected: whatsapp_service_1.WhatsAppService.isConfigured(),
            },
        };
    }
    /**
     * 3. Department Overview & Comparison
     */
    static async getDepartmentOverview() {
        const departments = await prisma_1.prisma.department.findMany({
            include: {
                hod: { select: { firstName: true, lastName: true, email: true } },
                facultyMembers: { where: { status: 'ACTIVE' } },
                students: { where: { status: 'ACTIVE' } },
                classes: true,
            },
        });
        return departments.map((d) => ({
            id: d.id,
            code: d.code,
            name: d.name,
            hodName: d.hod ? `${d.hod.firstName} ${d.hod.lastName}` : 'Unassigned',
            facultyCount: d.facultyMembers.length,
            studentCount: d.students.length,
            classCount: d.classes.length,
            status: d.status,
        }));
    }
    /**
     * 4. Global Administrative Search
     */
    static async searchGlobal(query) {
        if (!query || query.trim().length === 0)
            return { students: [], faculty: [], vehicles: [], notices: [] };
        const q = query.trim();
        const students = await prisma_1.prisma.student.findMany({
            where: {
                OR: [
                    { admissionNumber: { contains: q } },
                    { enrollmentNumber: { contains: q } },
                    { user: { firstName: { contains: q } } },
                    { user: { lastName: { contains: q } } },
                ],
            },
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
            take: 10,
        });
        const faculty = await prisma_1.prisma.faculty.findMany({
            where: {
                OR: [
                    { employeeCode: { contains: q } },
                    { designation: { contains: q } },
                ],
            },
            take: 10,
        });
        const vehicles = await prisma_1.prisma.vehicle.findMany({
            where: {
                OR: [
                    { registrationNumber: { contains: q } },
                    { makeModel: { contains: q } },
                ],
            },
            take: 10,
        });
        const notices = await prisma_1.prisma.notice.findMany({
            where: {
                OR: [
                    { title: { contains: q } },
                    { content: { contains: q } },
                ],
            },
            take: 10,
        });
        return {
            students: students.map((s) => ({ id: s.id, name: `${s.user.firstName} ${s.user.lastName}`, admissionNumber: s.admissionNumber })),
            faculty: faculty.map((f) => ({ id: f.id, employeeCode: f.employeeCode, designation: f.designation })),
            vehicles: vehicles.map((v) => ({ id: v.id, registrationNumber: v.registrationNumber, makeModel: v.makeModel })),
            notices: notices.map((n) => ({ id: n.id, title: n.title, noticeType: n.noticeType })),
        };
    }
    /**
     * 5. Principal Emergency Administrative Override Logger
     */
    static async logOverride(userId, action, entityType, entityId, reason, beforeState, afterState) {
        return prisma_1.prisma.auditLog.create({
            data: {
                userId,
                action: `PRINCIPAL_OVERRIDE_${action}`,
                entityType,
                entityId,
                beforeState: beforeState ? JSON.stringify(beforeState) : null,
                afterState: JSON.stringify({ ...afterState, overrideReason: reason, timestamp: new Date() }),
            },
        });
    }
    /**
     * 6. System Health Dashboard Status
     */
    static async getSystemHealth() {
        let dbStatus = 'HEALTHY';
        try {
            await prisma_1.prisma.$queryRaw `SELECT 1`;
        }
        catch {
            dbStatus = 'DEGRADED';
        }
        const pendingJobs = await prisma_1.prisma.notificationDelivery.count({ where: { status: 'QUEUED' } });
        const failedJobs = await prisma_1.prisma.notificationDelivery.count({ where: { status: 'FAILED' } });
        return {
            database: dbStatus,
            whatsappIntegration: whatsapp_service_1.WhatsAppService.isConfigured() ? 'CONFIGURED' : 'UNCONFIGURED',
            queueStatus: {
                pendingJobs,
                failedJobs,
            },
            systemTime: new Date().toISOString(),
            uptimeSeconds: Math.floor(process.uptime()),
        };
    }
}
exports.PrincipalService = PrincipalService;
