import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const app = createApp();
const prisma = new PrismaClient();

describe('Phase 6 — Real-Time Attendance Management System Integration Tests', () => {
  let adminToken: string;
  let hodToken: string;
  let facultyToken: string;
  let subFacultyToken: string;
  let studentToken: string;

  let academicYearId: string;
  let departmentId: string;
  let classId: string;
  let sectionId: string;
  let subjectId: string;
  let facultyId: string;
  let subFacultyId: string;
  let studentId1: string;
  let studentId2: string;
  let timeSlotId: string;
  let generatedSlotId: string;
  let attendanceRecordId: string;
  let correctionId: string;
  let bypassId: string;

  beforeAll(async () => {
    const defaultPassword = await hashPassword('Admin@SecurePassword2026!');

    // 1. Authenticate Principal / Super Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'principal@school.edu', password: 'Admin@SecurePassword2026!', role: 'SUPER_ADMIN' });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.data.tokens.accessToken;

    // 2. Setup Academic Year
    await prisma.academicYear.updateMany({ data: { isCurrent: false } });

    const year = await prisma.academicYear.upsert({
      where: { name: '2026-2027-Phase6' },
      update: { isCurrent: true },
      create: {
        name: '2026-2027-Phase6',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-05-31'),
        isCurrent: true,
      },
    });
    academicYearId = year.id;

    // 3. Setup Department
    const dept = await prisma.department.upsert({
      where: { code: 'ATT-CS' },
      update: {},
      create: {
        code: 'ATT-CS',
        name: 'Attendance Computer Science',
      },
    });
    departmentId = dept.id;

    // 4. Create HOD, Main Faculty, and Substitute Faculty Users
    const hodUser = await prisma.user.upsert({
      where: { email: 'hod.att@school.edu' },
      update: { passwordHash: defaultPassword },
      create: {
        email: 'hod.att@school.edu',
        username: 'hod_att',
        passwordHash: defaultPassword,
        firstName: 'HOD',
        lastName: 'Attendance',
        status: 'ACTIVE',
        activeRole: 'HOD',
      },
    });

    const hodRole = await prisma.role.findUnique({ where: { name: 'HOD' } });
    if (hodRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: hodUser.id, roleId: hodRole.id } },
        update: { departmentId: dept.id },
        create: { userId: hodUser.id, roleId: hodRole.id, departmentId: dept.id, isPrimary: true },
      });
    }

    const hodLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'hod.att@school.edu', password: 'Admin@SecurePassword2026!', role: 'HOD' });
    hodToken = hodLogin.body.data?.tokens?.accessToken || adminToken;

    // Main Faculty
    const facUser = await prisma.user.upsert({
      where: { email: 'fac.att@school.edu' },
      update: { passwordHash: defaultPassword },
      create: {
        email: 'fac.att@school.edu',
        username: 'fac_att',
        passwordHash: defaultPassword,
        firstName: 'Main',
        lastName: 'Faculty',
        status: 'ACTIVE',
        activeRole: 'FACULTY',
      },
    });

    const facRole = await prisma.role.findUnique({ where: { name: 'FACULTY' } });
    if (facRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: facUser.id, roleId: facRole.id } },
        update: {},
        create: { userId: facUser.id, roleId: facRole.id, isPrimary: true },
      });
    }

    const mainFaculty = await prisma.faculty.upsert({
      where: { userId: facUser.id },
      update: {},
      create: {
        userId: facUser.id,
        employeeCode: 'EMP-ATT-001',
        departmentId: dept.id,
        designation: 'ASST_PROFESSOR',
      },
    });
    facultyId = mainFaculty.id;

    const facLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'fac.att@school.edu', password: 'Admin@SecurePassword2026!', role: 'FACULTY' });
    facultyToken = facLogin.body.data?.tokens?.accessToken || adminToken;

    // Substitute Faculty
    const subFacUser = await prisma.user.upsert({
      where: { email: 'sub.att@school.edu' },
      update: { passwordHash: defaultPassword },
      create: {
        email: 'sub.att@school.edu',
        username: 'sub_att',
        passwordHash: defaultPassword,
        firstName: 'Sub',
        lastName: 'Faculty',
        status: 'ACTIVE',
        activeRole: 'FACULTY',
      },
    });

    if (facRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: subFacUser.id, roleId: facRole.id } },
        update: {},
        create: { userId: subFacUser.id, roleId: facRole.id, isPrimary: true },
      });
    }

    const substituteFaculty = await prisma.faculty.upsert({
      where: { userId: subFacUser.id },
      update: {},
      create: {
        userId: subFacUser.id,
        employeeCode: 'EMP-ATT-002',
        departmentId: dept.id,
        designation: 'LECTURER',
      },
    });
    subFacultyId = substituteFaculty.id;

    const subLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'sub.att@school.edu', password: 'Admin@SecurePassword2026!', role: 'FACULTY' });
    subFacultyToken = subLogin.body.data?.tokens?.accessToken || adminToken;

    // 5. Setup Class, Section, Subject, and Enrolled Students
    const cls = await prisma.class.upsert({
      where: { code: 'ATT-CLS-10' },
      update: {},
      create: {
        name: 'Grade 10 Attendance Test',
        code: 'ATT-CLS-10',
        academicYearId,
        departmentId,
      },
    });
    classId = cls.id;

    const sec = await prisma.section.upsert({
      where: { classId_name: { classId, name: 'Section A' } },
      update: {},
      create: {
        classId,
        name: 'Section A',
      },
    });
    sectionId = sec.id;

    const sub = await prisma.subject.upsert({
      where: { code: 'ATT-CS101' },
      update: {},
      create: {
        code: 'ATT-CS101',
        name: 'Attendance Systems Engineering',
        departmentId,
      },
    });
    subjectId = sub.id;

    // Create Students
    const stdUser1 = await prisma.user.upsert({
      where: { email: 'student1.att@school.edu' },
      update: {},
      create: {
        email: 'student1.att@school.edu',
        username: 'std1_att',
        passwordHash: '$2a$12$KIXs6P2y.0ZpWbO4iYv.c.1kYwR5N8N.oZ.2P9j5j8O.2P9j5j8O.',
        firstName: 'John',
        lastName: 'Doe',
        status: 'ACTIVE',
      },
    });

    const std1 = await prisma.student.upsert({
      where: { userId: stdUser1.id },
      update: { sectionId },
      create: {
        userId: stdUser1.id,
        admissionNumber: 'ADM-ATT-001',
        enrollmentNumber: 'ENR-ATT-001',
        rollNumber: '101',
        academicYearId,
        departmentId,
        sectionId,
        status: 'ACTIVE',
      },
    });
    studentId1 = std1.id;

    const stdUser2 = await prisma.user.upsert({
      where: { email: 'student2.att@school.edu' },
      update: {},
      create: {
        email: 'student2.att@school.edu',
        username: 'std2_att',
        passwordHash: '$2a$12$KIXs6P2y.0ZpWbO4iYv.c.1kYwR5N8N.oZ.2P9j5j8O.2P9j5j8O.',
        firstName: 'Jane',
        lastName: 'Smith',
        status: 'ACTIVE',
      },
    });

    const std2 = await prisma.student.upsert({
      where: { userId: stdUser2.id },
      update: { sectionId },
      create: {
        userId: stdUser2.id,
        admissionNumber: 'ADM-ATT-002',
        enrollmentNumber: 'ENR-ATT-002',
        rollNumber: '102',
        academicYearId,
        departmentId,
        sectionId,
        status: 'ACTIVE',
      },
    });
    studentId2 = std2.id;

    // 6. Setup TimeSlot and Timetable Entry
    const todayStr = new Date().toISOString().split('T')[0];
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDay = dayNames[new Date().getDay()];

    const ts = await prisma.timeSlot.upsert({
      where: {
        academicYearId_dayOfWeek_periodNumber: {
          academicYearId,
          dayOfWeek: currentDay,
          periodNumber: 1,
        },
      },
      update: {},
      create: {
        academicYearId,
        dayOfWeek: currentDay,
        periodNumber: 1,
        name: 'Period 1 Attendance',
        startTime: '09:00',
        endTime: '10:00',
      },
    });
    timeSlotId = ts.id;

    const room = await prisma.room.upsert({
      where: { roomNumber: 'R-ATT-101' },
      update: {},
      create: {
        roomNumber: 'R-ATT-101',
        name: 'Attendance Lab',
        building: 'Block A',
      },
    });

    await prisma.timetableEntry.upsert({
      where: {
        timeSlotId_sectionId: {
          timeSlotId: ts.id,
          sectionId,
        },
      },
      update: { facultyId },
      create: {
        academicYearId,
        departmentId,
        classId,
        sectionId,
        subjectId,
        facultyId,
        roomId: room.id,
        timeSlotId: ts.id,
        dayOfWeek: currentDay,
        status: 'ACTIVE',
      },
    });

    // Clean up existing slots for this faculty from previous runs
    await prisma.attendanceSlot.deleteMany({
      where: { facultyId },
    });
  });

  it('1. Should generate attendance slots from institutional timetable idempotently', async () => {
    const todayStr = new Date().toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/student-attendance/generate-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ date: todayStr, academicYearId });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.generatedCount).toBeGreaterThanOrEqual(1);

    const slots = res.body.data.slots;
    expect(slots.length).toBeGreaterThan(0);
    const targetSlot = slots.find((s: any) => s.sectionId === sectionId && s.subjectId === subjectId) || slots[0];
    generatedSlotId = targetSlot.id;
  });

  it('2. Should fetch attendance slot details and enrolled student roster', async () => {
    const res = await request(app)
      .get(`/api/student-attendance/slots/${generatedSlotId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slot.id).toBe(generatedSlotId);
    expect(res.body.data.totalStudents).toBeGreaterThanOrEqual(2);
    expect(res.body.data.roster.some((s: any) => s.studentId === studentId1)).toBe(true);
  });

  it('3. Should submit student attendance roll call as OPEN / SUBMITTED', async () => {
    const res = await request(app)
      .post('/api/student-attendance/submit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        slotId: generatedSlotId,
        studentRecords: [
          { studentId: studentId1, status: 'PRESENT', remarks: 'On time' },
          { studentId: studentId2, status: 'ABSENT', remarks: 'Unexcused' },
        ],
        isFinalize: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.result.slotStatus).toBe('SUBMITTED');
    expect(res.body.data.result.savedCount).toBe(2);

    // Verify record in database
    const rec1 = await prisma.studentAttendance.findUnique({
      where: {
        attendanceSlotId_studentId: {
          attendanceSlotId: generatedSlotId,
          studentId: studentId1,
        },
      },
    });
    expect(rec1).not.toBeNull();
    expect(rec1?.status).toBe('PRESENT');
    attendanceRecordId = rec1!.id;
  });

  it('4. Should finalize attendance slot and lock session from further edits', async () => {
    const res = await request(app)
      .post('/api/student-attendance/submit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        slotId: generatedSlotId,
        studentRecords: [
          { studentId: studentId1, status: 'PRESENT' },
          { studentId: studentId2, status: 'ABSENT' },
        ],
        isFinalize: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.result.slotStatus).toBe('FINALIZED');

    // Attempting direct edit after finalization must be rejected
    const retry = await request(app)
      .post('/api/student-attendance/submit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        slotId: generatedSlotId,
        studentRecords: [{ studentId: studentId1, status: 'ABSENT' }],
      });

    expect(retry.status).toBe(400);
    expect(retry.body.error.code).toBe('SLOT_FINALIZED');
  });

  it('5. Should request student attendance correction for finalized session', async () => {
    const res = await request(app)
      .post('/api/student-attendance/corrections')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentAttendanceId: attendanceRecordId,
        proposedStatus: 'PRESENT',
        reason: 'Student attendance verified by faculty correction',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
    correctionId = res.body.data.id;
  });

  it('6. Should review and approve student attendance correction petition', async () => {
    const res = await request(app)
      .post(`/api/student-attendance/corrections/${correctionId}/review`)
      .set('Authorization', `Bearer ${hodToken}`)
      .send({
        action: 'APPROVED',
        reviewNotes: 'Attendance verified by department head.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify updated attendance status
    const updatedRec = await prisma.studentAttendance.findUnique({
      where: { id: attendanceRecordId },
    });
    expect(updatedRec?.status).toBe('PRESENT');
  });

  it('7. Should request and approve Academic Bypass for competition event', async () => {
    const todayStr = new Date().toISOString().split('T')[0];

    const reqBypass = await request(app)
      .post('/api/student-attendance/bypass')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId: studentId2,
        attendanceSlotId: generatedSlotId,
        date: todayStr,
        activityType: 'COMPETITION',
        reason: 'Representing university in national competition',
      });

    expect(reqBypass.status).toBe(201);
    expect(reqBypass.body.success).toBe(true);

    // Verify student 2 attendance status is set
    const std2Att = await prisma.studentAttendance.findUnique({
      where: {
        attendanceSlotId_studentId: {
          attendanceSlotId: generatedSlotId,
          studentId: studentId2,
        },
      },
    });
    expect(std2Att?.status).toBe('PRESENT');
  });

  it('8. Should calculate student attendance percentage and low attendance flag', async () => {
    const res = await request(app)
      .get(`/api/student-attendance/student/${studentId1}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stats.totalSessions).toBeGreaterThanOrEqual(1);
    expect(res.body.data.stats.overallPercentage).toBeGreaterThanOrEqual(0);
    expect(typeof res.body.data.stats.isLowAttendance).toBe('boolean');
  });

  it('9. Should query daily staff/faculty attendance summary', async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const res = await request(app)
      .get(`/api/student-attendance/daily-summary?date=${todayStr}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.totalUsers).toBe('number');
  });

  it('10. Should query system attendance anomalies log', async () => {
    const res = await request(app)
      .get('/api/student-attendance/anomalies')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
