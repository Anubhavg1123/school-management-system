import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/prisma';
import { hashPassword } from '../src/utils/password';
import { UserRoleEnum, UserStatusEnum } from '../src/types';

const app = createApp();

describe('Phase 5 — Academic Structure, HOD Management, Faculty Assignment & Timetable Suite', () => {
  let superAdminToken: string;
  let officeAdminToken: string;
  let nonFacultyToken: string;
  let testFacultyUserId: string;
  let testFacultyId: string;
  let testFacultyToken: string;

  let secondaryFacultyUserId: string;
  let secondaryFacultyId: string;

  let testAcademicYearId: string;
  let testDeptId: string;
  let testClassId: string;
  let testSectionId: string;
  let testSubject1Id: string;
  let testSubject2Id: string;
  let testRoom1Id: string;
  let testRoom2Id: string;
  let period1SlotId: string;
  let breakSlotId: string;
  let saturdayPeriod1SlotId: string;

  beforeAll(async () => {
    // 1. Seed Principal / Super Admin
    const adminPassword = await hashPassword('Admin@123456');
    const adminUser = await prisma.user.upsert({
      where: { email: 'phase5.principal@school.edu' },
      update: { status: UserStatusEnum.ACTIVE, passwordHash: adminPassword },
      create: {
        email: 'phase5.principal@school.edu',
        username: 'phase5_principal',
        passwordHash: adminPassword,
        firstName: 'Principal',
        lastName: 'Phase5',
        status: UserStatusEnum.ACTIVE,
        userCategory: 'ADMINISTRATIVE',
      },
    });
    const superAdminRole = await prisma.role.findUnique({ where: { name: UserRoleEnum.SUPER_ADMIN } });
    if (superAdminRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: adminUser.id, roleId: superAdminRole.id } },
        update: {},
        create: { userId: adminUser.id, roleId: superAdminRole.id, isPrimary: true },
      });
    }

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'phase5.principal@school.edu', password: 'Admin@123456', role: 'SUPER_ADMIN' });
    superAdminToken = adminLogin.body.data.tokens.accessToken;

    // 2. Seed Office Admin
    const officePassword = await hashPassword('Office@123456');
    const officeUser = await prisma.user.upsert({
      where: { email: 'phase5.office@school.edu' },
      update: { status: UserStatusEnum.ACTIVE, passwordHash: officePassword },
      create: {
        email: 'phase5.office@school.edu',
        username: 'phase5_office',
        passwordHash: officePassword,
        firstName: 'Office',
        lastName: 'Admin',
        status: UserStatusEnum.ACTIVE,
        userCategory: 'ADMINISTRATIVE',
      },
    });
    const officeRole = await prisma.role.findUnique({ where: { name: UserRoleEnum.OFFICE_ADMIN } });
    if (officeRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: officeUser.id, roleId: officeRole.id } },
        update: {},
        create: { userId: officeUser.id, roleId: officeRole.id, isPrimary: true },
      });
    }

    const officeLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'phase5.office@school.edu', password: 'Office@123456', role: 'OFFICE_ADMIN' });
    officeAdminToken = officeLogin.body.data.tokens.accessToken;

    // 3. Seed Primary Faculty User & Profile
    const facultyPassword = await hashPassword('Faculty@123456');
    const fac1Email = `phase5.faculty1.${Date.now()}@school.edu`;
    const facultyUser = await prisma.user.create({
      data: {
        email: fac1Email,
        username: `phase5_fac1_${Date.now().toString().slice(-4)}`,
        passwordHash: facultyPassword,
        firstName: 'Alan',
        lastName: 'Turing',
        status: UserStatusEnum.ACTIVE,
        userCategory: 'TEACHING_STAFF',
      },
    });
    testFacultyUserId = facultyUser.id;
    const facultyRole = await prisma.role.findUnique({ where: { name: UserRoleEnum.FACULTY } });
    if (facultyRole) {
      await prisma.userRole.create({
        data: { userId: facultyUser.id, roleId: facultyRole.id, isPrimary: true },
      });
    }

    const facultyLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: fac1Email, password: 'Faculty@123456', role: 'FACULTY' });
    testFacultyToken = facultyLogin.body.data.tokens.accessToken;

    // 4. Seed Secondary Faculty
    const fac2Email = `phase5.faculty2.${Date.now()}@school.edu`;
    const secondaryUser = await prisma.user.create({
      data: {
        email: fac2Email,
        username: `phase5_fac2_${Date.now().toString().slice(-4)}`,
        passwordHash: facultyPassword,
        firstName: 'Grace',
        lastName: 'Hopper',
        status: UserStatusEnum.ACTIVE,
        userCategory: 'TEACHING_STAFF',
      },
    });
    secondaryFacultyUserId = secondaryUser.id;
    if (facultyRole) {
      await prisma.userRole.create({
        data: { userId: secondaryUser.id, roleId: facultyRole.id, isPrimary: true },
      });
    }

    // 5. Seed Non-Faculty
    const nonFacultyPassword = await hashPassword('Staff@123456');
    const nonFacUser = await prisma.user.upsert({
      where: { email: 'phase5.guard@school.edu' },
      update: { status: UserStatusEnum.ACTIVE, passwordHash: nonFacultyPassword },
      create: {
        email: 'phase5.guard@school.edu',
        username: 'phase5_guard',
        passwordHash: nonFacultyPassword,
        firstName: 'Marcus',
        lastName: 'Vance',
        status: UserStatusEnum.ACTIVE,
        userCategory: 'NON_TEACHING_STAFF',
      },
    });
    const nonFacRole = await prisma.role.findUnique({ where: { name: UserRoleEnum.NON_FACULTY } });
    if (nonFacRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: nonFacUser.id, roleId: nonFacRole.id } },
        update: {},
        create: { userId: nonFacUser.id, roleId: nonFacRole.id, isPrimary: true },
      });
    }

    const nonFacLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'phase5.guard@school.edu', password: 'Staff@123456', role: 'NON_FACULTY' });
    nonFacultyToken = nonFacLogin.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ----------------------------------------------------
  // TEST 1: Academic Year & Department Management & Audited HOD Assignment
  // ----------------------------------------------------
  it('1. should create Academic Year, Department and execute audited HOD assignment with history tracking', async () => {
    // 1. Create Academic Year
    const yearRes = await request(app)
      .post('/api/academic/years')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: `2026-2027-T5-${Date.now().toString().slice(-4)}`,
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2027-05-31T00:00:00.000Z',
        isCurrent: true,
      });

    expect(yearRes.status).toBe(201);
    expect(yearRes.body.data.isCurrent).toBe(true);
    testAcademicYearId = yearRes.body.data.id;

    // 2. Create Department
    const deptCode = `CSE5_${Date.now().toString().slice(-4)}`;
    const deptRes = await request(app)
      .post('/api/academic/departments')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        code: deptCode,
        name: `Computer Science & Engineering ${Date.now()}`,
        description: 'Department of Computing and Software Systems',
      });

    expect(deptRes.status).toBe(201);
    testDeptId = deptRes.body.data.id;

    // Link Faculty Profiles to Department
    const fac1 = await prisma.faculty.upsert({
      where: { userId: testFacultyUserId },
      update: { departmentId: testDeptId },
      create: {
        userId: testFacultyUserId,
        employeeCode: `EMP-T5-${Date.now().toString().slice(-4)}`,
        departmentId: testDeptId,
        designation: 'PROFESSOR',
        status: 'ACTIVE',
      },
    });
    testFacultyId = fac1.id;

    const fac2 = await prisma.faculty.upsert({
      where: { userId: secondaryFacultyUserId },
      update: { departmentId: testDeptId },
      create: {
        userId: secondaryFacultyUserId,
        employeeCode: `EMP-T6-${Date.now().toString().slice(-4)}`,
        departmentId: testDeptId,
        designation: 'ASST_PROFESSOR',
        status: 'ACTIVE',
      },
    });
    secondaryFacultyId = fac2.id;

    // 3. Assign Faculty 1 as HOD
    const hodRes = await request(app)
      .post(`/api/academic/departments/${testDeptId}/assign-hod`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        hodUserId: testFacultyUserId,
        reason: 'Appointed as Department Chair for academic session.',
      });

    expect(hodRes.status).toBe(200);
    expect(hodRes.body.data.history.status).toBe('ACTIVE');

    // 4. Retrieve Department and verify HOD History
    const deptDetail = await request(app)
      .get(`/api/academic/departments/${testDeptId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(deptDetail.status).toBe(200);
    expect(deptDetail.body.data.hod.id).toBe(testFacultyUserId);
    expect(deptDetail.body.data.hodHistory.length).toBeGreaterThan(0);
  });

  // ----------------------------------------------------
  // TEST 2: Classes, Sections & Class Coordinator Appointment
  // ----------------------------------------------------
  it('2. should create class, sections, and assign class coordinator with historical tracking', async () => {
    // 1. Create Class
    const classRes = await request(app)
      .post('/api/academic/classes')
      .set('Authorization', `Bearer ${officeAdminToken}`)
      .send({
        name: 'B.Tech CSE 3rd Year',
        code: `CSE-Y3-${Date.now().toString().slice(-4)}`,
        departmentId: testDeptId,
        academicYearId: testAcademicYearId,
      });

    expect(classRes.status).toBe(201);
    testClassId = classRes.body.data.id;

    // 2. Create Section
    const sectionRes = await request(app)
      .post('/api/academic/sections')
      .set('Authorization', `Bearer ${officeAdminToken}`)
      .send({
        classId: testClassId,
        name: 'Section A',
        capacity: 60,
      });

    expect(sectionRes.status).toBe(201);
    testSectionId = sectionRes.body.data.id;

    // 3. Assign Class Coordinator
    const coordRes = await request(app)
      .post(`/api/academic/sections/${testSectionId}/assign-coordinator`)
      .set('Authorization', `Bearer ${officeAdminToken}`)
      .send({
        facultyId: testFacultyId,
        academicYearId: testAcademicYearId,
        reason: 'Designated class coordinator for 3rd Year Section A.',
      });

    expect(coordRes.status).toBe(200);
    expect(coordRes.body.data.section.coordinatorFacultyId).toBe(testFacultyId);
    expect(coordRes.body.data.history.status).toBe('ACTIVE');
  });

  // ----------------------------------------------------
  // TEST 3: Subjects & Class Subject Allocations
  // ----------------------------------------------------
  it('3. should create subjects and associate them with classes in the academic year', async () => {
    const sub1Res = await request(app)
      .post('/api/academic/subjects')
      .set('Authorization', `Bearer ${officeAdminToken}`)
      .send({
        code: `CS301-${Date.now().toString().slice(-3)}`,
        name: 'Data Structures & Algorithms',
        type: 'THEORY',
        credits: 4.0,
        departmentId: testDeptId,
        description: 'Advanced data structures and computational complexity.',
      });

    expect(sub1Res.status).toBe(201);
    testSubject1Id = sub1Res.body.data.id;

    const sub2Res = await request(app)
      .post('/api/academic/subjects')
      .set('Authorization', `Bearer ${officeAdminToken}`)
      .send({
        code: `CS301L-${Date.now().toString().slice(-3)}`,
        name: 'Data Structures Laboratory',
        type: 'LAB',
        credits: 2.0,
        departmentId: testDeptId,
      });

    expect(sub2Res.status).toBe(201);
    testSubject2Id = sub2Res.body.data.id;

    // Assign subjects to class
    const assignSubRes = await request(app)
      .post(`/api/academic/classes/${testClassId}/subjects`)
      .set('Authorization', `Bearer ${officeAdminToken}`)
      .send({
        academicYearId: testAcademicYearId,
        subjectIds: [testSubject1Id, testSubject2Id],
      });

    expect(assignSubRes.status).toBe(200);
    expect(assignSubRes.body.data.length).toBe(2);
  });

  // ----------------------------------------------------
  // TEST 4: Faculty Subject Assignment
  // ----------------------------------------------------
  it('4. should assign faculty to class section subjects with workload tracking', async () => {
    const assignRes = await request(app)
      .post('/api/academic/faculty/assign-subject')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicYearId: testAcademicYearId,
        facultyId: testFacultyId,
        classId: testClassId,
        sectionId: testSectionId,
        subjectId: testSubject1Id,
      });

    expect(assignRes.status).toBe(201);
    expect(assignRes.body.data.facultyId).toBe(testFacultyId);

    // Query faculty assignments
    const listRes = await request(app)
      .get(`/api/academic/faculty/assignments?facultyId=${testFacultyId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThan(0);
  });

  // ----------------------------------------------------
  // TEST 5: Rooms & Standard Time Slots Setup
  // ----------------------------------------------------
  it('5. should configure classroom facilities and generate standard institutional time slots', async () => {
    // 1. Create Room 1
    const room1 = await request(app)
      .post('/api/academic/rooms')
      .set('Authorization', `Bearer ${officeAdminToken}`)
      .send({
        roomNumber: `R-501-${Math.floor(Math.random() * 90000 + 10000)}`,
        name: 'Lecture Hall 501',
        building: 'Academic Block A',
        floor: 2,
        capacity: 70,
        type: 'CLASSROOM',
        equipment: 'Interactive Smartboard, Audio System',
      });

    expect(room1.status).toBe(201);
    testRoom1Id = room1.body.data.id;

    // 2. Create Room 2
    const room2 = await request(app)
      .post('/api/academic/rooms')
      .set('Authorization', `Bearer ${officeAdminToken}`)
      .send({
        roomNumber: `LAB-501-${Math.floor(Math.random() * 90000 + 10000)}`,
        name: 'Computing Complex 501',
        building: 'Tech Wing',
        floor: 3,
        capacity: 45,
        type: 'COMPUTER_LAB',
        equipment: '45 Workstations, Gigabit Switch',
      });

    expect(room2.status).toBe(201);
    testRoom2Id = room2.body.data.id;

    // 3. Generate default daily time slots
    const slotsRes = await request(app)
      .post('/api/academic/time-slots/generate-defaults')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicYearId: testAcademicYearId,
        days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      });

    expect(slotsRes.status).toBe(201);

    // Retrieve Monday slots
    const mondaySlots = await request(app)
      .get(`/api/academic/time-slots?academicYearId=${testAcademicYearId}&dayOfWeek=MONDAY`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(mondaySlots.status).toBe(200);
    const p1 = mondaySlots.body.data.find((s: any) => s.periodNumber === 1);
    const lunch = mondaySlots.body.data.find((s: any) => s.isBreak === true);
    expect(p1).toBeDefined();
    expect(lunch).toBeDefined();
    period1SlotId = p1.id;
    breakSlotId = lunch.id;

    // Retrieve Saturday Period 1
    const satSlots = await request(app)
      .get(`/api/academic/time-slots?academicYearId=${testAcademicYearId}&dayOfWeek=SATURDAY`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    saturdayPeriod1SlotId = satSlots.body.data[0].id;
  });

  // ----------------------------------------------------
  // TEST 6: Timetable Creation & 5-Way Collision Prevention
  // ----------------------------------------------------
  it('6. should publish timetable entry and enforce 5-way backend conflict detection engine', async () => {
    // 1. Create a valid lecture on Monday Period 1
    const validEntry = await request(app)
      .post('/api/academic/timetable')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicYearId: testAcademicYearId,
        departmentId: testDeptId,
        classId: testClassId,
        sectionId: testSectionId,
        subjectId: testSubject1Id,
        facultyId: testFacultyId,
        roomId: testRoom1Id,
        timeSlotId: period1SlotId,
        dayOfWeek: 'MONDAY',
      });

    expect(validEntry.status).toBe(201);
    expect(validEntry.body.data.id).toBeDefined();

    // 2. CONFLICT 1: Faculty Overlap Conflict
    // Create another class/section and attempt to schedule same faculty at same Monday Period 1
    const sec2 = await prisma.section.create({
      data: {
        classId: testClassId,
        name: `Section B ${Date.now().toString().slice(-4)}`,
        capacity: 50,
      },
    });

    const facultyClashRes = await request(app)
      .post('/api/academic/timetable')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicYearId: testAcademicYearId,
        departmentId: testDeptId,
        classId: testClassId,
        sectionId: sec2.id,
        subjectId: testSubject2Id,
        facultyId: testFacultyId, // SAME FACULTY
        roomId: testRoom2Id,
        timeSlotId: period1SlotId,
        dayOfWeek: 'MONDAY',
      });

    expect(facultyClashRes.status).toBe(409);
    expect(facultyClashRes.body.error.code).toBe('FACULTY_CONFLICT');

    // 3. CONFLICT 2: Room Overlap Conflict
    // Attempt to book Room 1 with a different faculty at same Monday Period 1
    const roomClashRes = await request(app)
      .post('/api/academic/timetable')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicYearId: testAcademicYearId,
        departmentId: testDeptId,
        classId: testClassId,
        sectionId: sec2.id,
        subjectId: testSubject2Id,
        facultyId: secondaryFacultyId,
        roomId: testRoom1Id, // SAME ROOM
        timeSlotId: period1SlotId,
        dayOfWeek: 'MONDAY',
      });

    expect(roomClashRes.status).toBe(409);
    expect(roomClashRes.body.error.code).toBe('ROOM_CONFLICT');

    // 4. CONFLICT 3: Section Overlap Conflict
    // Attempt to book Section A with a different subject & room at same Monday Period 1
    const sectionClashRes = await request(app)
      .post('/api/academic/timetable')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicYearId: testAcademicYearId,
        departmentId: testDeptId,
        classId: testClassId,
        sectionId: testSectionId, // SAME SECTION
        subjectId: testSubject2Id,
        facultyId: secondaryFacultyId,
        roomId: testRoom2Id,
        timeSlotId: period1SlotId,
        dayOfWeek: 'MONDAY',
      });

    expect(sectionClashRes.status).toBe(409);
    expect(sectionClashRes.body.error.code).toBe('SECTION_CONFLICT');

    // 5. CONFLICT 4: Break Collision
    // Attempt to schedule a class during lunch break
    const breakClashRes = await request(app)
      .post('/api/academic/timetable')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicYearId: testAcademicYearId,
        departmentId: testDeptId,
        classId: testClassId,
        sectionId: sec2.id,
        subjectId: testSubject2Id,
        facultyId: secondaryFacultyId,
        roomId: testRoom2Id,
        timeSlotId: breakSlotId, // BREAK SLOT
        dayOfWeek: 'MONDAY',
      });

    expect(breakClashRes.status).toBe(409);
    expect(breakClashRes.body.error.code).toBe('BREAK_SLOT');

    // 6. CONFLICT 5: Faculty Availability Violation
    // Set Faculty 2 unavailable on Saturday
    await request(app)
      .post('/api/academic/faculty/availability')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        facultyId: secondaryFacultyId,
        academicYearId: testAcademicYearId,
        dayOfWeek: 'SATURDAY',
        isAvailable: false,
        reason: 'Research sabbatical day.',
      });

    const availClashRes = await request(app)
      .post('/api/academic/timetable')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicYearId: testAcademicYearId,
        departmentId: testDeptId,
        classId: testClassId,
        sectionId: sec2.id,
        subjectId: testSubject2Id,
        facultyId: secondaryFacultyId,
        roomId: testRoom2Id,
        timeSlotId: saturdayPeriod1SlotId,
        dayOfWeek: 'SATURDAY',
      });

    expect(availClashRes.status).toBe(409);
    expect(availClashRes.body.error.code).toBe('AVAILABILITY_CONFLICT');
  });

  // ----------------------------------------------------
  // TEST 7: Extra Class Requests & Approval Workflow
  // ----------------------------------------------------
  it('7. should handle extra class request submission and administrative approval', async () => {
    const extraRes = await request(app)
      .post('/api/academic/extra-classes')
      .set('Authorization', `Bearer ${testFacultyToken}`)
      .send({
        academicYearId: testAcademicYearId,
        classId: testClassId,
        sectionId: testSectionId,
        subjectId: testSubject1Id,
        facultyId: testFacultyId,
        roomId: testRoom2Id,
        date: '2026-10-15',
        startTime: '16:00',
        endTime: '17:30',
        reason: 'Remedial tutoring on Dynamic Programming algorithms.',
      });

    expect(extraRes.status).toBe(201);
    expect(extraRes.body.data.status).toBe('PENDING');
    const extraId = extraRes.body.data.id;

    // HOD/Admin Approves
    const approveRes = await request(app)
      .post(`/api/academic/extra-classes/${extraId}/review`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        action: 'APPROVED',
        reviewNotes: 'Approved for semester exam preparation.',
      });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('APPROVED');
  });

  // ----------------------------------------------------
  // TEST 8: Substitute Faculty Appointment
  // ----------------------------------------------------
  it('8. should assign substitute faculty verifying substitute availability and absence', async () => {
    const subRes = await request(app)
      .post('/api/academic/substitute-faculty')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        originalFacultyId: testFacultyId,
        substituteFacultyId: secondaryFacultyId,
        date: '2026-10-16',
        classId: testClassId,
        sectionId: testSectionId,
        subjectId: testSubject1Id,
        timeSlotId: period1SlotId,
        roomId: testRoom1Id,
        reason: 'Original faculty attending international research symposium.',
      });

    expect(subRes.status).toBe(201);
    expect(subRes.body.data.substituteFacultyId).toBe(secondaryFacultyId);
    expect(subRes.body.data.status).toBe('CONFIRMED');
  });

  // ----------------------------------------------------
  // TEST 9: Strict RBAC & Non-Faculty Blocking
  // ----------------------------------------------------
  it('9. should strictly block non-faculty / unauthorized roles from academic administration', async () => {
    const blockedRes = await request(app)
      .post('/api/academic/timetable')
      .set('Authorization', `Bearer ${nonFacultyToken}`)
      .send({
        academicYearId: testAcademicYearId,
        classId: testClassId,
        sectionId: testSectionId,
        subjectId: testSubject1Id,
        facultyId: testFacultyId,
        roomId: testRoom1Id,
        timeSlotId: period1SlotId,
        dayOfWeek: 'MONDAY',
      });

    expect(blockedRes.status).toBe(403);
    expect(blockedRes.body.error.code).toBe('FORBIDDEN_ROLE');
  });
});
