import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export interface AttenderMarkAttendancePayload {
  targetUserId: string;
  action: 'CHECK_IN' | 'CHECK_OUT';
  remarks?: string;
}

export class NonFacultyService {
  /**
   * 1. Get Non-Faculty Operational Dashboard
   */
  static async getDashboard(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        nonFacultyProfile: true,
        userRoles: { include: { role: true } },
      },
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Today's Check-in Status
    const todayAttendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: todayStr,
        },
      },
    });

    // If user is a Driver, fetch assigned vehicle details
    let assignedVehicle = null;
    let todayKmLogs: any[] = [];
    if (user.nonFacultyProfile?.jobTitle === 'DRIVER' || user.userCategory === 'DRIVER') {
      const driverProfile = user.nonFacultyProfile;
      if (driverProfile) {
        assignedVehicle = await prisma.vehicle.findFirst({
          where: { assignedDriverId: driverProfile.id, status: 'ACTIVE' },
        });

        if (assignedVehicle) {
          todayKmLogs = await prisma.vehicleKmLog.findMany({
            where: { vehicleId: assignedVehicle.id, date: todayStr },
            orderBy: { createdAt: 'desc' },
          });
        }
      }
    }

    // Pending Notifications
    const recentNotifications = await prisma.notification.findMany({
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
    return prisma.staffCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async createStaffCategory(payload: { code: string; name: string; description?: string }) {
    const existing = await prisma.staffCategory.findUnique({
      where: { code: payload.code.toUpperCase() },
    });

    if (existing) {
      throw new AppError(`Staff category with code '${payload.code}' already exists.`, 409);
    }

    return prisma.staffCategory.create({
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
  static async attenderMarkAttendance(attenderUserId: string, payload: AttenderMarkAttendancePayload) {
    const targetUser = await prisma.user.findUnique({
      where: { id: payload.targetUserId },
      include: { nonFacultyProfile: true },
    });

    if (!targetUser) {
      throw new AppError('Target staff member not found.', 404);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    const existingAtt = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: targetUser.id,
          date: todayStr,
        },
      },
    });

    if (payload.action === 'CHECK_IN') {
      if (existingAtt && existingAtt.checkInTime) {
        throw new AppError(`Check-in already recorded for ${targetUser.firstName} today.`, 400);
      }

      const attendanceRecord = await prisma.attendance.upsert({
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
      await prisma.auditLog.create({
        data: {
          userId: attenderUserId,
          action: 'ATTENDER_CHECK_IN',
          entityType: 'Attendance',
          entityId: attendanceRecord.id,
          afterState: JSON.stringify({ targetUserId: targetUser.id, action: 'CHECK_IN' }),
        },
      });

      return attendanceRecord;
    } else {
      // CHECK_OUT
      if (!existingAtt || !existingAtt.checkInTime) {
        throw new AppError(`Cannot check out: Check-in was not recorded for ${targetUser.firstName} today.`, 400);
      }

      if (existingAtt.checkOutTime) {
        throw new AppError(`Check-out already recorded for ${targetUser.firstName} today.`, 400);
      }

      const updated = await prisma.attendance.update({
        where: { id: existingAtt.id },
        data: {
          checkOutTime: now,
          enteredByUserId: attenderUserId,
          remarks: payload.remarks ? `${existingAtt.remarks || ''} | ${payload.remarks}` : existingAtt.remarks,
        },
      });

      // Audit Log
      await prisma.auditLog.create({
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
  static async getAttenderDashboard(attenderUserId: string) {
    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch all non-faculty users
    const staffMembers = await prisma.user.findMany({
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
    const attendances = await prisma.attendance.findMany({
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
    const recentAttenderEntries = await prisma.attendance.findMany({
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
