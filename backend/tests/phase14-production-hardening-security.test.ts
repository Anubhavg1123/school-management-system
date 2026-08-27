import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/prisma';
import { generateAccessToken as generateTestToken } from '../src/utils/jwt';
import { validateProductionConfig } from '../src/utils/config-validator';
import { MfaService } from '../src/services/mfa.service';
import { createDatabaseBackup } from '../scripts/db-backup';
import { runRestoreVerification } from '../scripts/db-restore-test';
import { runDataIntegrityCheck } from '../scripts/data-integrity-check';

const app = createApp();

describe('Phase 14 — Complete Production Hardening, Security, Backup & Deployment Suite', () => {
  let adminToken: string;
  let adminUserId: string;
  let studentToken: string;
  let studentUserId: string;
  let studentId: string;

  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Seed Super Admin User
    const adminUser = await prisma.user.create({
      data: {
        email: `p14.admin.${timestamp}@school.edu`,
        username: `p14_admin_${timestamp}`,
        passwordHash: '$2b$12$eX4mP1eH4sHeDPassw0rdStr1ngH4shValu3F0rT3st1ng0nly',
        firstName: 'Prod',
        lastName: 'Admin',
        status: 'ACTIVE',
        activeRole: 'SUPER_ADMIN',
      },
    });
    adminUserId = adminUser.id;
    adminToken = generateTestToken({ userId: adminUser.id, activeRole: 'SUPER_ADMIN' });

    let adminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
    if (!adminRole) {
      adminRole = await prisma.role.create({ data: { name: 'SUPER_ADMIN', description: 'Super Admin' } });
    }
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id, isPrimary: true },
    });

    // 2. Seed Student User & Student
    const studentUser = await prisma.user.create({
      data: {
        email: `p14.student.${timestamp}@school.edu`,
        username: `p14_std_${timestamp}`,
        passwordHash: '$2b$12$eX4mP1eH4sHeDPassw0rdStr1ngH4shValu3F0rT3st1ng0nly',
        firstName: 'Prod',
        lastName: 'Student',
        status: 'ACTIVE',
        activeRole: 'STUDENT',
      },
    });
    studentUserId = studentUser.id;
    studentToken = generateTestToken({ userId: studentUser.id, activeRole: 'STUDENT' });

    let studentRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
    if (!studentRole) {
      studentRole = await prisma.role.create({ data: { name: 'STUDENT', description: 'Student' } });
    }
    await prisma.userRole.create({
      data: { userId: studentUser.id, roleId: studentRole.id, isPrimary: true },
    });

    const ay = await prisma.academicYear.create({
      data: {
        name: `AY 2026-2027 P14 ${timestamp}`,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-05-31'),
        isCurrent: true,
      },
    });

    const dept = await prisma.department.create({
      data: {
        name: `Engineering P14 ${timestamp}`,
        code: `ENG14-${timestamp}`,
      },
    });

    const cls = await prisma.class.create({
      data: {
        name: `Grade 11 P14 ${timestamp}`,
        code: `G11P14-${timestamp}`,
        departmentId: dept.id,
        academicYearId: ay.id,
      },
    });

    const sec = await prisma.section.create({
      data: {
        name: 'Section A',
        classId: cls.id,
      },
    });

    const std = await prisma.student.create({
      data: {
        userId: studentUser.id,
        admissionNumber: `ADM-P14-${timestamp}`,
        sectionId: sec.id,
        academicYearId: ay.id,
        status: 'ACTIVE',
      },
    });
    studentId = std.id;
  });

  // 1. Health Probes
  it('1. GET /health should return 200 with database status UP and memory stats', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.database.status).toBe('UP');
    expect(res.body.system.memory).toBeDefined();
    expect(res.body.uptime).toBeDefined();
  });

  it('2. GET /ready should return 200 with status READY', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('READY');
  });

  it('3. GET /live should return 200 with status ALIVE', async () => {
    const res = await request(app).get('/live');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ALIVE');
  });

  // 2. Request Correlation ID
  it('4. Should generate and attach x-request-id correlation header on responses', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-request-id']).toBeDefined();
    expect(typeof res.headers['x-request-id']).toBe('string');
  });

  // 3. HTTP Security Headers
  it('5. Should enforce Helmet HTTP security headers (CSP, nosniff, frameguard)', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['strict-transport-security']).toBeDefined();
  });

  // 4. Configuration Validator
  it('6. Config validator should inspect environment and report safety status', () => {
    const result = validateProductionConfig();
    expect(result).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  // 5. MFA Service & Endpoints
  it('7. Should initiate MFA setup generating secret, otpauth URL and backup codes', async () => {
    const res = await request(app)
      .post('/api/auth/mfa/setup')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.secret).toBeDefined();
    expect(res.body.data.otpAuthUrl).toContain('otpauth://totp/');
    expect(res.body.data.backupCodes.length).toBe(8);
  });

  it('8. Should reject invalid 6-digit MFA verification code', async () => {
    const res = await request(app)
      .post('/api/auth/mfa/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ token: '000000' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_MFA_TOKEN');
  });

  it('9. Should verify correct 6-digit TOTP code and enable MFA', async () => {
    const user = await prisma.user.findUnique({ where: { id: adminUserId } });
    expect(user?.mfaSecret).toBeDefined();

    const validToken = MfaService.generateTOTP(user!.mfaSecret!);

    const res = await request(app)
      .post('/api/auth/mfa/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ token: validToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isMfaEnabled).toBe(true);
  });

  it('10. Should disable MFA for user upon request', async () => {
    const res = await request(app)
      .post('/api/auth/mfa/disable')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isMfaEnabled).toBe(false);
  });

  // 6. Database Backup & Restore Verification
  it('11. Database backup script should create timestamped copy with valid SHA-256 hash', () => {
    const backupRes = createDatabaseBackup();
    expect(backupRes.success).toBe(true);
    expect(backupRes.backupPath).toBeDefined();
    expect(backupRes.checksum).toHaveLength(64); // SHA-256 length
    expect(backupRes.sizeBytes).toBeGreaterThan(0);
  });

  it('12. Database restore verification should validate checksum and restore to isolated DB', async () => {
    const restoreRes = await runRestoreVerification();
    expect(restoreRes.success).toBe(true);
    expect(restoreRes.verifiedChecksum).toBe(true);
    expect(restoreRes.metrics.usersCount).toBeGreaterThan(0);
    expect(restoreRes.metrics.rolesCount).toBeGreaterThan(0);
  });

  // 7. Data Integrity Audit
  it('13. Data integrity audit check should verify relational tables and report 0 critical anomalies', async () => {
    const integrityRes = await runDataIntegrityCheck();
    expect(integrityRes.totalChecks).toBeGreaterThanOrEqual(5);
    expect(integrityRes.passedChecks).toBe(integrityRes.totalChecks);
    expect(integrityRes.issuesFound.length).toBe(0);
  });

  // 8. IDOR & Privilege Escalation Defense
  it('14. Student attempting cross-student data access should be rejected with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/student/attendance/unauthorized_student_999')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('STUDENT_ACCESS_DENIED');
  });

  it('15. Student attempting administrative Principal route should be rejected with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/principal/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
  });
});
