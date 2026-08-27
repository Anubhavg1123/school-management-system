"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NonFacultyService = void 0;
const prisma_1 = require("../prisma");
const errorHandler_1 = require("../middleware/errorHandler");
class NonFacultyService {
    /**
     * 1. Get Non-Faculty Operational Dashboard
     */
    static async getDashboard(userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                nonFacultyProfile: true,
                userRoles: { include: { role: true } },
            },
        });
        if (!user) {
            throw new errorHandler_1.AppError('User not found.', 404);
        }
        const todayStr = new Date().toISOString().split('T')[0];
        // Today's Check-in Status
        const todayAttendance = await prisma_1.prisma.attendance.findUnique({
            where: {
                userId_date: {
                    userId,
                    date: todayStr,
                },
            },
        });
        // If user is a Driver, fetch assigned vehicle details
        let assignedVehicle = null;
        let todayKmLogs = [];
        if (user.nonFacultyProfile?.jobTitle === 'DRIVER' || user.userCategory === 'DRIVER') {
            const driverProfile = user.nonFacultyProfile;
            if (driverProfile) {
                assignedVehicle = await prisma_1.prisma.vehicle.findFirst({
                    where: { assignedDriverId: driverProfile.id, status: 'ACTIVE' },
                });
                if (assignedVehicle) {
                    todayKmLogs = await prisma_1.prisma.vehicleKmLog.findMany({
                        where: { vehicleId: assignedVehicle.id, date: todayStr },
                        orderBy: { createdAt: 'desc' },
                    });
                }
            }
        }
        // Pending Notifications
        const recentNotifications = await prisma_1.prisma.notification.findMany({
            where: { userId },
            take: 5,
            orderBy: { createdAt: 'desc' },
        });
        return {
            user: {
                id: user.id,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                jobTitle: user.nonFacultyProfile?.jobTitle || user.userCategory || 'STAFF',
                employeeCode: user.nonFacultyProfile?.employeeCode || 'N/A',
            },
            todayDate: todayStr,
            attendanceStatus: todayAttendance
                ? {
                    id: todayAttendance.id,
                    status: todayAttendance.status,
                    checkInTime: todayAttendance.checkInTime,
                    checkOutTime: todayAttendance.checkOutTime,
                    source: todayAttendance.source,
                    enteredByUserId: todayAttendance.enteredByUserId,
                }
                : {
                    status: 'NOT_CHECKED_IN',
                    checkInTime: null,
                    checkOutTime: null,
                },
            assignedVehicle: assignedVehicle
                ? {
                    id: assignedVehicle.id,
                    registrationNumber: assignedVehicle.registrationNumber,
                    makeModel: assignedVehicle.makeModel,
                    type: assignedVehicle.vehicleType,
                    status: assignedVehicle.status,
                }
                : null,
            todayKmLogs,
            notifications: recentNotifications,
        };
    }
    /**
     * 2. Configurable Staff Categories Management
     */
    static async getStaffCategories() {
        return prisma_1.prisma.staffCategory.findMany({
            orderBy: { name: 'asc' },
        });
    }
    static async createStaffCategory(payload) {
        const existing = await prisma_1.prisma.staffCategory.findUnique({
            where: { code: payload.code.toUpperCase() },
        });
        if (existing) {
            throw new errorHandler_1.AppError(`Staff category with code '${payload.code}' already exists.`, 409);
        }
        return prisma_1.prisma.staffCategory.create({
            data: {
                code: payload.code.toUpperCase(),
                name: payload.name,
                description: payload.description,
                status: 'ACTIVE',
            },
        });
    }
    /**
     * 3. Attender-Assisted Attendance Entry
     */
    static async attenderMarkAttendance(attenderUserId, payload) {
        const targetUser = await prisma_1.prisma.user.findUnique({
            where: { id: payload.targetUserId },
            include: { nonFacultyProfile: true },
        });
        if (!targetUser) {
            throw new errorHandler_1.AppError('Target staff member not found.', 404);
        }
        const todayStr = new Date().toISOString().split('T')[0];
        const now = new Date();
        const existingAtt = await prisma_1.prisma.attendance.findUnique({
            where: {
                userId_date: {
                    userId: targetUser.id,
                    date: todayStr,
                },
            },
        });
        if (payload.action === 'CHECK_IN') {
            if (existingAtt && existingAtt.checkInTime) {
                throw new errorHandler_1.AppError(`Check-in already recorded for ${targetUser.firstName} today.`, 400);
            }
            const attendanceRecord = await prisma_1.prisma.attendance.upsert({
                where: {
                    userId_date: {
                        userId: targetUser.id,
                        date: todayStr,
                    },
                },
                update: {
                    checkInTime: now,
                    status: 'PRESENT',
                    source: 'ATTENDER',
                    enteredByUserId: attenderUserId,
                    remarks: payload.remarks || 'Check-in entered by Attender',
                },
                create: {
                    userId: targetUser.id,
                    date: todayStr,
                    checkInTime: now,
                    status: 'PRESENT',
                    source: 'ATTENDER',
                    enteredByUserId: attenderUserId,
                    remarks: payload.remarks || 'Check-in entered by Attender',
                },
            });
            // Audit Log
            await prisma_1.prisma.auditLog.create({
                data: {
                    userId: attenderUserId,
                    action: 'ATTENDER_CHECK_IN',
                    entityType: 'Attendance',
                    entityId: attendanceRecord.id,
                    afterState: JSON.stringify({ targetUserId: targetUser.id, action: 'CHECK_IN' }),
                },
            });
            return attendanceRecord;
        }
        else {
            // CHECK_OUT
            if (!existingAtt || !existingAtt.checkInTime) {
                throw new errorHandler_1.AppError(`Cannot check out: Check-in was not recorded for ${targetUser.firstName} today.`, 400);
            }
            if (existingAtt.checkOutTime) {
                throw new errorHandler_1.AppError(`Check-out already recorded for ${targetUser.firstName} today.`, 400);
            }
            const updated = await prisma_1.prisma.attendance.update({
                where: { id: existingAtt.id },
                data: {
                    checkOutTime: now,
                    enteredByUserId: attenderUserId,
                    remarks: payload.remarks ? `${existingAtt.remarks || ''} | ${payload.remarks}` : existingAtt.remarks,
                },
            });
            // Audit Log
            await prisma_1.prisma.auditLog.create({
                data: {
                    userId: attenderUserId,
                    action: 'ATTENDER_CHECK_OUT',
                    entityType: 'Attendance',
                    entityId: updated.id,
                    afterState: JSON.stringify({ targetUserId: targetUser.id, action: 'CHECK_OUT' }),
                },
            });
            return updated;
        }
    }
    /**
     * 4. Attender Dashboard Stats & Roster
     */
    static async getAttenderDashboard(attenderUserId) {
        const todayStr = new Date().toISOString().split('T')[0];
        // Fetch all non-faculty users
        const staffMembers = await prisma_1.prisma.user.findMany({
            where: {
                activeRole: 'NON_FACULTY',
                status: 'ACTIVE',
            },
            include: {
                nonFacultyProfile: true,
            },
            orderBy: { firstName: 'asc' },
        });
        const staffIds = staffMembers.map((s) => s.id);
        // Fetch today's attendances for non-faculty staff
        const attendances = await prisma_1.prisma.attendance.findMany({
            where: {
                userId: { in: staffIds },
                date: todayStr,
            },
            include: {
                enteredBy: { select: { firstName: true, lastName: true } },
            },
        });
        const attMap = new Map(attendances.map((a) => [a.userId, a]));
        const roster = staffMembers.map((s) => {
            const att = attMap.get(s.id);
            return {
                userId: s.id,
                name: `${s.firstName} ${s.lastName}`,
                email: s.email,
                employeeCode: s.nonFacultyProfile?.employeeCode || 'N/A',
                jobTitle: s.nonFacultyProfile?.jobTitle || s.userCategory || 'STAFF',
                attendanceId: att?.id || null,
                checkInTime: att?.checkInTime || null,
                checkOutTime: att?.checkOutTime || null,
                status: att ? att.status : 'NOT_CHECKED_IN',
                enteredBy: att?.enteredBy ? `${att.enteredBy.firstName} ${att.enteredBy.lastName}` : null,
            };
        });
        const presentCount = roster.filter((r) => r.status === 'PRESENT').length;
        const absentCount = roster.filter((r) => r.status === 'ABSENT' || r.status === 'NOT_CHECKED_IN').length;
        const missingCheckoutCount = roster.filter((r) => r.checkInTime && !r.checkOutTime).length;
        // Recently entered records by this attender
        const recentAttenderEntries = await prisma_1.prisma.attendance.findMany({
            where: { enteredByUserId: attenderUserId },
            take: 10,
            orderBy: { updatedAt: 'desc' },
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
            },
        });
        return {
            todayDate: todayStr,
            summary: {
                totalStaff: staffMembers.length,
                presentCount,
                absentCount,
                missingCheckoutCount,
            },
            roster,
            recentAttenderEntries,
        };
    }
}
exports.NonFacultyService = NonFacultyService;
