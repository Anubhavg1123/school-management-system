import { prisma } from '../prisma';
import { StudentStatusEnum } from '../types';

export class ReportService {
  // 1. Full Student Roster
  static async getStudentRoster(filters: {
    status?: string;
    classId?: string;
    sectionId?: string;
    departmentId?: string;
    academicYearId?: string;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.sectionId) where.sectionId = filters.sectionId;
    if (filters.classId) where.section = { classId: filters.classId };
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.academicYearId) where.academicYearId = filters.academicYearId;

    const students = await prisma.student.findMany({
      where,
      orderBy: { admissionNumber: 'asc' },
      include: {
        user: true,
        academicYear: true,
        department: true,
        section: {
          include: { class: true },
        },
        guardians: {
          where: { isPrimary: true },
        },
      },
    });

    const summary = {
      total: students.length,
      active: students.filter((s) => s.status === StudentStatusEnum.ACTIVE).length,
      left: students.filter((s) => s.status === StudentStatusEnum.LEFT_INSTITUTION).length,
      transferred: students.filter((s) => s.status === StudentStatusEnum.TRANSFERRED).length,
      graduated: students.filter((s) => s.status === StudentStatusEnum.GRADUATED).length,
      suspended: students.filter((s) => s.status === StudentStatusEnum.SUSPENDED).length,
    };

