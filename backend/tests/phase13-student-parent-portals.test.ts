import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/prisma';
import { generateAccessToken as generateTestToken } from '../src/utils/jwt';

const app = createApp();

describe('Phase 13 — Complete Student & Parent/Guardian Portals Test Suite', () => {
  let studentAUserId: string;
  let studentAId: string;
  let studentAToken: string;

  let studentBUserId: string;
  let studentBId: string;
  let studentBToken: string;

  let guardianUserId: string;
  let guardianToken: string;

  let classId: string;
  let sectionId: string;
  let academicYearId: string;
  let subjectId: string;
  let examId: string;

  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Create Roles if needed
    let stdRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
    if (!stdRole) stdRole = await prisma.role.create({ data: { name: 'STUDENT', displayName: 'Student' } });

    let parentRole = await prisma.role.findUnique({ where: { name: 'PARENT' } });
    if (!parentRole) parentRole = await prisma.role.create({ data: { name: 'PARENT', displayName: 'Parent' } });

    // 2. Academic Infrastructure
    const ay = await prisma.academicYear.create({
      data: {
        name: `AY-P13-${timestamp}`,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-05-31'),
        isCurrent: true,
      },
    });
    academicYearId = ay.id;

    const dept = await prisma.department.create({
      data: {
        name: `Dept P13 ${timestamp}`,
        code: `DP13-${timestamp}`,
      },
    });

    const cls = await prisma.class.create({
      data: {
        name: `Grade 10 P13 ${timestamp}`,
        code: `G10P13-${timestamp}`,
        departmentId: dept.id,
        academicYearId: ay.id,
      },
    });
    classId = cls.id;

    const sec = await prisma.section.create({
      data: {
        name: 'A',
        classId: cls.id,
        capacity: 40,
      },
    });
    sectionId = sec.id;

    const subj = await prisma.subject.create({
      data: {
        name: `Mathematics P13 ${timestamp}`,
        code: `MATH13-${timestamp}`,
        departmentId: dept.id,
      },
    });
    subjectId = subj.id;

    // 3. Create Student A User & Student record
    const userA = await prisma.user.create({
      data: {
        email: `stdA-p13-${timestamp}@school.edu`,
        username: `stdA_p13_${timestamp}`,
        passwordHash: 'hash',
        firstName: 'Alice',
        lastName: 'Student',
        activeRole: 'STUDENT',
        status: 'ACTIVE',
      },
    });
    studentAUserId = userA.id;
    await prisma.userRole.create({ data: { userId: studentAUserId, roleId: stdRole.id } });
    studentAToken = generateTestToken({ userId: studentAUserId, email: userA.email, roles: ['STUDENT'], activeRole: 'STUDENT' });

    const stdA = await prisma.student.create({
      data: {
        userId: studentAUserId,
        admissionNumber: `ADM-13A-${timestamp}`,
        enrollmentNumber: `ENR-13A-${timestamp}`,
        sectionId: sec.id,
        departmentId: dept.id,
        academicYearId: ay.id,
        status: 'ACTIVE',
      },
    });
    studentAId = stdA.id;

    // 4. Create Student B User & Student record
    const userB = await prisma.user.create({
      data: {
        email: `stdB-p13-${timestamp}@school.edu`,
        username: `stdB_p13_${timestamp}`,
        passwordHash: 'hash',
        firstName: 'Bob',
        lastName: 'Student',
        activeRole: 'STUDENT',
        status: 'ACTIVE',
      },
    });
    studentBUserId = userB.id;
    await prisma.userRole.create({ data: { userId: studentBUserId, roleId: stdRole.id } });
    studentBToken = generateTestToken({ userId: studentBUserId, email: userB.email, roles: ['STUDENT'], activeRole: 'STUDENT' });

    const stdB = await prisma.student.create({
      data: {
        userId: studentBUserId,
        admissionNumber: `ADM-13B-${timestamp}`,
        enrollmentNumber: `ENR-13B-${timestamp}`,
        sectionId: sec.id,
        departmentId: dept.id,
        academicYearId: ay.id,
        status: 'ACTIVE',
      },
    });
    studentBId = stdB.id;

    // 5. Create Guardian User & Link to Student A and Student B
    const gUser = await prisma.user.create({
      data: {
        email: `parent-p13-${timestamp}@family.com`,
        username: `parent_p13_${timestamp}`,
        phone: `9898${timestamp.toString().slice(-6)}`,
        passwordHash: 'hash',
        firstName: 'John',
        lastName: 'Parent',
        activeRole: 'PARENT',
        status: 'ACTIVE',
      },
    });
    guardianUserId = gUser.id;
    await prisma.userRole.create({ data: { userId: guardianUserId, roleId: parentRole.id } });
    guardianToken = generateTestToken({ userId: guardianUserId, email: gUser.email, roles: ['PARENT'], activeRole: 'PARENT' });

    await prisma.guardianStudentRelationship.createMany({
      data: [
        { guardianUserId: guardianUserId, studentId: studentAId, relationship: 'FATHER', isPrimary: true },
        { guardianUserId: guardianUserId, studentId: studentBId, relationship: 'FATHER', isPrimary: false },
      ],
    });

    // 6. Create Exam & Published Result for Student A
    const exam = await prisma.examination.create({
      data: {
        name: `Term 1 Exam P13 ${timestamp}`,
        code: `EX13-${timestamp}`,
        examType: 'MID_TERM',
        academicYearId: ay.id,
        term: 'TERM-1',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-09-10'),
        status: 'PUBLISHED',
      },
    });
    examId = exam.id;

    await prisma.studentResultSnapshot.create({
      data: {
        resultNumber: `RES-13A-${timestamp}`,
        version: 1,
        examinationId: exam.id,
        studentId: studentAId,
        totalObtainedMarks: 90,
        totalMaxMarks: 100,
        overallPercentage: 90,
        grade: 'A+',
        gradePoint: 4.0,
        overallResult: 'PASS',
        verificationToken: `TOK-13A-${timestamp}`,
        publishedDate: new Date(),
        status: 'PUBLISHED',
      },
    });
  });

  // ----------------------------------------------------
  // STUDENT PORTAL TESTS
  // ----------------------------------------------------

  it('1. Should fetch Student Dashboard KPIs for authenticated student', async () => {
    const res = await request(app)
      .get('/api/student/dashboard')
      .set('Authorization', `Bearer ${studentAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.student.id).toBe(studentAId);
    expect(res.body.data.student.admissionNumber).toBeDefined();
    expect(res.body.data.attendance).toBeDefined();
  });

  it('2. Should reject cross-student data access with 403 Forbidden (Student A accessing Student B)', async () => {
    const res = await request(app)
      .get(`/api/student/attendance/${studentBId}`)
      .set('Authorization', `Bearer ${studentAToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('STUDENT_ACCESS_DENIED');
  });

  it('3. Should fetch own attendance breakdown for Student A', async () => {
    const res = await request(app)
      .get(`/api/student/attendance/${studentAId}`)
      .set('Authorization', `Bearer ${studentAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
  });

  it('4. Should submit Student Profile Update Request', async () => {
    const res = await request(app)
      .post(`/api/student/profile-update-requests/${studentAId}`)
      .set('Authorization', `Bearer ${studentAToken}`)
      .send({
        fieldChanges: { emergencyContact: '+1-555-0199', address: '123 New Tech Way' },
        reason: 'Relocated to new residence',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
  });

  it('5. Should submit Student Leave Request', async () => {
    const res = await request(app)
      .post(`/api/student/leave-requests/${studentAId}`)
      .set('Authorization', `Bearer ${studentAToken}`)
      .send({
        startDate: '2026-09-15',
        endDate: '2026-09-17',
        reason: 'Attending National Science Symposium',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalDays).toBe(3);
    expect(res.body.data.status).toBe('PENDING');
  });

  it('6. Should fetch student timetable', async () => {
    const res = await request(app)
      .get(`/api/student/timetable/${studentAId}`)
      .set('Authorization', `Bearer ${studentAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // ----------------------------------------------------
  // GUARDIAN PORTAL TESTS
  // ----------------------------------------------------

  it('7. Should fetch linked wards for Guardian', async () => {
    const res = await request(app)
      .get('/api/guardian/children')
      .set('Authorization', `Bearer ${guardianToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2); // Student A and Student B
  });

  it('8. Should fetch Guardian Dashboard defaulting to primary ward', async () => {
    const res = await request(app)
      .get('/api/guardian/dashboard')
      .set('Authorization', `Bearer ${guardianToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.activeWard.id).toBe(studentAId);
    expect(res.body.data.activeWard.results.length).toBe(1);
  });

  it('9. Should switch active ward on Guardian Dashboard (Student B)', async () => {
    const res = await request(app)
      .get(`/api/guardian/dashboard?studentId=${studentBId}`)
      .set('Authorization', `Bearer ${guardianToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.activeWard.id).toBe(studentBId);
  });

  it('10. Should reject Guardian access to unlinked student with 403 Forbidden', async () => {
    // Create unlinked Student C
    const unlinkedUser = await prisma.user.create({
      data: {
        email: `unlinked-${Date.now()}@school.edu`,
        username: `unlinked_${Date.now()}`,
        passwordHash: 'hash',
        firstName: 'Charlie',
        lastName: 'Unlinked',
        activeRole: 'STUDENT',
        status: 'ACTIVE',
      },
    });
    const unlinkedStd = await prisma.student.create({
      data: {
        userId: unlinkedUser.id,
        admissionNumber: `ADM-UNLINKED-${Date.now()}`,
        status: 'ACTIVE',
      },
    });

    const res = await request(app)
      .get(`/api/guardian/children/${unlinkedStd.id}/results`)
      .set('Authorization', `Bearer ${guardianToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('GUARDIAN_WARD_ACCESS_DENIED');
  });

  it('11. Should fetch published results for linked ward (Student A)', async () => {
    const res = await request(app)
      .get(`/api/guardian/children/${studentAId}/results`)
      .set('Authorization', `Bearer ${guardianToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].overallPercentage).toBe(90);
  });

  it('12. Should fetch fees and payment history for linked ward (Student A)', async () => {
    const res = await request(app)
      .get(`/api/guardian/children/${studentAId}/fees`)
      .set('Authorization', `Bearer ${guardianToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.feeAssignments).toBeDefined();
    expect(res.body.data.payments).toBeDefined();
  });

  it('13. Should update Guardian communication preferences', async () => {
    const res = await request(app)
      .put('/api/guardian/preferences')
      .set('Authorization', `Bearer ${guardianToken}`)
      .send({
        whatsAppEnabled: true,
        emailEnabled: true,
        inAppEnabled: true,
        smsEnabled: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.smsEnabled).toBe(true);
  });

  it('14. Should reject access if student account status is SUSPENDED', async () => {
    // Suspend Student A user
    await prisma.user.update({
      where: { id: studentAUserId },
      data: { status: 'SUSPENDED' },
    });

    const res = await request(app)
      .get('/api/student/dashboard')
      .set('Authorization', `Bearer ${studentAToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');

    // Restore status
    await prisma.user.update({
      where: { id: studentAUserId },
      data: { status: 'ACTIVE' },
    });
  });

  it('15. Should reject access if student status is LEFT_INSTITUTION', async () => {
    await prisma.student.update({
      where: { id: studentBId },
      data: { status: 'LEFT_INSTITUTION' },
    });

    const res = await request(app)
      .get(`/api/student/attendance/${studentBId}`)
      .set('Authorization', `Bearer ${studentBToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('STUDENT_LEFT_INSTITUTION');
  });
});
