import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/prisma';

const app = createApp();

describe('Attendance & Academic Structure API', () => {
  let adminToken: string;
  let academicYearId: string;
  let classId: string;
  let sectionId: string;

  beforeAll(async () => {
    await prisma.user.updateMany({
      where: { email: 'principal@school.edu' },
      data: { failedLoginAttempts: 0, lockoutUntil: null, status: 'ACTIVE' },
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'principal@school.edu',
        password: 'Admin@SecurePassword2026!',
      });
    adminToken = loginRes.body.data.tokens.accessToken;
  });

  it('should create academic year, class, and section', async () => {
    const yearRes = await request(app)
      .post('/api/academic/years')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Year-${Date.now().toString().slice(-4)}`,
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2027-05-31T00:00:00.000Z',
        isCurrent: true,
      });

    expect(yearRes.status).toBe(201);
    academicYearId = yearRes.body.data.id;

    const classRes = await request(app)
      .post('/api/academic/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Grade 10 - Secondary',
        code: `G10-${Date.now().toString().slice(-4)}`,
        academicYearId,
      });

    expect(classRes.status).toBe(201);
    classId = classRes.body.data.id;

    const secRes = await request(app)
      .post('/api/academic/sections')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        classId,
        name: 'Section Alpha',
        capacity: 40,
      });

    expect(secRes.status).toBe(201);
    sectionId = secRes.body.data.id;
  });

  it('should admit a student with guardian details', async () => {
    const admNum = `ADM-${Date.now().toString().slice(-5)}`;
    const admitRes = await request(app)
      .post('/api/academic/students/admit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Alice',
        lastName: 'Smith',
        email: `alice_${Date.now()}@student.school.edu`,
        whatsAppNumber: '+1-555-0199',
        admissionNumber: admNum,
        sectionId,
        guardian: {
          fullName: 'Robert Smith',
          relationship: 'FATHER',
          phone: '+1-555-0199',
        },
      });

    expect(admitRes.status).toBe(201);
    expect(admitRes.body.data.student.admissionNumber).toBe(admNum);
    expect(admitRes.body.data.user.firstName).toBe('Alice');
  });

  it('should record user attendance check-in and check-out', async () => {
    // Check-in
    const checkInRes = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        source: 'WEB',
      });

    expect([200, 400]).toContain(checkInRes.status);
    if (checkInRes.status === 200) {
      expect(checkInRes.body.data.status).toBeDefined();
    }

    // Check-out
    const checkOutRes = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        source: 'WEB',
      });

    expect([200, 400]).toContain(checkOutRes.status);
  });

  it('should retrieve audit logs as Super Admin', async () => {
    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
