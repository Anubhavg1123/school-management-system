import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const app = createApp();
const prisma = new PrismaClient();

describe('Attendance Rules & Class Coordinator Permissions Test Suite', () => {
  let superAdminToken: string;
  let normalFacultyToken: string;
  let coordinatorFacultyToken: string;
  let otherFacultyToken: string;
  let studentToken: string;

  let superAdminUser: any;
  let normalFacultyUser: any;
  let coordinatorFacultyUser: any;
  let otherFacultyUser: any;

  let academicYear: any;
  let department: any;
  let testClass: any;
  let sectionA: any;
  let sectionB: any;
  let subject: any;
  let timeSlot: any;
  let studentSectionA: any;
  let studentSectionB: any;
  let slotA: any;

  beforeAll(async () => {
    // 1. Clean test-specific records
    const testEmails = [
      'faculty.normal@school.edu',
      'faculty.coordinator@school.edu',
      'faculty.other@school.edu',
      'student.a@school.edu',
      'student.b@school.edu',
    ];

    await prisma.academicBypassRequest.deleteMany({});
    await prisma.studentAttendanceCorrection.deleteMany({});
    await prisma.studentAttendance.deleteMany({});
    await prisma.attendanceSlot.deleteMany({});
    await prisma.timetableEntry.deleteMany({});
    await prisma.facultyAvailability.deleteMany({});
    await prisma.facultySubjectAssignment.deleteMany({});
    await prisma.classCoordinatorHistory.deleteMany({});
    await prisma.student.deleteMany({ where: { user: { email: { in: testEmails } } } });
    await prisma.section.deleteMany({ where: { name: { in: ['Section A', 'Section B'] } } });
    await prisma.classSubject.deleteMany({});
    await prisma.class.deleteMany({ where: { code: 'G10' } });
    await prisma.subject.deleteMany({ where: { code: 'MATH101' } });
    await prisma.timeSlot.deleteMany({});
    await prisma.faculty.deleteMany({ where: { user: { email: { in: testEmails } } } });
    await prisma.userRole.deleteMany({ where: { user: { email: { in: testEmails } } } });
    await prisma.user.deleteMany({ where: { email: { in: testEmails } } });

    // Ensure roles exist
    const roles = ['SUPER_ADMIN', 'OFFICE_ADMIN', 'HOD', 'FACULTY', 'STUDENT', 'GUARDIAN'];
    for (const r of roles) {
      await prisma.role.upsert({
        where: { name: r },
        update: {},
        create: { name: r, displayName: r, description: `${r} role` },
      });
    }

    const passwordHash = await bcrypt.hash('Admin@SecurePassword2026!', 10);

    // 2. Create or find Academic Year and Department
    academicYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    if (!academicYear) {
      academicYear = await prisma.academicYear.create({
        data: {
          name: '2026-2027 Academic Year',
          startDate: new Date('2026-06-01'),
          endDate: new Date('2027-05-31'),
          isCurrent: true,
        },
      });
    }

    department = await prisma.department.findUnique({ where: { code: 'SCI' } });
    if (!department) {
      department = await prisma.department.create({
        data: {
          code: 'SCI',
          name: 'Science Department',
        },
      });
    }

    // 3. Ensure Super Admin exists
    const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
    superAdminUser = await prisma.user.upsert({
      where: { email: 'principal@school.edu' },
      update: {
        status: 'ACTIVE',
        passwordHash,
      },
      create: {
        email: 'principal@school.edu',
        username: 'principal',
        passwordHash,
        firstName: 'Principal',
        lastName: 'Admin',
        status: 'ACTIVE',
      },
    });

    if (superAdminRole) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: superAdminUser.id,
            roleId: superAdminRole.id,
          },
        },
        update: { isPrimary: true },
        create: {
          userId: superAdminUser.id,
          roleId: superAdminRole.id,
          isPrimary: true,
        },
      });
    }

    // 4. Create Normal Faculty
    normalFacultyUser = await prisma.user.create({
      data: {
        email: 'faculty.normal@school.edu',
        passwordHash,
        firstName: 'Normal',
        lastName: 'Teacher',
        status: 'ACTIVE',
        userRoles: {
          create: {
            role: { connect: { name: 'FACULTY' } },
          },
        },
        facultyProfile: {
          create: {
            employeeCode: 'FAC-001',
            designation: 'Teacher',
            status: 'ACTIVE',
            departmentId: department.id,
          },
        },
      },
      include: { facultyProfile: true },
    });

    // 5. Create Coordinator Faculty
    coordinatorFacultyUser = await prisma.user.create({
      data: {
        email: 'faculty.coordinator@school.edu',
        passwordHash,
        firstName: 'Coordinator',
        lastName: 'Teacher',
        status: 'ACTIVE',
        userRoles: {
          create: {
            role: { connect: { name: 'FACULTY' } },
          },
        },
        facultyProfile: {
          create: {
            employeeCode: 'FAC-002',
            designation: 'Senior Teacher',
            status: 'ACTIVE',
            departmentId: department.id,
          },
        },
      },
      include: { facultyProfile: true },
    });

    // 6. Create Other Faculty
    otherFacultyUser = await prisma.user.create({
      data: {
        email: 'faculty.other@school.edu',
        passwordHash,
        firstName: 'Other',
        lastName: 'Teacher',
        status: 'ACTIVE',
        userRoles: {
          create: {
            role: { connect: { name: 'FACULTY' } },
          },
        },
        facultyProfile: {
          create: {
            employeeCode: 'FAC-003',
            designation: 'Assistant Teacher',
            status: 'ACTIVE',
            departmentId: department.id,
          },
        },
      },
      include: { facultyProfile: true },
    });

    // 7. Create Class
    testClass = await prisma.class.create({
      data: {
        name: 'Grade 10',
        code: 'G10',
        academicYearId: academicYear.id,
        departmentId: department.id,
      },
    });

    // Section A has coordinatorFacultyUser assigned as coordinator
    sectionA = await prisma.section.create({
      data: {
        name: 'Section A',
        classId: testClass.id,
        coordinatorFacultyId: coordinatorFacultyUser.facultyProfile.id,
        coordinatorHistories: {
          create: {
            facultyId: coordinatorFacultyUser.facultyProfile.id,
            academicYearId: academicYear.id,
            assignedByUserId: superAdminUser.id,
            status: 'ACTIVE',
            reason: 'Assigned as Class Coordinator for Grade 10-A',
          },
        },
      },
    });

    // Section B has NO coordinator assigned
    sectionB = await prisma.section.create({
      data: {
        name: 'Section B',
        classId: testClass.id,
      },
    });

    subject = await prisma.subject.create({
      data: {
        code: 'MATH101',
        name: 'Mathematics',
        type: 'THEORY',
      },
    });

    timeSlot = await prisma.timeSlot.create({
      data: {
        academicYearId: academicYear.id,
        dayOfWeek: 'MONDAY',
        periodNumber: 1,
        name: 'Period 1',
        startTime: '09:00',
        endTime: '10:00',
      },
    });

    // Create Student in Section A
    const stdAUser = await prisma.user.create({
      data: {
        email: 'student.a@school.edu',
        passwordHash,
        firstName: 'Alice',
        lastName: 'Smith',
        status: 'ACTIVE',
        userRoles: {
          create: {
            role: { connect: { name: 'STUDENT' } },
          },
        },
      },
    });

    studentSectionA = await prisma.student.create({
      data: {
        userId: stdAUser.id,
        admissionNumber: 'ADM-1001',
        rollNumber: '101',
        sectionId: sectionA.id,
        departmentId: department.id,
        status: 'ACTIVE',
      },
    });

    // Create Student in Section B
    const stdBUser = await prisma.user.create({
      data: {
        email: 'student.b@school.edu',
        passwordHash,
        firstName: 'Bob',
        lastName: 'Jones',
        status: 'ACTIVE',
        userRoles: {
          create: {
            role: { connect: { name: 'STUDENT' } },
          },
        },
      },
    });

    studentSectionB = await prisma.student.create({
      data: {
        userId: stdBUser.id,
        admissionNumber: 'ADM-1002',
        rollNumber: '102',
        sectionId: sectionB.id,
        departmentId: department.id,
        status: 'ACTIVE',
      },
    });

    // Create attendance slot for Section A assigned to normalFacultyUser
    slotA = await prisma.attendanceSlot.create({
      data: {
        academicYearId: academicYear.id,
        classId: testClass.id,
        sectionId: sectionA.id,
        subjectId: subject.id,
        facultyId: normalFacultyUser.facultyProfile.id,
        date: '2026-08-25',
        startTime: '09:00',
        endTime: '10:00',
        timeSlotId: timeSlot.id,
        status: 'PENDING',
      },
    });

    // Authenticate users
    const resAdmin = await request(app).post('/api/auth/login').send({
      identifier: 'principal@school.edu',
      password: 'Admin@SecurePassword2026!',
    });
    superAdminToken = resAdmin.body.data.tokens.accessToken;

    const resNormal = await request(app).post('/api/auth/login').send({
      identifier: 'faculty.normal@school.edu',
      password: 'Admin@SecurePassword2026!',
    });
    normalFacultyToken = resNormal.body.data.tokens.accessToken;

    const resCoord = await request(app).post('/api/auth/login').send({
      identifier: 'faculty.coordinator@school.edu',
      password: 'Admin@SecurePassword2026!',
    });
    coordinatorFacultyToken = resCoord.body.data.tokens.accessToken;

    const resOther = await request(app).post('/api/auth/login').send({
      identifier: 'faculty.other@school.edu',
      password: 'Admin@SecurePassword2026!',
    });
    otherFacultyToken = resOther.body.data.tokens.accessToken;

    const resStd = await request(app).post('/api/auth/login').send({
      identifier: 'student.a@school.edu',
      password: 'Admin@SecurePassword2026!',
    });
    studentToken = resStd.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // TEST 1: Normal Faculty - Mark Present (SUCCESS)
  it('1. Normal Faculty should successfully mark student PRESENT', async () => {
    const res = await request(app)
      .post('/api/student-attendance/submit')
      .set('Authorization', `Bearer ${normalFacultyToken}`)
      .send({
        slotId: slotA.id,
        studentRecords: [
          {
            studentId: studentSectionA.id,
            status: 'PRESENT',
            remarks: 'On time in class',
          },
        ],
        isFinalize: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const record = await prisma.studentAttendance.findUnique({
      where: {
        attendanceSlotId_studentId: {
          attendanceSlotId: slotA.id,
          studentId: studentSectionA.id,
        },
      },
    });
    expect(record?.status).toBe('PRESENT');
  });

  // TEST 2: Normal Faculty - Mark Absent (SUCCESS)
  it('2. Normal Faculty should successfully mark student ABSENT', async () => {
    const res = await request(app)
      .post('/api/student-attendance/submit')
      .set('Authorization', `Bearer ${normalFacultyToken}`)
      .send({
        slotId: slotA.id,
        studentRecords: [
          {
            studentId: studentSectionA.id,
            status: 'ABSENT',
            remarks: 'Not in classroom',
          },
        ],
        isFinalize: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const record = await prisma.studentAttendance.findUnique({
      where: {
        attendanceSlotId_studentId: {
          attendanceSlotId: slotA.id,
          studentId: studentSectionA.id,
        },
      },
    });
    expect(record?.status).toBe('ABSENT');
  });

  // TEST 3: Normal Faculty - Try to submit LATE or unauthorized status (REJECTED)
  it('3. Normal Faculty submitting LATE or EXCUSED should be rejected with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/student-attendance/submit')
      .set('Authorization', `Bearer ${normalFacultyToken}`)
      .send({
        slotId: slotA.id,
        studentRecords: [
          {
            studentId: studentSectionA.id,
            status: 'LATE',
            remarks: 'Arrived late',
          },
        ],
      });

    expect([400, 422]).toContain(res.status);
  });

  // TEST 4: Normal Faculty - Direct Bypass Attempt (REJECTED with 403 Forbidden)
  it('4. Normal non-coordinator faculty attempting School Activity Bypass must be rejected with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/student-attendance/bypass')
      .set('Authorization', `Bearer ${normalFacultyToken}`)
      .send({
        studentId: studentSectionA.id,
        attendanceSlotId: slotA.id,
        date: '2026-08-25',
        activityType: 'SPORTS',
        reason: 'District Athletics Meet',
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('COORDINATOR_AUTHORIZATION_REQUIRED');
  });

  // TEST 5: Assigned Class Coordinator - School Activity Bypass (SUCCESS)
  it('5. Assigned Class Coordinator should successfully apply School Activity Bypass for their section', async () => {
    const res = await request(app)
      .post('/api/student-attendance/bypass')
      .set('Authorization', `Bearer ${coordinatorFacultyToken}`)
      .send({
        studentId: studentSectionA.id,
        attendanceSlotId: slotA.id,
        date: '2026-08-25',
        activityType: 'SPORTS',
        reason: 'Representing school in State Level Football Tournament',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const record = await prisma.studentAttendance.findUnique({
      where: {
        attendanceSlotId_studentId: {
          attendanceSlotId: slotA.id,
          studentId: studentSectionA.id,
        },
      },
    });
    expect(record?.status).toBe('PRESENT');
    expect(record?.remarks).toContain('School Activity Bypass: SPORTS');
  });

  // TEST 6: Class Coordinator - Try to bypass student in unassigned section (REJECTED with 403)
  it('6. Class Coordinator attempting bypass on a student from another section must be rejected with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/student-attendance/bypass')
      .set('Authorization', `Bearer ${coordinatorFacultyToken}`)
      .send({
        studentId: studentSectionB.id,
        date: '2026-08-25',
        activityType: 'COMPETITION',
        reason: 'Inter-school science quiz representation',
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('COORDINATOR_AUTHORIZATION_REQUIRED');
  });

  // TEST 7: Coordinator Reassignment - Permissions transfer immediately
  it('7. Reassigning Coordinator transfers special permissions immediately', async () => {
    // Principal reassigns Section A coordinator to otherFacultyUser
    const assignRes = await request(app)
      .post(`/api/academic/sections/${sectionA.id}/assign-coordinator`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        facultyId: otherFacultyUser.facultyProfile.id,
        academicYearId: academicYear.id,
        reason: 'Mid-term coordinator rotation',
      });

    expect(assignRes.status).toBe(200);

    // Old coordinator should now be REJECTED (403)
    const oldCoordRes = await request(app)
      .post('/api/student-attendance/bypass')
      .set('Authorization', `Bearer ${coordinatorFacultyToken}`)
      .send({
        studentId: studentSectionA.id,
        date: '2026-08-25',
        activityType: 'ACADEMIC_EVENT',
        reason: 'National Mathematics Olympiad',
      });

    expect(oldCoordRes.status).toBe(403);

    // New coordinator should now SUCCEED (201)
    const newCoordRes = await request(app)
      .post('/api/student-attendance/bypass')
      .set('Authorization', `Bearer ${otherFacultyToken}`)
      .send({
        studentId: studentSectionA.id,
        date: '2026-08-25',
        activityType: 'ACADEMIC_EVENT',
        reason: 'National Mathematics Olympiad',
      });

    expect(newCoordRes.status).toBe(201);
  });

  // TEST 8: Coordinator Assignment Authorization - Normal faculty cannot assign
  it('8. Normal Faculty cannot assign Class Coordinators (403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/academic/sections/${sectionA.id}/assign-coordinator`)
      .set('Authorization', `Bearer ${normalFacultyToken}`)
      .send({
        facultyId: normalFacultyUser.facultyProfile.id,
        academicYearId: academicYear.id,
        reason: 'Self appointment',
      });

    expect(res.status).toBe(403);
  });

  // TEST 9: Validation - Casual / Personal reasons or short reason rejected (400 Bad Request)
  it('9. School Activity Bypass with invalid/casual reason or short text must be rejected', async () => {
    // Reason too short (<5 chars)
    const shortRes = await request(app)
      .post('/api/student-attendance/bypass')
      .set('Authorization', `Bearer ${otherFacultyToken}`)
      .send({
        studentId: studentSectionA.id,
        date: '2026-08-25',
        activityType: 'SPORTS',
        reason: 'bad',
      });

    expect([400, 422]).toContain(shortRes.status);

    // Casual/personal reason
    const casualRes = await request(app)
      .post('/api/student-attendance/bypass')
      .set('Authorization', `Bearer ${otherFacultyToken}`)
      .send({
        studentId: studentSectionA.id,
        date: '2026-08-25',
        activityType: 'SPORTS',
        reason: 'personal work',
      });

    expect([400, 422]).toContain(casualRes.status);
  });

  // TEST 10: Unauthorized student attempt (403 Forbidden)
  it('10. Student role cannot bypass attendance or submit roll call (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/student-attendance/bypass')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId: studentSectionA.id,
        date: '2026-08-25',
        activityType: 'SPORTS',
        reason: 'Self bypass',
      });

    expect(res.status).toBe(403);
  });
});
