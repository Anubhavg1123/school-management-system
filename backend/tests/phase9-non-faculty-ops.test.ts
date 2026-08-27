import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { PrismaClient } from '@prisma/client';
import { generateAccessToken } from '../src/utils/jwt';

const app = createApp();
const prisma = new PrismaClient();

describe('Phase 9 — Complete Non-Faculty, Attender, Driver, Security, Vehicle & Visitor Suite', () => {
  let superAdminToken: string;
  let driverToken: string;
  let securityToken: string;
  let attenderToken: string;

  let driverUser: any;
  let securityUser: any;
  let attenderUser: any;
  let driverProfile: any;
  let studentUser: any;

  let vehicleId: string;
  let vehicleRegNo: string;
  let visitorPassNumber: string;
  let visitorPassToken: string;
  let visitorEntryId: string;
  let maintenanceId: string;

  beforeAll(async () => {
    // 1. Super Admin Auth Token
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'principal@school.edu', password: 'Admin@SecurePassword2026!', role: 'SUPER_ADMIN' });
    expect(adminLoginRes.status).toBe(200);
    superAdminToken = adminLoginRes.body.data.tokens.accessToken;

    const nonFacRole = await prisma.role.findUnique({ where: { name: 'NON_FACULTY' } });

    // 2. Setup Non-Faculty Driver User
    const driverEmail = `driver_${Date.now()}@school.edu`;
    driverUser = await prisma.user.create({
      data: {
        email: driverEmail,
        username: `driver_${Date.now()}`,
        passwordHash: 'hashedPass123',
        firstName: 'John',
        lastName: 'Driver',
        userCategory: 'DRIVER',
        status: 'ACTIVE',
        activeRole: 'NON_FACULTY',
      },
    });
    if (nonFacRole) {
      await prisma.userRole.create({ data: { userId: driverUser.id, roleId: nonFacRole.id, isPrimary: true } });
    }
    driverProfile = await prisma.nonFacultyStaff.create({
      data: {
        userId: driverUser.id,
        employeeCode: `EMP-DRV-${Math.floor(Math.random() * 9000 + 1000)}`,
        jobTitle: 'DRIVER',
      },
    });

    // 3. Setup Non-Faculty Security User
    const secEmail = `security_${Date.now()}@school.edu`;
    securityUser = await prisma.user.create({
      data: {
        email: secEmail,
        username: `security_${Date.now()}`,
        passwordHash: 'hashedPass123',
        firstName: 'Sam',
        lastName: 'Security',
        userCategory: 'SECURITY_OFFICER',
        status: 'ACTIVE',
        activeRole: 'NON_FACULTY',
      },
    });
    if (nonFacRole) {
      await prisma.userRole.create({ data: { userId: securityUser.id, roleId: nonFacRole.id, isPrimary: true } });
    }
    await prisma.nonFacultyStaff.create({
      data: {
        userId: securityUser.id,
        employeeCode: `EMP-SEC-${Math.floor(Math.random() * 9000 + 1000)}`,
        jobTitle: 'SECURITY_OFFICER',
      },
    });

    // 4. Setup Non-Faculty Attender User
    const attEmail = `attender_${Date.now()}@school.edu`;
    attenderUser = await prisma.user.create({
      data: {
        email: attEmail,
        username: `attender_${Date.now()}`,
        passwordHash: 'hashedPass123',
        firstName: 'Alice',
        lastName: 'Attender',
        userCategory: 'ATTENDER',
        status: 'ACTIVE',
        activeRole: 'NON_FACULTY',
      },
    });
    if (nonFacRole) {
      await prisma.userRole.create({ data: { userId: attenderUser.id, roleId: nonFacRole.id, isPrimary: true } });
    }
    await prisma.nonFacultyStaff.create({
      data: {
        userId: attenderUser.id,
        employeeCode: `EMP-ATT-${Math.floor(Math.random() * 9000 + 1000)}`,
        jobTitle: 'ATTENDER',
      },
    });

    // 5. Generate valid JWT tokens for test roles
    driverToken = generateAccessToken({ userId: driverUser.id, email: driverUser.email, activeRole: 'NON_FACULTY' });
    securityToken = generateAccessToken({ userId: securityUser.id, email: securityUser.email, activeRole: 'NON_FACULTY' });
    attenderToken = generateAccessToken({ userId: attenderUser.id, email: attenderUser.email, activeRole: 'NON_FACULTY' });

    // 6. Find a student for visitor parent linking
    studentUser = await prisma.student.findFirst({
      include: { user: true },
    });
  });

  it('1. should fetch Non-Faculty Operational Dashboard and support check-in / check-out', async () => {
    const dashRes = await request(app)
      .get('/api/non-faculty/dashboard')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(dashRes.status).toBe(200);
    expect(dashRes.body.success).toBe(true);
    expect(dashRes.body.data.user.id).toBe(driverUser.id);
    expect(dashRes.body.data.attendanceStatus.status).toBe('NOT_CHECKED_IN');

    // Perform Check-in
    const checkInRes = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ source: 'WEB' });

    expect(checkInRes.status).toBe(200);
    expect(['PRESENT', 'LATE']).toContain(checkInRes.body.data.status);

    // Prevent duplicate check-in
    const dupCheckInRes = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ source: 'WEB' });

    expect(dupCheckInRes.status).toBe(400);
  });

  it('2. should support Attender-assisted attendance entry with enteredByUserId audit logging', async () => {
    const attRes = await request(app)
      .post('/api/non-faculty/attender/attendance')
      .set('Authorization', `Bearer ${attenderToken}`)
      .send({
        targetUserId: securityUser.id,
        action: 'CHECK_IN',
        remarks: 'Recorded by Attender at security gate',
      });

    expect(attRes.status).toBe(201);
    expect(attRes.body.data.userId).toBe(securityUser.id);
    expect(attRes.body.data.enteredByUserId).toBe(attenderUser.id);
    expect(attRes.body.data.source).toBe('ATTENDER');
  });

  it('3. should list staff categories and allow Super Admin to create a new category', async () => {
    const catCode = `CAT_${Math.floor(Math.random() * 9000 + 1000)}`;
    const createRes = await request(app)
      .post('/api/non-faculty/categories')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        code: catCode,
        name: 'Housekeeping Operational Staff',
        description: 'Sanitation and hygiene operational team',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.code).toBe(catCode);

    const listRes = await request(app)
      .get('/api/non-faculty/categories')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((c: any) => c.code === catCode)).toBe(true);
  });

  it('4. should create vehicle in Fleet Master and enforce unique registration number (409 Conflict)', async () => {
    vehicleRegNo = `KA-01-BUS-${Math.floor(Math.random() * 9000 + 1000)}`;

    const createRes = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        registrationNumber: vehicleRegNo,
        vehicleType: 'BUS',
        makeModel: 'Eicher Starline 50 Seater',
        color: 'Yellow',
        fuelType: 'DIESEL',
        capacity: 50,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.registrationNumber).toBe(vehicleRegNo);
    vehicleId = createRes.body.data.id;

    // Duplicate Registration Number -> 409 Conflict
    const dupRes = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        registrationNumber: vehicleRegNo,
        vehicleType: 'BUS',
      });

    expect(dupRes.status).toBe(409);
  });

  it('5. should assign vehicle to Driver and preserve assignment history', async () => {
    const assignRes = await request(app)
      .post(`/api/vehicles/${vehicleId}/assignments`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        driverId: driverProfile.id,
        notes: 'Primary Morning Route Bus Assignment',
      });

    expect(assignRes.status).toBe(201);
    expect(assignRes.body.data.driverId).toBe(driverProfile.id);
    expect(assignRes.body.data.status).toBe('ACTIVE');

    const getVehicleRes = await request(app)
      .get(`/api/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(getVehicleRes.status).toBe(200);
    expect(getVehicleRes.body.data.assignedDriverId).toBe(driverProfile.id);
    expect(getVehicleRes.body.data.assignments.length).toBeGreaterThanOrEqual(1);
  });

  it('6. should record daily vehicle KM log and enforce odometer validation rules', async () => {
    const dateStr = new Date().toISOString().split('T')[0];

    // Record initial KM Log (100 -> 145 = 45 KM)
    const km1Res = await request(app)
      .post('/api/vehicles/km-logs')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        vehicleId,
        date: dateStr,
        startingKm: 100,
        endingKm: 145,
        purpose: 'Morning Student Pick Up',
        route: 'Route 4 — South City Circle',
      });

    expect(km1Res.status).toBe(201);
    expect(km1Res.body.data.totalKm).toBe(45);

    // Reject ending KM lower than starting KM -> 400 Bad Request
    const invalidEndingRes = await request(app)
      .post('/api/vehicles/km-logs')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        vehicleId,
        date: dateStr,
        startingKm: 150,
        endingKm: 120,
      });

    expect(invalidEndingRes.status).toBe(400);

    // Reject starting KM less than previous ending KM (145) -> 400 Bad Request
    const rollbackRes = await request(app)
      .post('/api/vehicles/km-logs')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        vehicleId,
        date: dateStr,
        startingKm: 130, // Less than previous ending KM (145)
        endingKm: 180,
      });

    expect(rollbackRes.status).toBe(400);
  });

  it('7. should log fuel record and recalculate total cost on backend', async () => {
    const dateStr = new Date().toISOString().split('T')[0];

    const fuelRes = await request(app)
      .post('/api/vehicles/fuel')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        vehicleId,
        date: dateStr,
        fuelType: 'DIESEL',
        quantity: 40.5,
        pricePerUnit: 92.5,
        odometerReading: 145,
        fuelStation: 'Shell Fuel Outlet Gate #2',
        receiptNumber: 'RCP-FL-8891',
      });

    expect(fuelRes.status).toBe(201);
    expect(fuelRes.body.data.quantity).toBe(40.5);

    // Recalculated total cost = 40.5 * 92.5 = 3746.25
    expect(fuelRes.body.data.totalCost).toBe(3746.25);
  });

  it('8. should record garage maintenance request and update status through completion', async () => {
    const dateStr = new Date().toISOString().split('T')[0];

    const maintRes = await request(app)
      .post('/api/vehicles/maintenance')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        vehicleId,
        date: dateStr,
        problem: 'Brake pad noise during deceleration',
        garageVendor: 'Apex Motors Authorized Service',
        estimatedCost: 3500,
        odometerReading: 145,
      });

    expect(maintRes.status).toBe(201);
    expect(maintRes.body.data.status).toBe('REPORTED');
    maintenanceId = maintRes.body.data.id;

    // Update maintenance status to COMPLETED
    const updateMaintRes = await request(app)
      .patch(`/api/vehicles/maintenance/${maintenanceId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        status: 'COMPLETED',
        actualCost: 3200,
        workPerformed: 'Replaced front brake pads and fluid top-up',
      });

    expect(updateMaintRes.status).toBe(200);
    expect(updateMaintRes.body.data.status).toBe('COMPLETED');
    expect(updateMaintRes.body.data.actualCost).toBe(3200);
  });

  it('9. should register campus visitor, generate passNumber & passToken, and list active visitors', async () => {
    const entryRes = await request(app)
      .post('/api/visitor-security/visitors')
      .set('Authorization', `Bearer ${securityToken}`)
      .send({
        fullName: 'Robert Miller',
        contactNumber: '+91 9876543210',
        visitorType: 'GUEST',
        personToMeetName: 'Principal Dr. Harrison',
        purpose: 'Vendor Procurement Discussion',
        vehicleNumber: 'KA-02-XY-9999',
        vehicleType: 'CAR',
      });

    expect(entryRes.status).toBe(201);
    expect(entryRes.body.data.passNumber).toBeDefined();
    expect(entryRes.body.data.passToken).toBeDefined();
    expect(entryRes.body.data.status).toBe('INSIDE_CAMPUS');

    visitorPassNumber = entryRes.body.data.passNumber;
    visitorPassToken = entryRes.body.data.passToken;
    visitorEntryId = entryRes.body.data.id;

    // Fetch Active Visitors
    const activeRes = await request(app)
      .get('/api/visitor-security/active-visitors')
      .set('Authorization', `Bearer ${securityToken}`);

    expect(activeRes.status).toBe(200);
    expect(activeRes.body.data.some((v: any) => v.passNumber === visitorPassNumber)).toBe(true);
  });

  it('10. should link parent/guardian visitor to student record during entry', async () => {
    if (!studentUser) return;

    const parentEntryRes = await request(app)
      .post('/api/visitor-security/visitors')
      .set('Authorization', `Bearer ${securityToken}`)
      .send({
        fullName: 'David Patel',
        contactNumber: '+91 9123456789',
        visitorType: 'PARENT',
        studentRelationship: 'FATHER',
        studentId: studentUser.id,
        personToMeetName: studentUser.user.firstName,
        purpose: 'Parent-Teacher Meeting',
      });

    expect(parentEntryRes.status).toBe(201);
    expect(parentEntryRes.body.data.visitor.visitorType).toBe('PARENT');
    expect(parentEntryRes.body.data.visitor.studentId).toBe(studentUser.id);
  });

  it('11. should perform vehicle gate verification for registered and unregistered vehicles', async () => {
    // Registered Fleet Vehicle Verification
    const verRegRes = await request(app)
      .get(`/api/visitor-security/vehicles/verify/${vehicleRegNo}`)
      .set('Authorization', `Bearer ${securityToken}`);

    expect(verRegRes.status).toBe(200);
    expect(verRegRes.body.data.isApproved).toBe(true);
    expect(verRegRes.body.data.category).toBe('INSTITUTIONAL_FLEET');

    // Unregistered Vehicle Verification
    const verUnregRes = await request(app)
      .get('/api/visitor-security/vehicles/verify/MH-12-UNREG-000')
      .set('Authorization', `Bearer ${securityToken}`);

    expect(verUnregRes.status).toBe(200);
    expect(verUnregRes.body.data.isApproved).toBe(false);
    expect(verUnregRes.body.data.category).toBe('UNREGISTERED_TEMPORARY');
  });

  it('12. should mark visitor exit, prevent duplicate exit, and enforce security RBAC isolation', async () => {
    // Exit Visitor
    const exitRes = await request(app)
      .post(`/api/visitor-security/visitors/${visitorPassNumber}/exit`)
      .set('Authorization', `Bearer ${securityToken}`)
      .send({ remarks: 'Cleared gate #1' });

    expect(exitRes.status).toBe(200);
    expect(exitRes.body.data.status).toBe('EXITED');

    // Prevent duplicate exit -> 400 Bad Request
    const dupExitRes = await request(app)
      .post(`/api/visitor-security/visitors/${visitorPassNumber}/exit`)
      .set('Authorization', `Bearer ${securityToken}`);

    expect(dupExitRes.status).toBe(400);

    // Security RBAC isolation: Reject Security staff accessing financial fee endpoints -> 403 Forbidden
    const rbacRes = await request(app)
      .get('/api/fees/structures')
      .set('Authorization', `Bearer ${securityToken}`);

    expect(rbacRes.status).toBe(403);
  });
});
