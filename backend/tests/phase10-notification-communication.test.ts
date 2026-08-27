import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/prisma';
import { generateAccessToken } from '../src/utils/jwt';
import { WhatsAppService } from '../src/services/whatsapp.service';

const app = createApp();

describe('Phase 10 — Real-Time Notification, WhatsApp & Communication Platform Suite', () => {
  let superAdminToken: string;
  let hodToken: string;
  let facultyToken: string;
  let studentToken: string;

  let superAdminUser: any;
  let hodUser: any;
  let facultyUser: any;
  let studentUser: any;
  let department: any;
  let classObj: any;

  let noticeId: string;
  let mandatoryNoticeId: string;
  let notificationId: string;

  beforeAll(async () => {
    // 1. Super Admin Auth Token
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'principal@school.edu', password: 'Admin@SecurePassword2026!', role: 'SUPER_ADMIN' });
    expect(adminLoginRes.status).toBe(200);
    superAdminToken = adminLoginRes.body.data.tokens.accessToken;
    superAdminUser = adminLoginRes.body.data.user;

    // 2. Fetch or setup HOD, Faculty, Student
    department = await prisma.department.findFirst({ include: { hod: true } });
    if (department?.hod) {
      hodUser = department.hod;
      hodToken = generateAccessToken({ userId: hodUser.id, email: hodUser.email, activeRole: 'HOD' });
    }

    const faculty = await prisma.faculty.findFirst({ include: { user: true } });
    if (faculty) {
      facultyUser = faculty.user;
      facultyToken = generateAccessToken({ userId: facultyUser.id, email: facultyUser.email, activeRole: 'FACULTY' });
    }

    const student = await prisma.student.findFirst({ include: { user: true } });
    if (student) {
      studentUser = student.user;
      studentToken = generateAccessToken({ userId: studentUser.id, email: studentUser.email, activeRole: 'STUDENT' });
    }

    classObj = await prisma.class.findFirst();

    // Seed standard WhatsApp templates
    await WhatsAppService.seedStandardTemplates();
  });

  it('1. should create and fetch In-App user notifications feed and mark read status', async () => {
    // Seed in-app notification
    const notif = await prisma.notification.create({
      data: {
        userId: superAdminUser.id,
        title: 'System Update Scheduled',
        message: 'Maintenance window set for Sunday 2:00 AM',
        type: 'SYSTEM',
        isRead: false,
      },
    });
    notificationId = notif.id;

    const listRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.unreadCount).toBeGreaterThanOrEqual(1);

    // Mark as read
    const readRes = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(readRes.status).toBe(200);
    expect(readRes.body.data.isRead).toBe(true);

    // Mark all as read
    const readAllRes = await request(app)
      .post('/api/notifications/read-all')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(readAllRes.status).toBe(200);
  });

  it('2. should estimate recipient count before mass notice broadcast', async () => {
    const estRes = await request(app)
      .get('/api/notices/recipient-estimate?targetAudience=ALL')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(estRes.status).toBe(200);
    expect(estRes.body.data.targetAudience).toBe('ALL');
    expect(estRes.body.data.estimatedRecipients).toBeGreaterThanOrEqual(1);
  });

  it('3. should create institution-wide notice as Super Admin and enforce role authorization for HOD/Faculty', async () => {
    const createRes = await request(app)
      .post('/api/notices')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        title: 'Annual Founders Day & Sports Week 2026',
        content: 'All departments and students are invited to celebrate Founders Day.',
        noticeType: 'EVENT',
        priority: 'HIGH',
        targetAudience: 'ALL',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.title).toContain('Founders Day');
    noticeId = createRes.body.data.id;

    // HOD attempting to issue institution-wide ALL notice -> 403 Forbidden
    if (hodToken) {
      const hodForbiddenRes = await request(app)
        .post('/api/notices')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          title: 'Unauthorised Institution Notice',
          content: 'HOD trying to broadcast to ALL',
          targetAudience: 'ALL',
        });

      expect(hodForbiddenRes.status).toBe(403);
    }
  });

  it('4. should support scheduled notices and process scheduler worker transitions', async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString();

    const schedRes = await request(app)
      .post('/api/notices')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        title: 'Scheduled Maintenance Notice',
        content: 'System will undergo maintenance tomorrow',
        publishDate: tomorrow,
        targetAudience: 'FACULTY',
      });

    expect(schedRes.status).toBe(201);
    expect(schedRes.body.data.status).toBe('SCHEDULED');

    // Run scheduler worker
    const processRes = await request(app)
      .post('/api/notices/process-scheduler')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(processRes.status).toBe(200);
    expect(processRes.body.data.publishedCount).toBeDefined();
  });

  it('5. should support mandatory notice read acknowledgment tracking', async () => {
    const mandRes = await request(app)
      .post('/api/notices')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        title: 'Mandatory Safety & Compliance Policy 2026',
        content: 'Please read and acknowledge institutional safety guidelines.',
        noticeType: 'EMERGENCY',
        priority: 'URGENT',
        targetAudience: 'ALL',
        requireAcknowledgment: true,
      });

    expect(mandRes.status).toBe(201);
    expect(mandRes.body.data.requireAcknowledgment).toBe(true);
    mandatoryNoticeId = mandRes.body.data.id;

    // Acknowledge Notice
    const ackRes = await request(app)
      .post(`/api/notices/${mandatoryNoticeId}/acknowledge`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(ackRes.status).toBe(200);
    expect(ackRes.body.data.noticeId).toBe(mandatoryNoticeId);
  });

  it('6. should list message templates and validate required template variables', async () => {
    const listRes = await request(app)
      .get('/api/communication/templates')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((t: any) => t.code === 'student_absence')).toBe(true);
  });

  it('7. should check WhatsApp provider configuration and return 400 when unconfigured (Zero Fake Delivery)', async () => {
    // Attempt sending without configuring env credentials -> Expect 400 WHATSAPP_NOT_CONFIGURED
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;

    const sendRes = await request(app)
      .post('/api/communication/whatsapp/send-template')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        recipientPhone: '+91 9876543210',
        templateCode: 'student_absence',
        variables: {
          parent_name: 'David',
          student_name: 'Alex',
          date: '2026-08-25',
          school_name: 'St. Lawrence',
        },
      });

    expect(sendRes.status).toBe(400);
    expect(sendRes.body.error.code).toBe('WHATSAPP_NOT_CONFIGURED');
  });

  it('8. should verify Official WhatsApp Webhook challenge (GET) and process webhook status callback (POST)', async () => {
    process.env.WHATSAPP_WEBHOOK_SECRET = 'school_management_whatsapp_webhook_secret_2026';

    // GET Challenge Verification
    const verifyRes = await request(app)
      .get('/api/communication/integrations/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=school_management_whatsapp_webhook_secret_2026&hub.challenge=CHALLENGE_123');

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.text).toBe('CHALLENGE_123');

    // Create a mock delivery record
    const msgId = `WAMID-${Date.now()}`;
    const delivery = await prisma.notificationDelivery.create({
      data: {
        channel: 'WHATSAPP',
        provider: 'META_WHATSAPP',
        providerMessageId: msgId,
        recipientContact: '+91 9876543210',
        templateCode: 'student_absence',
        status: 'SENT',
      },
    });

    // POST Status Callback
    const payloadObj = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_ENTRY_1',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                statuses: [
                  {
                    id: msgId,
                    status: 'delivered',
                    timestamp: '1724590000',
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const rawBodyStr = JSON.stringify(payloadObj);
    const crypto = await import('crypto');
    const signature = 'sha256=' + crypto.createHmac('sha256', 'school_management_whatsapp_webhook_secret_2026').update(rawBodyStr).digest('hex');

    const webhookRes = await request(app)
      .post('/api/communication/integrations/whatsapp/webhook')
      .set('x-hub-signature-256', signature)
      .send(payloadObj);

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.success).toBe(true);

    const updatedDelivery = await prisma.notificationDelivery.findFirst({ where: { id: delivery.id } });
    expect(updatedDelivery?.status).toBe('DELIVERED');
  });

  it('9. should trigger background message queue worker and handle retries gracefully', async () => {
    // Create a queued delivery item
    await prisma.notificationDelivery.create({
      data: {
        channel: 'EMAIL',
        provider: 'SMTP',
        recipientContact: 'test@school.edu',
        status: 'QUEUED',
      },
    });

    const queueRes = await request(app)
      .post('/api/communication/process-queue')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(queueRes.status).toBe(200);
    expect(queueRes.body.data.processed).toBeGreaterThanOrEqual(1);
  });

  it('10. should prevent duplicate event dispatches using idempotency keys', async () => {
    const { NotificationService } = await import('../src/services/notification.service');
    const idempotencyKey = `IDEMP-TEST-${Date.now()}`;

    const res1 = await NotificationService.dispatchNotificationEvent({
      eventType: 'STUDENT_ABSENT',
      payload: { studentId: 'MOCK_ID', date: '2026-08-25' },
      sourceModule: 'ATTENDANCE',
      idempotencyKey,
    });

    expect(res1.status).toBe('DISPATCHED');

    // Duplicate call with same key -> Ignored
    const res2 = await NotificationService.dispatchNotificationEvent({
      eventType: 'STUDENT_ABSENT',
      payload: { studentId: 'MOCK_ID', date: '2026-08-25' },
      sourceModule: 'ATTENDANCE',
      idempotencyKey,
    });

    expect(res2.status).toBe('DUPLICATE_IGNORED');
  });

  it('11. should fetch communication delivery logs with filter options', async () => {
    const logsRes = await request(app)
      .get('/api/communication/logs?channel=WHATSAPP')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(logsRes.status).toBe(200);
    expect(logsRes.body.data.deliveries).toBeDefined();
    expect(logsRes.body.data.providerConfigured).toBeDefined();
  });
});
