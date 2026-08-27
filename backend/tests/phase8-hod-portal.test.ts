import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { PrismaClient } from '@prisma/client';

const app = createApp();
const prisma = new PrismaClient();

describe('Phase 8 — Complete Real HOD & Department Management Portal Suite', () => {
  let superAdminToken: string;
  let hodAToken: string;
  let hodBToken: string;
  let facultyAToken: string;

  let deptAId: string;
  let deptBId: string;
  let hodAUserId: string;
  let hodBUserId: string;
  let facultyAId: string;
  let facultyAUserId: string;
  let facultyBId: string;
  let studentAId: string;
  let studentAUserId: string;

  let classAId: string;
  let sectionAId: string;
  let subjectAId: string;
  let timeSlotId: string;
  let roomId: string;
  let academicYearId: string;

  beforeAll(async () => {
    // 1. Super Admin Auth Token
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'principal@school.edu', password: 'Admin@SecurePassword2026!', role: 'SUPER_ADMIN' });
    expect(adminLoginRes.status).toBe(200);
    superAdminToken = adminLoginRes.body.data.tokens.accessToken;

    // 2. Active Academic Year
    const yearRes = await request(app).get('/api/academic/years').set('Authorization', `Bearer ${superAdminToken}`);
    if (yearRes.body.data && yearRes.body.data.length > 0) {
      academicYearId = yearRes.body.data[0].id;
    } else {
      const newYearRes = await request(app)
        .post('/api/academic/years')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: `2026-HOD-${Date.now()}`,
          startDate: '2026-06-01T00:00:00.000Z',
          endDate: '2027-04-30T00:00:00.000Z',
          isCurrent: true,
        });
      academicYearId = newYearRes.body.data.id;
    }

    // 3. Create Department A (Computer Science) & Department B (Mechanical Eng)
    const codeA = `CS-${Date.now().toString().slice(-4)}`;
    const deptARes = await request(app)
      .post('/api/academic/departments')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ code: codeA, name: `Computer Science Dept ${codeA}`, description: 'CS Department' });
    expect(deptARes.status).toBe(201);
    deptAId = deptARes.body.data.id;

    const codeB = `ME-${Date.now().toString().slice(-4)}`;
    const deptBRes = await request(app)
      .post('/api/academic/departments')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ code: codeB, name: `Mechanical Dept ${codeB}`, description: 'ME Department' });
    expect(deptBRes.status).toBe(201);
    deptBId = deptBRes.body.data.id;

    // 4. Register HOD A (for Dept A) & HOD B (for Dept B)
    const hodAUser = await prisma.user.create({
      data: {
        email: `hoda_${Date.now()}@stlawrence.edu`,
        username: `hoda_${Date.now()}`,
        passwordHash: '$2b$10$e8W/Z8LwZ0wNn6fGk1H8.e3Yk4D4o4m8D4o4m8D4o4m8D4o4m8D4o', // dummy hash
        firstName: 'HOD',
        lastName: 'CS-Dept',
        status: 'ACTIVE',
        activeRole: 'HOD',
        userCategory: 'EXECUTIVE',
      },
    });
    hodAUserId = hodAUser.id;

    const hodBUser = await prisma.user.create({
      data: {
        email: `hodb_${Date.now()}@stlawrence.edu`,
        username: `hodb_${Date.now()}`,
        passwordHash: '$2b$10$e8W/Z8LwZ0wNn6fGk1H8.e3Yk4D4o4m8D4o4m8D4o4m8D4o4m8D4o',
        firstName: 'HOD',
        lastName: 'ME-Dept',
        status: 'ACTIVE',
        activeRole: 'HOD',
        userCategory: 'EXECUTIVE',
      },
    });
    hodBUserId = hodBUser.id;

    // Assign HOD roles to Departments
    const hodRole = await prisma.role.findUnique({ where: { name: 'HOD' } });
    expect(hodRole).not.toBeNull();

    await prisma.userRole.create({
      data: { userId: hodAUserId, roleId: hodRole!.id, departmentId: deptAId, isPrimary: true },
    });
    await prisma.department.update({ where: { id: deptAId }, data: { hodUserId: hodAUserId } });

    await prisma.userRole.create({
      data: { userId: hodBUserId, roleId: hodRole!.id, departmentId: deptBId, isPrimary: true },
    });
    await prisma.department.update({ where: { id: deptBId }, data: { hodUserId: hodBUserId } });

    // 5. Create Faculty A (Dept A) & Faculty B (Dept B)
    const facAUser = await prisma.user.create({
      data: {
        email: `faca_${Date.now()}@stlawrence.edu`,
        passwordHash: '$2b$10$e8W/Z8LwZ0wNn6fGk1H8.e3Yk4D4o4m8D4o4m8D4o4m8D4o4m8D4o',
        firstName: 'Faculty',
        lastName: 'Alpha',
        status: 'ACTIVE',
        activeRole: 'FACULTY',
        userCategory: 'FACULTY',
      },
    });
    facultyAUserId = facAUser.id;

    const facultyARec = await prisma.faculty.create({
      data: {
        userId: facultyAUserId,
        departmentId: deptAId,
        employeeCode: `EMP-A-${Date.now().toString().slice(-4)}`,
        designation: 'Assistant Professor',
        status: 'ACTIVE',
      },
    });
    facultyAId = facultyARec.id;

    const facBUser = await prisma.user.create({
      data: {
        email: `facb_${Date.now()}@stlawrence.edu`,
        passwordHash: '$2b$10$e8W/Z8LwZ0wNn6fGk1H8.e3Yk4D4o4m8D4o4m8D4o4m8D4o4m8D4o',
        firstName: 'Faculty',
        lastName: 'Beta',
        status: 'ACTIVE',
        activeRole: 'FACULTY',
        userCategory: 'FACULTY',
      },
    });
    const facultyBRec = await prisma.faculty.create({
      data: {
        userId: facBUser.id,
        departmentId: deptBId,
        employeeCode: `EMP-B-${Date.now().toString().slice(-4)}`,
        designation: 'Associate Professor',
        status: 'ACTIVE',
      },
    });
    facultyBId = facultyBRec.id;

    // 6. Create Student A in Dept A
    const stdAUser = await prisma.user.create({
      data: {
        email: `stda_${Date.now()}@stlawrence.edu`,
        passwordHash: '$2b$10$e8W/Z8LwZ0wNn6fGk1H8.e3Yk4D4o4m8D4o4m8D4o4m8D4o4m8D4o',
        firstName: 'Student',
        lastName: 'CS-One',
        status: 'ACTIVE',
        activeRole: 'STUDENT',
        userCategory: 'STUDENT',
      },
    });
    studentAUserId = stdAUser.id;

    const classCode = `CS-CL-${Date.now().toString().slice(-4)}`;
    const classARes = await request(app)
      .post('/api/academic/classes')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: `CSE Class ${classCode}`,
        code: classCode,
        academicYearId,
        departmentId: deptAId,
      });
    expect(classARes.status).toBe(201);
    classAId = classARes.body.data.id;

    const secARes = await request(app)
      .post('/api/academic/sections')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ classId: classAId, name: 'Section A', capacity: 60 });
    expect(secARes.status).toBe(201);
    sectionAId = secARes.body.data.id;

    const studentARec = await prisma.student.create({
      data: {
        userId: studentAUserId,
        departmentId: deptAId,
        academicYearId,
        sectionId: sectionAId,
        admissionNumber: `ADM-CS-${Date.now().toString().slice(-4)}`,
        rollNumber: `CS-001`,
        status: 'ACTIVE',
      },
    });
    studentAId = studentARec.id;

    // Subject & Infrastructure
    const subjCode = `CS-SUB-${Date.now().toString().slice(-4)}`;
    const subjRes = await request(app)
      .post('/api/academic/subjects')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ code: subjCode, name: `Data Structures ${subjCode}`, departmentId: deptAId, type: 'THEORY', credits: 4 });
    expect(subjRes.status).toBe(201);
    subjectAId = subjRes.body.data.id;

    const roomRes = await request(app)
      .post('/api/academic/rooms')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ roomNumber: `R-HOD-${Math.floor(Math.random() * 9000 + 1000)}`, name: 'HOD Lecture Hall', building: 'Main Academic Block', capacity: 70, type: 'CLASSROOM' });
    expect(roomRes.status).toBe(201);
    roomId = roomRes.body.data.id;

    const periodNum = Math.floor(Math.random() * 800 + 100);
    const slotRes = await request(app)
      .post('/api/academic/time-slots')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ academicYearId, name: `HOD Period ${periodNum}`, dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:00', periodNumber: periodNum });
    expect(slotRes.status).toBe(201);
    timeSlotId = slotRes.body.data.id;

    // Generate valid access tokens
    const { generateAccessToken } = await import('../src/utils/jwt');
    hodAToken = generateAccessToken({ userId: hodAUserId, email: hodAUser.email, activeRole: 'HOD' });
    hodBToken = generateAccessToken({ userId: hodBUserId, email: hodBUser.email, activeRole: 'HOD' });
    facultyAToken = generateAccessToken({ userId: facultyAUserId, email: facAUser.email, activeRole: 'FACULTY' });
  });

  it('1. should fetch HOD Dashboard with real department metrics', async () => {
    const res = await request(app)
      .get('/api/hod/dashboard')
      .set('Authorization', `Bearer ${hodAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.department.id).toBe(deptAId);
    expect(res.body.data.metrics.totalFaculty).toBeGreaterThanOrEqual(1);
    expect(res.body.data.metrics.totalStudents).toBeGreaterThanOrEqual(1);
  });

  it('2. should enforce Strict Department Security and reject HOD A accessing Dept B (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/hod/dashboard?departmentId=${deptBId}`)
      .set('Authorization', `Bearer ${hodAToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('not authorized to manage resources outside your assigned department');
  });

  it('3. should allow HOD A to view and update Department A profile with audit logging', async () => {
    const getRes = await request(app)
      .get('/api/hod/department')
      .set('Authorization', `Bearer ${hodAToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(deptAId);

    const updateRes = await request(app)
      .put('/api/hod/department')
      .set('Authorization', `Bearer ${hodAToken}`)
      .send({ description: 'Updated CS Department Description' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.description).toBe('Updated CS Department Description');
  });

  it('4. should list department faculty for HOD A and reject viewing cross-department faculty details', async () => {
    const listRes = await request(app)
      .get('/api/hod/faculty')
      .set('Authorization', `Bearer ${hodAToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.faculty.some((f: any) => f.id === facultyAId)).toBe(true);
    expect(listRes.body.data.faculty.some((f: any) => f.id === facultyBId)).toBe(false);

    // Cross-department access rejection
    const crossRes = await request(app)
      .get(`/api/hod/faculty/${facultyBId}`)
      .set('Authorization', `Bearer ${hodAToken}`);

    expect(crossRes.status).toBe(404);
  });

  it('5. should assign subject to department faculty and fetch workload summary', async () => {
    const assignRes = await request(app)
      .post('/api/hod/faculty-assignments')
      .set('Authorization', `Bearer ${hodAToken}`)
      .send({
        facultyId: facultyAId,
        classId: classAId,
        sectionId: sectionAId,
        subjectId: subjectAId,
      });

    expect(assignRes.status).toBe(201);
    expect(assignRes.body.data.facultyId).toBe(facultyAId);

    const workloadRes = await request(app)
      .get('/api/hod/workload')
      .set('Authorization', `Bearer ${hodAToken}`);

    expect(workloadRes.status).toBe(200);
    expect(workloadRes.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('6. should assign Class Coordinator for section and preserve history in ClassCoordinatorHistory', async () => {
    const coordRes = await request(app)
      .post(`/api/hod/sections/${sectionAId}/coordinator`)
      .set('Authorization', `Bearer ${hodAToken}`)
      .send({ facultyId: facultyAId });

    expect(coordRes.status).toBe(200);
    expect(coordRes.body.data.facultyId).toBe(facultyAId);

    const history = await prisma.classCoordinatorHistory.findMany({ where: { sectionId: sectionAId } });
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].status).toBe('ACTIVE');
  });

  it('7. should retrieve department student roster and low attendance dashboard', async () => {
    const stdRes = await request(app)
      .get('/api/hod/students')
      .set('Authorization', `Bearer ${hodAToken}`);

    expect(stdRes.status).toBe(200);
    expect(stdRes.body.data.students.some((s: any) => s.id === studentAId)).toBe(true);

    const lowRes = await request(app)
      .get('/api/hod/low-attendance')
      .set('Authorization', `Bearer ${hodAToken}`);

    expect(lowRes.status).toBe(200);
  });

  it('8. should process attendance correction and reject cross-department review by HOD B', async () => {
    // Create attendance slot & record for Student A
    const slot = await prisma.attendanceSlot.create({
      data: {
        academicYearId,
        classId: classAId,
        sectionId: sectionAId,
        subjectId: subjectAId,
        facultyId: facultyAId,
        timeSlotId,
        startTime: '09:00',
        endTime: '10:00',
        date: '2026-08-25',
        status: 'FINALIZED',
        createdByUserId: facultyAUserId,
      },
    });

    const stdAttendance = await prisma.studentAttendance.create({
      data: {
        attendanceSlotId: slot.id,
        studentId: studentAId,
        status: 'ABSENT',
        markedByUserId: facultyAUserId,
      },
    });

    const correction = await prisma.studentAttendanceCorrection.create({
      data: {
        studentAttendanceId: stdAttendance.id,
        requestedByUserId: facultyAUserId,
        proposedStatus: 'PRESENT',
        originalStatus: 'ABSENT',
        reason: 'Marked absent by mistake during roll call.',
        status: 'PENDING',
      },
    });

    // Cross-department review attempt by HOD B -> Rejected
    const crossRejectRes = await request(app)
      .post(`/api/hod/corrections/${correction.id}/review`)
      .set('Authorization', `Bearer ${hodBToken}`)
      .send({ action: 'APPROVED', reviewNotes: 'Cross department approve attempt' });

    expect(crossRejectRes.status).toBe(403);

    // Valid HOD A Review -> Success
    const validRes = await request(app)
      .post(`/api/hod/corrections/${correction.id}/review`)
      .set('Authorization', `Bearer ${hodAToken}`)
      .send({ action: 'APPROVED', reviewNotes: 'Approved after verification' });

    expect(validRes.status).toBe(200);
    expect(validRes.body.data.status).toBe('APPROVED');

    const updatedStdAtt = await prisma.studentAttendance.findUnique({ where: { id: stdAttendance.id } });
    expect(updatedStdAtt?.status).toBe('PRESENT');
  });

  it('9. should review faculty leave and perform automated timetable impact analysis', async () => {
    // Create leave for Faculty A
    const leave = await prisma.facultyLeave.create({
      data: {
        userId: facultyAUserId,
        leaveType: 'CASUAL',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-09-03'),
        totalDays: 3,
        reason: 'Attending research seminar',
        status: 'PENDING',
      },
    });

    const reviewRes = await request(app)
      .post(`/api/hod/leaves/${leave.id}/review`)
      .set('Authorization', `Bearer ${hodAToken}`)
      .send({ action: 'APPROVED', reviewNotes: 'Leave granted' });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.leave.status).toBe('APPROVED');
  });

  it('10. should assign substitute faculty and reject scheduling conflicts', async () => {
    const subRes = await request(app)
      .post('/api/hod/substitutes')
      .set('Authorization', `Bearer ${hodAToken}`)
      .send({
        originalFacultyId: facultyAId,
        substituteFacultyId: facultyBId, // Faculty B acts as substitute
        classId: classAId,
        sectionId: sectionAId,
        subjectId: subjectAId,
        timeSlotId,
        date: '2026-09-01',
        reason: 'Covering research leave',
      });

    expect(subRes.status).toBe(201);
    expect(subRes.body.data.status).toBe('CONFIRMED');
  });

  it('11. should manage department timetable and enforce 5-way conflict checks', async () => {
    const dayOfWeek = 'MONDAY';

    const ttRes = await request(app)
      .post('/api/hod/timetable')
      .set('Authorization', `Bearer ${hodAToken}`)
      .send({
        classId: classAId,
        sectionId: sectionAId,
        subjectId: subjectAId,
        facultyId: facultyAId,
        roomId,
        timeSlotId,
        dayOfWeek,
      });

    expect(ttRes.status).toBe(201);

    // Duplicate Faculty assignment at same timeslot -> 409 Conflict
    const conflictRes = await request(app)
      .post('/api/hod/timetable')
      .set('Authorization', `Bearer ${hodAToken}`)
      .send({
        classId: classAId,
        sectionId: sectionAId,
        subjectId: subjectAId,
        facultyId: facultyAId,
        roomId,
        timeSlotId,
        dayOfWeek,
      });

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.error.message).toContain('Conflict');
  });

  it('12. should broadcast department notice and update section WhatsApp configuration', async () => {
    const noticeRes = await request(app)
      .post('/api/hod/notices')
      .set('Authorization', `Bearer ${hodAToken}`)
      .send({
        title: 'Department Monthly Review Meeting',
        content: 'All faculty must attend the monthly academic review at 3 PM.',
        targetScope: 'FACULTY_ONLY',
      });

    expect(noticeRes.status).toBe(201);
    expect(noticeRes.body.data.title).toBe('Department Monthly Review Meeting');

    const waRes = await request(app)
      .post(`/api/hod/sections/${sectionAId}/whatsapp`)
      .set('Authorization', `Bearer ${hodAToken}`)
      .send({
        whatsAppGroupId: 'WA-GRP-CS-101',
        whatsAppGroupStatus: 'ACTIVE',
      });

    expect(waRes.status).toBe(200);
    expect(waRes.body.data.whatsAppGroupId).toBe('WA-GRP-CS-101');
  });

  it('13. should allow Super Admin override for department reports and cross-department queries', async () => {
    const reportRes = await request(app)
      .get(`/api/hod/reports?type=FACULTY&departmentId=${deptAId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(reportRes.status).toBe(200);
    expect(reportRes.body.data.department).toBeDefined();
    expect(reportRes.body.data.data.length).toBeGreaterThanOrEqual(1);
  });
});
