import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const app = createApp();
const prisma = new PrismaClient();

describe('Phase 7 — Complete Real Faculty Portal Integration Tests', () => {
  let adminToken: string;
  let facultyAToken: string;
  let facultyBToken: string;

  let academicYearId: string;
  let departmentId: string;
  let classId: string;
  let section1Id: string;
  let section2Id: string;
  let subjectId: string;
  let roomId: string;

  let facultyAId: string;
  let facultyBId: string;
  let student1Id: string;
  let student2Id: string;

  let draftAssignmentId: string;
  let vehicleRegistrationId: string;

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
      where: { name: '2026-2027-Phase7' },
      update: { isCurrent: true },
      create: {
        name: '2026-2027-Phase7',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-05-31'),
        isCurrent: true,
      },
    });
    academicYearId = year.id;

    // 3. Setup Department & Room
    const dept = await prisma.department.upsert({
      where: { code: 'FAC-CS' },
      update: {},
      create: {
        code: 'FAC-CS',
        name: 'Faculty Computer Science',
      },
    });
    departmentId = dept.id;

    const room = await prisma.room.upsert({
      where: { roomNumber: 'R-FAC-101' },
      update: {},
      create: {
        roomNumber: 'R-FAC-101',
        name: 'Faculty Lab',
        building: 'Block B',
      },
    });
    roomId = room.id;

    // 4. Create Faculty A User & Profile
    const facAUser = await prisma.user.upsert({
      where: { email: 'faca.portal7@school.edu' },
      update: { passwordHash: defaultPassword, status: 'ACTIVE', activeRole: 'FACULTY', failedLoginAttempts: 0, lockoutUntil: null },
      create: {
        email: 'faca.portal7@school.edu',
        username: 'faca_portal7',
        passwordHash: defaultPassword,
        firstName: 'Alice',
        lastName: 'Faculty',
        status: 'ACTIVE',
        activeRole: 'FACULTY',
      },
    });

    const facRole = await prisma.role.findUnique({ where: { name: 'FACULTY' } });
    if (facRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: facAUser.id, roleId: facRole.id } },
        update: {},
        create: { userId: facAUser.id, roleId: facRole.id, isPrimary: true },
      });
    }

    const facAProfile = await prisma.faculty.upsert({
      where: { userId: facAUser.id },
      update: {},
      create: {
        userId: facAUser.id,
        employeeCode: 'EMP-FACA-007',
        departmentId: dept.id,
        designation: 'ASST_PROFESSOR',
      },
    });
    facultyAId = facAProfile.id;

    const facALogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'faca.portal7@school.edu', password: 'Admin@SecurePassword2026!', role: 'FACULTY' });
    expect(facALogin.status).toBe(200);
    facultyAToken = facALogin.body.data.tokens.accessToken;

    // 5. Create Faculty B User & Profile (Unassigned for Faculty A tests)
    const facBUser = await prisma.user.upsert({
      where: { email: 'facb.portal7@school.edu' },
      update: { passwordHash: defaultPassword, status: 'ACTIVE', activeRole: 'FACULTY', failedLoginAttempts: 0, lockoutUntil: null },
      create: {
        email: 'facb.portal7@school.edu',
        username: 'facb_portal7',
        passwordHash: defaultPassword,
        firstName: 'Bob',
        lastName: 'Faculty',
        status: 'ACTIVE',
        activeRole: 'FACULTY',
      },
    });

    if (facRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: facBUser.id, roleId: facRole.id } },
        update: {},
        create: { userId: facBUser.id, roleId: facRole.id, isPrimary: true },
      });
    }

    const facBProfile = await prisma.faculty.upsert({
      where: { userId: facBUser.id },
      update: {},
      create: {
        userId: facBUser.id,
        employeeCode: 'EMP-FACB-007',
        departmentId: dept.id,
        designation: 'LECTURER',
      },
    });
    facultyBId = facBProfile.id;

    const facBLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'facb.portal7@school.edu', password: 'Admin@SecurePassword2026!', role: 'FACULTY' });
    facultyBToken = facBLogin.body.data.tokens.accessToken;

    // 6. Setup Class, Sections, and Subject
    const cls = await prisma.class.upsert({
      where: { code: 'FAC-CLS-10' },
      update: { academicYearId },
      create: {
        code: 'FAC-CLS-10',
        name: 'Class 10 Faculty Portal',
        academicYearId,
        departmentId: dept.id,
      },
    });
    classId = cls.id;

    const sec1 = await prisma.section.upsert({
      where: { classId_name: { classId: cls.id, name: 'Section A' } },
      update: { coordinatorFacultyId: facultyAId },
      create: {
        classId: cls.id,
        name: 'Section A',
        capacity: 50,
        coordinatorFacultyId: facultyAId,
      },
    });
    section1Id = sec1.id;

    const sec2 = await prisma.section.upsert({
      where: { classId_name: { classId: cls.id, name: 'Section B' } },
      update: { coordinatorFacultyId: facultyBId },
      create: {
        classId: cls.id,
        name: 'Section B',
        capacity: 50,
        coordinatorFacultyId: facultyBId,
      },
    });
    section2Id = sec2.id;

    const subj = await prisma.subject.upsert({
      where: { code: 'SUB-FAC-101' },
      update: {},
      create: {
        code: 'SUB-FAC-101',
        name: 'Advanced Programming',
        type: 'THEORY',
        credits: 4.0,
        departmentId: dept.id,
      },
    });
    subjectId = subj.id;

    // 7. Assign Faculty A to Subject in Section 1
    await prisma.facultySubjectAssignment.upsert({
      where: { id: `FSA-FACA-${sec1.id}` },
      update: { status: 'ACTIVE' },
      create: {
        id: `FSA-FACA-${sec1.id}`,
        academicYearId,
        facultyId: facultyAId,
        classId: cls.id,
        sectionId: sec1.id,
        subjectId: subj.id,
        status: 'ACTIVE',
      },
    });

    // 8. Create Student 1 (Enrolled in Section 1 - Faculty A's class)
    const std1User = await prisma.user.upsert({
      where: { email: 'std1.fac@school.edu' },
      update: {},
      create: {
        email: 'std1.fac@school.edu',
        username: 'std1_fac',
        passwordHash: defaultPassword,
        firstName: 'Alice',
        lastName: 'Student',
        status: 'ACTIVE',
        activeRole: 'STUDENT',
      },
    });

    const std1 = await prisma.student.upsert({
      where: { userId: std1User.id },
      update: { sectionId: sec1.id },
      create: {
        userId: std1User.id,
        admissionNumber: 'ADM-FAC-001',
        rollNumber: '101',
        academicYearId,
        departmentId: dept.id,
        sectionId: sec1.id,
        status: 'ACTIVE',
      },
    });
    student1Id = std1.id;

    // 9. Create Student 2 (Enrolled in Section 2 - Unassigned for Faculty A)
    const std2User = await prisma.user.upsert({
      where: { email: 'std2.fac@school.edu' },
      update: {},
      create: {
        email: 'std2.fac@school.edu',
        username: 'std2_fac',
        passwordHash: defaultPassword,
        firstName: 'Bob',
        lastName: 'Student',
        status: 'ACTIVE',
        activeRole: 'STUDENT',
      },
    });

    const std2 = await prisma.student.upsert({
      where: { userId: std2User.id },
      update: { sectionId: sec2.id },
      create: {
        userId: std2User.id,
        admissionNumber: 'ADM-FAC-002',
        rollNumber: '102',
        academicYearId,
        departmentId: dept.id,
        sectionId: sec2.id,
        status: 'ACTIVE',
      },
    });
    student2Id = std2.id;

    await prisma.extraClassRequest.deleteMany({ where: { facultyId: facultyAId } });
  });

  it('1. Should fetch real faculty dashboard metrics', async () => {
    const res = await request(app)
      .get('/api/faculty/dashboard')
      .set('Authorization', `Bearer ${facultyAToken}`);

    expect(res.body.status).toBeUndefined();
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.faculty.employeeCode).toBe('EMP-FACA-007');
    expect(res.body.data.faculty.isCoordinator).toBe(true);
    expect(res.body.data.today).toBeDefined();
  });

  it('2. Should fetch faculty profile and update self-editable contact details', async () => {
    const profileRes = await request(app)
      .get('/api/faculty/profile')
      .set('Authorization', `Bearer ${facultyAToken}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.email).toBe('faca.portal7@school.edu');

    const updateRes = await request(app)
      .put('/api/faculty/profile')
      .set('Authorization', `Bearer ${facultyAToken}`)
      .send({
        phone: '+1999888777',
        address: '123 Faculty Residence Way',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.phone).toBe('+1999888777');
    expect(updateRes.body.data.address).toBe('123 Faculty Residence Way');
  });

  it('3. Should fetch assigned classes and section student roster', async () => {
    const classesRes = await request(app)
      .get('/api/faculty/classes')
      .set('Authorization', `Bearer ${facultyAToken}`);

    expect(classesRes.status).toBe(200);
    expect(classesRes.body.data.subjectAssignments.length).toBeGreaterThanOrEqual(1);

    const studentsRes = await request(app)
      .get(`/api/faculty/classes/${section1Id}/students`)
      .set('Authorization', `Bearer ${facultyAToken}`);

    expect(studentsRes.status).toBe(200);
    expect(studentsRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(studentsRes.body.data[0].admissionNumber).toBe('ADM-FAC-001');
  });

  it('4. Should reject accessing student roster for unassigned class section with 403', async () => {
    const res = await request(app)
      .get(`/api/faculty/classes/${section2Id}/students`)
      .set('Authorization', `Bearer ${facultyAToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.message).toContain('Access Denied');
  });

  it('5. Should fetch restricted student profile for assigned student and reject unassigned student', async () => {
    const allowedRes = await request(app)
      .get(`/api/faculty/students/${student1Id}`)
      .set('Authorization', `Bearer ${facultyAToken}`);

    expect(allowedRes.status).toBe(200);
    expect(allowedRes.body.data.firstName).toBe('Alice');

    const forbiddenRes = await request(app)
      .get(`/api/faculty/students/${student2Id}`)
      .set('Authorization', `Bearer ${facultyAToken}`);

    expect(forbiddenRes.status).toBe(403);
  });

  it('6. Should fetch faculty timetable', async () => {
    const res = await request(app)
      .get('/api/faculty/timetable')
      .set('Authorization', `Bearer ${facultyAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.regularTimetable).toBeDefined();
    expect(res.body.data.substituteClasses).toBeDefined();
  });

  it('7. Should create draft assignment for assigned section and reject for unassigned section', async () => {
    const allowedRes = await request(app)
      .post('/api/faculty/assignments')
      .set('Authorization', `Bearer ${facultyAToken}`)
      .send({
        classId,
        sectionId: section1Id,
        subjectId,
        title: 'Data Structures Lab 1',
        description: 'Implement Binary Search Trees in C++',
        dueDate: '2026-11-15T23:59:59Z',
      });

    expect(allowedRes.status).toBe(201);
    expect(allowedRes.body.data.status).toBe('DRAFT');
    draftAssignmentId = allowedRes.body.data.id;

    const forbiddenRes = await request(app)
      .post('/api/faculty/assignments')
      .set('Authorization', `Bearer ${facultyAToken}`)
      .send({
        classId,
        sectionId: section2Id,
        subjectId,
        title: 'Unauthorized Assignment',
        description: 'Should fail ownership check',
        dueDate: '2026-11-15T23:59:59Z',
      });

    expect(forbiddenRes.status).toBe(403);
  });

  it('8. Should publish assignment and generate student targets and notification events', async () => {
    const res = await request(app)
      .post(`/api/faculty/assignments/${draftAssignmentId}/publish`)
      .set('Authorization', `Bearer ${facultyAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PUBLISHED');

    const targets = await prisma.assignmentTarget.findMany({
      where: { assignmentId: draftAssignmentId },
    });
    expect(targets.length).toBeGreaterThanOrEqual(1);

    const notifEvent = await prisma.notificationEvent.findFirst({
      where: { eventType: 'ASSIGNMENT_PUBLISHED' },
    });
    expect(notifEvent).toBeDefined();
  });

  it('9. Should process faculty leave request and extra class request', async () => {
    const leaveRes = await request(app)
      .post('/api/faculty/leave')
      .set('Authorization', `Bearer ${facultyAToken}`)
      .send({
        leaveType: 'CASUAL',
        startDate: '2026-11-01',
        endDate: '2026-11-02',
        reason: 'Personal academic conference attendance.',
      });

    expect(leaveRes.status).toBe(201);
    expect(leaveRes.body.data.status).toBe('PENDING');

    const extraClassRes = await request(app)
      .post('/api/faculty/extra-classes')
      .set('Authorization', `Bearer ${facultyAToken}`)
      .send({
        classId,
        sectionId: section1Id,
        subjectId,
        roomId,
        date: '2026-11-05',
        startTime: '14:00',
        endTime: '15:00',
        reason: 'Remedial revision before mid-term exams.',
      });

    expect(extraClassRes.status).toBe(201);
    expect(extraClassRes.body.data.status).toBe('PENDING');
  });

  it('10. Should handle faculty vehicle registration and administrative approval', async () => {
    const uniqueVeh = `KA-01-FC-${Date.now().toString().slice(-4)}`;
    const regRes = await request(app)
      .post('/api/faculty/vehicles')
      .set('Authorization', `Bearer ${facultyAToken}`)
      .send({
        vehicleNumber: uniqueVeh,
        vehicleType: 'FOUR_WHEELER',
        makeModel: 'Honda City',
        color: 'White',
        registrationDetails: 'Faculty Campus Parking Permit',
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.data.status).toBe('PENDING');
    vehicleRegistrationId = regRes.body.data.id;

    const reviewRes = await request(app)
      .post(`/api/faculty/vehicles/${vehicleRegistrationId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'APPROVED' });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.status).toBe('APPROVED');
  });

  it('11. Should create class announcement and fetch faculty notifications & workload', async () => {
    const annRes = await request(app)
      .post('/api/faculty/announcements')
      .set('Authorization', `Bearer ${facultyAToken}`)
      .send({
        classId,
        sectionId: section1Id,
        title: 'Mid-Term Exam Syllabus Released',
        content: 'Topics cover Modules 1 to 3.',
        category: 'EXAM_REMINDER',
      });

    expect(annRes.status).toBe(201);

    const workloadRes = await request(app)
      .get('/api/faculty/workload')
      .set('Authorization', `Bearer ${facultyAToken}`);

    expect(workloadRes.status).toBe(200);
    expect(workloadRes.body.data.totalAssignedClasses).toBeGreaterThanOrEqual(1);

    const notifRes = await request(app)
      .get('/api/faculty/notifications')
      .set('Authorization', `Bearer ${facultyAToken}`);

    expect(notifRes.status).toBe(200);
  });
});
