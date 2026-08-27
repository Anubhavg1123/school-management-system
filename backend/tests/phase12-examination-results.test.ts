import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/prisma';
import { generateAccessToken as generateTestToken } from '../src/utils/jwt';
import { UserRoleEnum } from '../src/types';

const app = createApp();

describe('Phase 12 — Complete Examination, Results & Academic Performance Test Suite', () => {
  let adminToken: string;
  let adminUserId: string;
  let facultyToken: string;
  let facultyUserId: string;
  let hodToken: string;
  let hodUserId: string;
  let studentToken: string;
  let studentUserId: string;

  let academicYearId: string;
  let departmentId: string;
  let classId: string;
  let sectionId: string;
  let subjectId: string;
  let roomId: string;
  let facultyId: string;
  let studentId: string;

  let examinationId: string;
  let examSubjectId: string;
  let studentMarksId: string;
  let verificationToken: string;

  beforeAll(async () => {
    // 1. Create test users
    const adminUser = await prisma.user.create({
      data: {
        email: `admin-p12-${Date.now()}@school.edu`,
        username: `admin_p12_${Date.now()}`,
        passwordHash: 'hash',
        firstName: 'Principal',
        lastName: 'Admin',
        activeRole: UserRoleEnum.SUPER_ADMIN,
        status: 'ACTIVE',
      },
    });
    adminUserId = adminUser.id;
    let adminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
    if (!adminRole) adminRole = await prisma.role.create({ data: { name: 'SUPER_ADMIN', displayName: 'Super Admin' } });
    await prisma.userRole.create({ data: { userId: adminUserId, roleId: adminRole.id } });
    adminToken = generateTestToken({ userId: adminUserId, email: adminUser.email, roles: ['SUPER_ADMIN'], activeRole: 'SUPER_ADMIN' });

    const hodUser = await prisma.user.create({
      data: {
        email: `hod-p12-${Date.now()}@school.edu`,
        username: `hod_p12_${Date.now()}`,
        passwordHash: 'hash',
        firstName: 'HOD',
        lastName: 'Science',
        activeRole: 'HOD',
        status: 'ACTIVE',
      },
    });
    hodUserId = hodUser.id;
    let hodRole = await prisma.role.findUnique({ where: { name: 'HOD' } });
    if (!hodRole) hodRole = await prisma.role.create({ data: { name: 'HOD', displayName: 'HOD' } });
    await prisma.userRole.create({ data: { userId: hodUserId, roleId: hodRole.id } });
    hodToken = generateTestToken({ userId: hodUserId, email: hodUser.email, roles: ['HOD'], activeRole: 'HOD' });

    const facultyUser = await prisma.user.create({
      data: {
        email: `fac-p12-${Date.now()}@school.edu`,
        username: `fac_p12_${Date.now()}`,
        passwordHash: 'hash',
        firstName: 'Faculty',
        lastName: 'Examiner',
        activeRole: 'FACULTY',
        status: 'ACTIVE',
      },
    });
    facultyUserId = facultyUser.id;
    let facRole = await prisma.role.findUnique({ where: { name: 'FACULTY' } });
    if (!facRole) facRole = await prisma.role.create({ data: { name: 'FACULTY', displayName: 'Faculty' } });
    await prisma.userRole.create({ data: { userId: facultyUserId, roleId: facRole.id } });
    facultyToken = generateTestToken({ userId: facultyUserId, email: facultyUser.email, roles: ['FACULTY'], activeRole: 'FACULTY' });

    const stdUser = await prisma.user.create({
      data: {
        email: `std-p12-${Date.now()}@school.edu`,
        username: `std_p12_${Date.now()}`,
        passwordHash: 'hash',
        firstName: 'Alice',
        lastName: 'Student',
        activeRole: 'STUDENT',
        status: 'ACTIVE',
      },
    });
    studentUserId = stdUser.id;
    let stdRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
    if (!stdRole) stdRole = await prisma.role.create({ data: { name: 'STUDENT', displayName: 'Student' } });
    await prisma.userRole.create({ data: { userId: studentUserId, roleId: stdRole.id } });
    studentToken = generateTestToken({ userId: studentUserId, email: stdUser.email, roles: ['STUDENT'], activeRole: 'STUDENT' });

    // 2. Academic Infrastructure
    const ay = await prisma.academicYear.create({
      data: { name: `AY 2026-P12-${Date.now()}`, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), isCurrent: true },
    });
    academicYearId = ay.id;

    const dept = await prisma.department.create({
      data: { code: `CS-P12-${Date.now()}`, name: 'Computer Science' },
    });
    departmentId = dept.id;

    const cls = await prisma.class.create({
      data: { name: 'Grade 10', code: `CLS-P12-${Date.now()}`, academicYearId, departmentId },
    });
    classId = cls.id;

    const sec = await prisma.section.create({
      data: { name: 'Section A', classId },
    });
    sectionId = sec.id;

    const subj = await prisma.subject.create({
      data: { code: `CS101-P12-${Date.now()}`, name: 'Mathematics', type: 'THEORY', departmentId },
    });
    subjectId = subj.id;

    const rm = await prisma.room.create({
      data: { roomNumber: `R-P12-${Date.now()}`, name: 'Exam Hall 1', building: 'Block A', capacity: 100 },
    });
    roomId = rm.id;

    const fac = await prisma.faculty.create({
      data: { userId: facultyUserId, employeeCode: `EMP-P12-${Date.now()}`, departmentId, designation: 'ASST_PROFESSOR' },
    });
    facultyId = fac.id;

    const std = await prisma.student.create({
      data: {
        userId: studentUserId,
        admissionNumber: `ADM-P12-${Date.now()}`,
        academicYearId,
        departmentId,
        sectionId,
        status: 'ACTIVE',
      },
    });
    studentId = std.id;
  });

  it('1. Should create an Examination Master in DRAFT status', async () => {
    const res = await request(app)
      .post('/api/examinations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Mid-Term Examination 2026',
        code: `EXAM-MT-${Date.now()}`,
        examType: 'MID_TERM',
        academicYearId,
        term: 'SEM-1',
        startDate: '2026-09-01',
        endDate: '2026-09-15',
        classIds: [classId],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('DRAFT');
    examinationId = res.body.data.id;
  });

  it('2. Should schedule an Examination Subject paper with max/pass marks', async () => {
    const res = await request(app)
      .post('/api/examinations/schedule-subject')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        examinationId,
        classId,
        subjectId,
        maxTheoryMarks: 80,
        maxPracticalMarks: 0,
        maxInternalMarks: 20,
        totalMaxMarks: 100,
        passingMarks: 40,
        examDate: '2026-09-05',
        startTime: '09:30',
        endTime: '12:30',
        roomId,
        invigilatorFacultyId: facultyId,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalMaxMarks).toBe(100);
    examSubjectId = res.body.data.id;
  });

  it('3. Should reject room double-booking conflict', async () => {
    // Attempt to schedule another subject paper in same room at same date & time
    const otherSubj = await prisma.subject.create({
      data: { code: `PHY-P12-${Date.now()}`, name: 'Physics', type: 'THEORY', departmentId },
    });

    const res = await request(app)
      .post('/api/examinations/schedule-subject')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        examinationId,
        classId,
        subjectId: otherSubj.id,
        examDate: '2026-09-05',
        startTime: '09:30',
        endTime: '12:30',
        roomId,
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ROOM_CONFLICT_DETECTED');
  });

  it('4. Should resolve student Exam Eligibility based on attendance %', async () => {
    const res = await request(app)
      .post(`/api/examinations/${examinationId}/resolve-eligibility`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].status).toBe('ELIGIBLE');
  });

  it('5. Should record paper-wise Exam Attendance roll-call', async () => {
    const res = await request(app)
      .post('/api/examinations/attendance')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        examinationSubjectId: examSubjectId,
        attendances: [{ studentId, status: 'PRESENT', seatNumber: 'SEAT-101' }],
      });

    expect(res.status).toBe(200);
    expect(res.body.data[0].status).toBe('PRESENT');
    expect(res.body.data[0].seatNumber).toBe('SEAT-101');
  });

  it('6. Should reject marks entry exceeding maximum limits ($Obtained > Max$)', async () => {
    const res = await request(app)
      .post('/api/marks/submit-batch')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        examinationSubjectId: examSubjectId,
        marks: [
          {
            studentId,
            obtainedTheoryMarks: 95, // Exceeds max Theory (80)
            obtainedInternalMarks: 15,
          },
        ],
        isDraft: true,
      });

    expect(res.status).toBe(400);
  });

  it('7. Should allow Faculty to submit valid marks batch', async () => {
    const res = await request(app)
      .post('/api/marks/submit-batch')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        examinationSubjectId: examSubjectId,
        marks: [
          {
            studentId,
            obtainedTheoryMarks: 70,
            obtainedInternalMarks: 18,
            isAbsent: false,
          },
        ],
        isDraft: false, // SUBMITTED
      });

    expect(res.status).toBe(200);
    expect(res.body.data[0].totalObtainedMarks).toBe(88);
    expect(res.body.data[0].status).toBe('SUBMITTED');
    studentMarksId = res.body.data[0].id;
  });

  it('8. Should allow HOD to verify submitted subject marks', async () => {
    const res = await request(app)
      .post(`/api/marks/verify/${examSubjectId}`)
      .set('Authorization', `Bearer ${hodToken}`)
      .send({
        action: 'VERIFIED',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('VERIFIED');
  });

  it('9. Should execute Centralized Result Engine & generate immutable Result Snapshot v1', async () => {
    const res = await request(app)
      .post(`/api/results/${examinationId}/calculate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].overallPercentage).toBe(88);
    expect(res.body.data[0].grade).toBe('A');
    expect(res.body.data[0].version).toBe(1);
    verificationToken = res.body.data[0].verificationToken;
  });

  it('10. Should reject Student result view when result is not yet PUBLISHED', async () => {
    const res = await request(app)
      .get(`/api/results/students/${studentId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0); // Hides draft/un-published results
  });

  it('11. Should publish exam results & trigger parent notifications', async () => {
    const res = await request(app)
      .post(`/api/results/${examinationId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.publishedCount).toBeGreaterThan(0);
  });

  it('12. Should allow Student to view PUBLISHED result', async () => {
    const res = await request(app)
      .get(`/api/results/students/${studentId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].overallPercentage).toBe(88);
    expect(res.body.data[0].status).toBe('PUBLISHED');
  });

  it('13. Should verify QR verification token lookup endpoint', async () => {
    const res = await request(app).get(`/api/results/verify-token/${verificationToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isValid).toBe(true);
    expect(res.body.data.grade).toBe('A');
    expect(res.body.data.overallPercentage).toBe(88);
  });

  it('14. Should handle post-publication Marks Correction Request workflow producing Result v2', async () => {
    // 1. Request correction
    const reqRes = await request(app)
      .post('/api/marks/corrections/request')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        studentMarksId,
        requestedMarks: 92,
        reason: 'Recounting error in Section B theory answer sheet',
      });

    expect(reqRes.status).toBe(201);
    const corrId = reqRes.body.data.id;

    // 2. HOD approves correction
    const revRes = await request(app)
      .post(`/api/marks/corrections/${corrId}/review`)
      .set('Authorization', `Bearer ${hodToken}`)
      .send({ action: 'APPROVED' });

    expect(revRes.status).toBe(200);

    // 3. Recalculate results -> Creates version 2
    const calcRes = await request(app)
      .post(`/api/results/${examinationId}/calculate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(calcRes.status).toBe(200);
    const v2Snap = calcRes.body.data.find((s: any) => s.studentId === studentId && s.version === 2);
    expect(v2Snap).toBeDefined();
    expect(v2Snap.overallPercentage).toBe(92);
    expect(v2Snap.grade).toBe('A+');
  });

  it('15. Should fetch Student Academic Performance Trend Analytics', async () => {
    const res = await request(app)
      .get(`/api/academic-performance/students/${studentId}/trend`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.hasEnoughData).toBe(true);
    expect(res.body.data.examTrends.length).toBeGreaterThan(0);
  });
});