    return {
      summary,
      rows: students.map((s) => ({
        id: s.id,
        admissionNumber: s.admissionNumber,
        enrollmentNumber: s.enrollmentNumber || '—',
        fullName: `${s.user.firstName} ${s.user.lastName}`,
        email: s.user.email,
        whatsAppNumber: s.user.whatsAppNumber || '—',
        phone: s.user.phone || '—',
        gender: s.gender || '—',
        dob: s.dateOfBirth ? s.dateOfBirth.toISOString().split('T')[0] : '—',
        className: s.section?.class.name || 'Unassigned',
        sectionName: s.section?.name || 'Unassigned',
        departmentName: s.department?.name || '—',
        academicYear: s.academicYear?.name || '—',
        guardianName: s.guardians[0]?.fullName || '—',
        guardianPhone: s.guardians[0]?.phone || '—',
        status: s.status,
        admissionDate: s.admissionDate.toISOString().split('T')[0],
      })),
    };
  }

  // 2. Class & Section Capacity Breakdown
  static async getClassWiseReport(academicYearId?: string) {
    const classes = await prisma.class.findMany({
      where: academicYearId ? { academicYearId } : {},
      include: {
        academicYear: true,
        department: true,
        sections: {
          include: {
            students: {
              select: { id: true, status: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    let totalCapacity = 0;
    let totalEnrolled = 0;
    let totalActive = 0;

    const classStats = classes.map((c) => {
      const sectionStats = c.sections.map((sec) => {
        const activeCount = sec.students.filter((s) => s.status === StudentStatusEnum.ACTIVE).length;
        const totalCount = sec.students.length;
        const utilization = sec.capacity > 0 ? Math.round((activeCount / sec.capacity) * 100) : 0;

        totalCapacity += sec.capacity;
        totalEnrolled += totalCount;
        totalActive += activeCount;

        return {
          sectionId: sec.id,
          sectionName: sec.name,
          capacity: sec.capacity,
          enrolledCount: totalCount,
          activeCount,
          availableSeats: Math.max(0, sec.capacity - activeCount),
          utilizationPercentage: utilization,
        };
      });

      return {
        classId: c.id,
        className: c.name,
        classCode: c.code,
        academicYear: c.academicYear.name,
        departmentName: c.department?.name || 'General',
        sections: sectionStats,
      };
    });

    return {
      summary: {
        totalClasses: classes.length,
        totalCapacity,
        totalEnrolled,
        totalActive,
        overallUtilization: totalCapacity > 0 ? Math.round((totalActive / totalCapacity) * 100) : 0,
      },
      classes: classStats,
    };
  }

  // 3. Department-wise Enrollment
  static async getDepartmentWiseReport() {
    const departments = await prisma.department.findMany({
      include: {
        hod: {
          select: { firstName: true, lastName: true, email: true },
        },
        _count: {
          select: { classes: true, facultyMembers: true },
        },
        students: {
          select: { id: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return departments.map((d) => {
      const activeStudents = d.students.filter((s) => s.status === StudentStatusEnum.ACTIVE).length;
      return {
        departmentId: d.id,
        departmentCode: d.code,
        departmentName: d.name,
        hodName: d.hod ? `${d.hod.firstName} ${d.hod.lastName}` : 'Unassigned',
        facultyCount: d._count.facultyMembers,
        classCount: d._count.classes,
        totalStudents: d.students.length,
        activeStudents,
      };
    });
  }

  // 4. Student Transfer & Status History Log
  static async getTransferReport(limit = 100) {
    const logs = await prisma.studentTransferLog.findMany({
      take: limit,
      orderBy: { effectiveDate: 'desc' },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      studentId: log.studentId,
      admissionNumber: log.student.admissionNumber,
      studentName: `${log.student.user.firstName} ${log.student.user.lastName}`,
      transferType: log.transferType,
      fromStatus: log.fromStatus || '—',
      toStatus: log.toStatus || '—',
      fromSectionId: log.fromSectionId || '—',
      toSectionId: log.toSectionId || '—',
      reason: log.reason,
      effectiveDate: log.effectiveDate.toISOString(),
      createdAt: log.createdAt.toISOString(),
    }));
  }

  // 5. Admissions Intake Statistics
  static async getAdmissionsReport() {
    const students = await prisma.student.findMany({
      orderBy: { admissionDate: 'desc' },
      include: {
        academicYear: true,
        department: true,
        section: { include: { class: true } },
      },
    });

    // Group by month
    const monthlyGroups: Record<string, number> = {};
    students.forEach((s) => {
      const monthKey = s.admissionDate.toISOString().slice(0, 7); // YYYY-MM
      monthlyGroups[monthKey] = (monthlyGroups[monthKey] || 0) + 1;
    });

    return {
      totalAdmissions: students.length,
      monthlyBreakdown: monthlyGroups,
      recentAdmissions: students.slice(0, 20).map((s) => ({
        id: s.id,
        admissionNumber: s.admissionNumber,
        enrollmentNumber: s.enrollmentNumber || '—',
        className: s.section?.class.name || '—',
        sectionName: s.section?.name || '—',
        department: s.department?.name || 'General',
        admissionDate: s.admissionDate.toISOString().split('T')[0],
        status: s.status,
      })),
    };
  }

  // ===== PHASE 15: EXTENDED REPORTS =====

  // 6. Attendance Report by Class/Section and Date Range
  static async getAttendanceReport(filters: {
    classId?: string;
    sectionId?: string;
    academicYearId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const slotWhere: any = {};
    if (filters.sectionId) slotWhere.sectionId = filters.sectionId;
    if (filters.classId) slotWhere.classId = filters.classId;
    if (filters.academicYearId) slotWhere.academicYearId = filters.academicYearId;
    if (filters.startDate || filters.endDate) {
      slotWhere.date = {};
      if (filters.startDate) slotWhere.date.gte = filters.startDate;
      if (filters.endDate) slotWhere.date.lte = filters.endDate;
    }

    const slots = await prisma.attendanceSlot.findMany({
      where: slotWhere,
      include: {
        class: true,
        section: true,
        studentAttendances: { select: { status: true, studentId: true } },
      },
      orderBy: { date: 'desc' },
      take: 200,
    });

    const rows = slots.map((s) => {
      const total = s.studentAttendances.length;
      const present = s.studentAttendances.filter((a) => ['PRESENT', 'ACADEMIC_BYPASS'].includes(a.status)).length;
      const absent = s.studentAttendances.filter((a) => a.status === 'ABSENT').length;
      const late = s.studentAttendances.filter((a) => a.status === 'LATE').length;
      const excused = s.studentAttendances.filter((a) => a.status === 'EXCUSED').length;

      return {
        slotId: s.id,
        date: s.date,
        className: s.class?.name || '—',
        sectionName: s.section?.name || '—',
        status: s.status,
        totalStudents: total,
        present,
        absent,
        late,
        excused,
        attendancePercent: total > 0 ? Math.round((present / total) * 100) : 100,
      };
    });

    const totalPresent = rows.reduce((acc, r) => acc + r.present, 0);
    const totalAbsent = rows.reduce((acc, r) => acc + r.absent, 0);
    const totalStudents = rows.reduce((acc, r) => acc + r.totalStudents, 0);

    return {
      summary: {
        totalSlots: slots.length,
        averageAttendancePercent: totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 100,
        totalPresent,
        totalAbsent,
      },
      rows,
    };
  }

  // 7. Finance Collection Report
  static async getFinanceReport(filters: {
    academicYearId?: string;
    classId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const paymentWhere: any = { status: 'SUCCESS' };
    if (filters.startDate || filters.endDate) {
      paymentWhere.paymentDate = {};
      if (filters.startDate) paymentWhere.paymentDate.gte = new Date(filters.startDate);
      if (filters.endDate) paymentWhere.paymentDate.lte = new Date(filters.endDate);
    }
    if (filters.academicYearId) paymentWhere.academicYearId = filters.academicYearId;

    const payments = await prisma.payment.findMany({
      where: paymentWhere,
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            section: { include: { class: true } },
          },
        },
        feeAssignment: { include: { feeStructure: { select: { name: true } } } },
      },
      orderBy: { paymentDate: 'desc' },
    });

    const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

    // Outstanding fees
    const feeWhere: any = {};
    if (filters.academicYearId) feeWhere.academicYearId = filters.academicYearId;
    const assignments = await prisma.studentFeeAssignment.findMany({
      where: feeWhere,
      select: { netPayableAmount: true, totalPaidAmount: true, status: true },
    });

    const totalAssigned = assignments.reduce((acc, a) => acc + a.netPayableAmount, 0);
    const totalPaid = assignments.reduce((acc, a) => acc + a.totalPaidAmount, 0);
    const totalOutstanding = Math.max(0, totalAssigned - totalPaid);
    const overdueCount = assignments.filter((a) => a.status === 'OVERDUE').length;

    return {
      summary: {
        totalCollected,
        totalAssigned,
        totalOutstanding,
        overdueCount,
        paymentCount: payments.length,
        collectionRate: totalAssigned > 0 ? Math.round((totalPaid / totalAssigned) * 100) : 100,
      },
      rows: payments.slice(0, 200).map((p) => ({
        paymentNumber: p.paymentNumber,
        date: p.paymentDate.toISOString().split('T')[0],
        studentName: p.student?.user ? `${p.student.user.firstName} ${p.student.user.lastName}` : '—',
        admissionNumber: p.student?.admissionNumber || '—',
        className: p.student?.section?.class.name || '—',
        feeTitle: p.feeAssignment?.feeStructure?.name || '—',
        amount: p.amount,
        method: p.paymentMethod,
        reference: p.transactionReference || '—',
        status: p.status,
      })),
    };
  }

  // 8. Examination & Result Report
  static async getExaminationReport(filters: {
    academicYearId?: string;
    classId?: string;
  }) {
    const examWhere: any = {};
    if (filters.academicYearId) examWhere.academicYearId = filters.academicYearId;

    const examinations = await prisma.examination.findMany({
      where: examWhere,
      include: {
        resultSnapshots: {
          select: {
            totalObtainedMarks: true,
            overallPercentage: true,
            grade: true,
            overallResult: true,
            studentId: true,
          },
        },
        classes: { include: { class: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = examinations.map((exam) => {
      const snapshots = exam.resultSnapshots;
      const total = snapshots.length;
      const passed = snapshots.filter((r) => r.overallResult === 'PASS').length;
      const failed = snapshots.filter((r) => r.overallResult === 'FAIL').length;
      const avgPct = total > 0 ? snapshots.reduce((acc, r) => acc + r.overallPercentage, 0) / total : 0;
      const topPercent = total > 0 ? Math.max(...snapshots.map((r) => r.overallPercentage)) : 0;

      const classNames = exam.classes.map((ec) => ec.class?.name).filter(Boolean).join(', ');

      return {
        examinationId: exam.id,
        name: exam.name,
        code: exam.code,
        examType: exam.examType,
        className: classNames || '—',
        totalStudents: total,
        passed,
        failed,
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
        averagePercentage: Math.round(avgPct * 100) / 100,
        topPercentage: topPercent,
      };
    });

    return {
      summary: {
        totalExaminations: rows.length,
        overallPassRate: rows.length > 0 ? Math.round(rows.reduce((acc, r) => acc + r.passRate, 0) / rows.length) : 0,
        averagePercentage: rows.length > 0 ? Math.round(rows.reduce((acc, r) => acc + r.averagePercentage, 0) / rows.length * 100) / 100 : 0,
      },
      rows,
    };
  }

  // 9. Staff Report (Faculty + Non-Faculty)
  static async getStaffReport() {
    const faculty = await prisma.faculty.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, status: true } },
        department: { select: { name: true } },
      },
      orderBy: { employeeCode: 'asc' },
    });

    const nonFaculty = await prisma.user.findMany({
      where: { activeRole: 'NON_FACULTY', status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, status: true },
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const todayAttendance = await prisma.attendance.findMany({
      where: { date: todayStr },
      select: { userId: true, checkInTime: true, checkOutTime: true },
    });

    const attendanceMap = new Map(todayAttendance.map((a) => [a.userId, a]));

    return {
      summary: {
        totalFaculty: faculty.length,
        activeFaculty: faculty.filter((f) => f.status === 'ACTIVE').length,
        totalNonFaculty: nonFaculty.length,
        presentToday: todayAttendance.length,
      },
      faculty: faculty.map((f) => {
        const att = attendanceMap.get(f.userId);
        return {
          employeeCode: f.employeeCode,
          name: `${f.user.firstName} ${f.user.lastName}`,
          email: f.user.email,
          phone: f.user.phone || '—',
          department: f.department?.name || '—',
          designation: f.designation || '—',
          status: f.status,
          todayCheckIn: att?.checkInTime || '—',
          todayCheckOut: att?.checkOutTime || '—',
        };
      }),
      nonFaculty: nonFaculty.map((u) => {
        const att = attendanceMap.get(u.id);
        return {
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
          phone: u.phone || '—',
          status: u.status,
          todayCheckIn: att?.checkInTime || '—',
          todayCheckOut: att?.checkOutTime || '—',
        };
      }),
    };
  }

  // 10. Visitor Report
  static async getVisitorReport(filters: { startDate?: string; endDate?: string; purpose?: string }) {
    const where: any = {};
    if (filters.startDate || filters.endDate) {
      where.entryTime = {};
      if (filters.startDate) where.entryTime.gte = new Date(filters.startDate + 'T00:00:00.000Z');
      if (filters.endDate) where.entryTime.lte = new Date(filters.endDate + 'T23:59:59.999Z');
    }
    if (filters.purpose) where.purpose = { contains: filters.purpose };

    const visitors = await prisma.visitorEntryExit.findMany({
      where,
      orderBy: { entryTime: 'desc' },
      take: 500,
      include: {
        visitor: { select: { fullName: true, contactNumber: true } },
      },
    });

    const purposeBreakdown: Record<string, number> = {};
    visitors.forEach((v) => {
      const p = v.purpose || 'GENERAL';
      purposeBreakdown[p] = (purposeBreakdown[p] || 0) + 1;
    });

    return {
      summary: {
        totalVisitors: visitors.length,
        currentlyInside: visitors.filter((v) => v.status === 'INSIDE_CAMPUS').length,
        exited: visitors.filter((v) => v.status === 'EXITED').length,
        purposeBreakdown,
      },
      rows: visitors.map((v) => ({
        passNumber: v.passNumber,
        visitorName: v.visitor?.fullName || '—',
        visitorPhone: v.visitor?.contactNumber || '—',
        purpose: v.purpose,
        personToMeet: v.personToMeetName || '—',
        status: v.status,
        entryTime: v.entryTime.toISOString(),
        exitTime: v.exitTime ? v.exitTime.toISOString() : '—',
      })),
    };
  }

  // 11. Audit Report
  static async getAuditReport(filters: {
    entityType?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    const where: any = {};
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.action) where.action = { contains: filters.action };
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      take: filters.limit || 200,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, activeRole: true } },
      },
    });

    return {
      summary: { totalLogs: logs.length },
      rows: logs.map((l) => ({
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId || '—',
        performedBy: l.user ? `${l.user.firstName} ${l.user.lastName} (${l.user.activeRole})` : 'System',
        email: l.user?.email || '—',
        status: l.status,
        ipAddress: l.ipAddress || '—',
        createdAt: l.createdAt.toISOString(),
      })),
    };
  }

  // ===== CSV EXPORT UTILITY =====
  static exportToCSV(rows: Array<Record<string, any>>, columns?: string[]): string {
    if (rows.length === 0) return '';

    const headers = columns || Object.keys(rows[0]);
    const csvLines: string[] = [headers.join(',')];

    for (const row of rows) {
      const values = headers.map((h) => {
        const val = row[h] ?? '';
        const str = String(val);
        // Escape commas and double-quotes in CSV
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvLines.push(values.join(','));
    }

    return csvLines.join('\n');
  }
}
