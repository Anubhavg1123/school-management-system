import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';
import { WhatsAppService } from './whatsapp.service';

export interface NotificationEventPayload {
  eventType: string;
  payload: Record<string, any>;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  sourceModule: 'ATTENDANCE' | 'ASSIGNMENT' | 'FEES' | 'LEAVE' | 'TIMETABLE' | 'VISITOR' | 'NOTICE' | 'EXAMINATION' | 'RESULT' | 'PAYMENT' | 'GENERAL';
  createdByUserId?: string;
  idempotencyKey?: string;
}

export class NotificationService {
  /**
   * 1. Centralized Notification Event Dispatcher
   */
  static async dispatchNotificationEvent(eventPayload: NotificationEventPayload) {
    // Check idempotency key to prevent duplicate notifications
    if (eventPayload.idempotencyKey) {
      const existing = await prisma.notificationEventLog.findUnique({
        where: { idempotencyKey: eventPayload.idempotencyKey },
      });
      if (existing) {
        return { status: 'DUPLICATE_IGNORED', eventId: existing.id };
      }
    }

    const eventLog = await prisma.notificationEventLog.create({
      data: {
        eventType: eventPayload.eventType,
        payload: JSON.stringify(eventPayload.payload),
        priority: eventPayload.priority || 'NORMAL',
        sourceModule: eventPayload.sourceModule,
        status: 'PROCESSING',
        idempotencyKey: eventPayload.idempotencyKey || null,
        createdByUserId: eventPayload.createdByUserId || null,
      },
    });

    try {
      // 2. Resolve Target Recipients and create In-App notifications + WhatsApp/Email deliveries
      const recipients = await this.resolveRecipientsForEvent(eventPayload.eventType, eventPayload.payload);

      for (const r of recipients) {
        // Create In-App Notification
        await prisma.notification.create({
          data: {
            userId: r.userId,
            title: r.title,
            message: r.message,
            type: eventPayload.eventType,
            isRead: false,
          },
        });

        // If recipient has parent/guardian WhatsApp contact and WhatsApp event is enabled
        if (r.guardianPhone && WhatsAppService.isConfigured()) {
          try {
            await WhatsAppService.sendTemplateMessage({
              recipientPhone: r.guardianPhone,
              templateCode: r.templateCode || 'student_absence',
              variables: r.templateVariables || {},
              eventId: eventLog.id,
              userId: r.userId,
            });
          } catch (waErr: any) {
            console.error(`[WhatsApp] Failed to dispatch to ${r.guardianPhone}:`, waErr.message);
          }
        }
      }

      await prisma.notificationEventLog.update({
        where: { id: eventLog.id },
        data: { status: 'COMPLETED' },
      });

      return { status: 'DISPATCHED', eventId: eventLog.id, recipientCount: recipients.length };
    } catch (err: any) {
      await prisma.notificationEventLog.update({
        where: { id: eventLog.id },
        data: { status: 'FAILED' },
      });
      throw err;
    }
  }

  /**
   * Helper: Resolve Target Recipients based on Event Type & Payload
   */
  private static async resolveRecipientsForEvent(eventType: string, payload: Record<string, any>) {
    const recipients: Array<{
      userId: string;
      title: string;
      message: string;
      guardianPhone?: string;
      templateCode?: string;
      templateVariables?: Record<string, string>;
    }> = [];

    switch (eventType) {
      case 'STUDENT_ABSENT': {
        if (payload.studentId) {
          const student = await prisma.student.findUnique({
            where: { id: payload.studentId },
            include: { user: true, guardians: true },
          });

          if (student) {
            const primaryGuardian = student.guardians[0];
            const dateStr = payload.date || new Date().toISOString().split('T')[0];

            recipients.push({
              userId: student.userId,
              title: 'Attendance Alert: Marked Absent',
              message: `You were marked absent on ${dateStr}.`,
              guardianPhone: primaryGuardian?.phone || undefined,
              templateCode: 'student_absence',
              templateVariables: {
                parent_name: primaryGuardian?.fullName || 'Parent',
                student_name: `${student.user.firstName} ${student.user.lastName}`,
                date: dateStr,
                school_name: 'St. Lawrence School',
              },
            });
          }
        }
        break;
      }

      case 'ASSIGNMENT_PUBLISHED': {
        if (payload.classId && payload.sectionId) {
          const students = await prisma.student.findMany({
            where: { sectionId: payload.sectionId, status: 'ACTIVE' },
            include: { user: true, guardians: true },
          });

          for (const s of students) {
            const primaryGuardian = s.guardians[0];
            recipients.push({
              userId: s.userId,
              title: `New Assignment: ${payload.title}`,
              message: `Assignment "${payload.title}" for ${payload.subjectName || 'Subject'} due on ${payload.dueDate}.`,
              guardianPhone: primaryGuardian?.phone || undefined,
              templateCode: 'assignment_notification',
              templateVariables: {
                assignment_title: payload.title,
                subject: payload.subjectName || 'Academic Subject',
                due_date: payload.dueDate,
              },
            });
          }
        }
        break;
      }

      case 'FEE_DUE':
      case 'FEE_OVERDUE': {
        if (payload.studentId) {
          const student = await prisma.student.findUnique({
            where: { id: payload.studentId },
            include: { user: true, guardians: true },
          });

          if (student) {
            const primaryGuardian = student.guardians[0];
            recipients.push({
              userId: student.userId,
              title: `Fee Notice: ${payload.title || 'Payment Reminder'}`,
              message: `Fee installment of ₹${payload.amount} is ${eventType === 'FEE_OVERDUE' ? 'OVERDUE' : 'due on ' + payload.dueDate}.`,
              guardianPhone: primaryGuardian?.phone || undefined,
              templateCode: 'fee_reminder',
              templateVariables: {
                parent_name: primaryGuardian?.fullName || 'Parent',
                amount: String(payload.amount),
                student_name: `${student.user.firstName} ${student.user.lastName}`,
                due_date: payload.dueDate || new Date().toISOString().split('T')[0],
              },
            });
          }
        }
        break;
      }

      case 'LEAVE_SUBMITTED':
      case 'LEAVE_APPROVED':
      case 'LEAVE_REJECTED': {
        if (payload.targetUserId) {
          recipients.push({
            userId: payload.targetUserId,
            title: `Faculty Leave Status: ${payload.status}`,
            message: payload.message || `Your leave request has been ${payload.status.toLowerCase()}.`,
          });
        }
        break;
      }

      case 'EMERGENCY_NOTICE': {
        // Targeted to ALL active users
        const users = await prisma.user.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true },
        });

        for (const u of users) {
          recipients.push({
            userId: u.id,
            title: `EMERGENCY ALERT: ${payload.title}`,
            message: payload.message,
          });
        }
        break;
      }

      case 'RESULT_PUBLISHED': {
        // Notify student and primary guardian when result is published
        if (payload.studentId) {
          const student = await prisma.student.findUnique({
            where: { id: payload.studentId },
            include: { user: true, guardians: true },
          });

          if (student) {
            const primaryGuardian = student.guardians[0];
            const examName = payload.examinationName || 'Examination';

            recipients.push({
              userId: student.userId,
              title: `Result Published: ${examName}`,
              message: `Your result for ${examName} has been published. Percentage: ${payload.percentage || 'N/A'}%.`,
              guardianPhone: primaryGuardian?.phone || undefined,
              templateCode: 'result_notification',
              templateVariables: {
                parent_name: primaryGuardian?.fullName || 'Parent',
                student_name: `${student.user.firstName} ${student.user.lastName}`,
                exam_name: examName,
                percentage: String(payload.percentage || '0'),
              },
            });
          }
        }
        break;
      }

      case 'EXAM_SCHEDULED': {
        // Notify all enrolled students in a class section when exam is scheduled
        if (payload.classId) {
          const students = await prisma.student.findMany({
            where: {
              section: { classId: payload.classId },
              status: 'ACTIVE',
            },
            include: { user: true },
          });

          for (const s of students) {
            recipients.push({
              userId: s.userId,
              title: `Exam Scheduled: ${payload.examinationName || 'Examination'}`,
              message: `An examination "${payload.examinationName}" has been scheduled. Please check the exam timetable.`,
            });
          }
        }
        break;
      }

      case 'PAYMENT_RECEIVED': {
        // Notify student when payment is received/verified
        if (payload.studentId) {
          const student = await prisma.student.findUnique({
            where: { id: payload.studentId },
            include: { user: true, guardians: true },
          });

          if (student) {
            const primaryGuardian = student.guardians[0];
            recipients.push({
              userId: student.userId,
              title: `Payment Received: ₹${payload.amount}`,
              message: `Payment of ₹${payload.amount} has been received successfully. Receipt: ${payload.receiptNumber || 'N/A'}.`,
              guardianPhone: primaryGuardian?.phone || undefined,
              templateCode: 'payment_confirmation',
              templateVariables: {
                parent_name: primaryGuardian?.fullName || 'Parent',
                student_name: `${student.user.firstName} ${student.user.lastName}`,
                amount: String(payload.amount),
                receipt_number: payload.receiptNumber || 'N/A',
              },
            });
          }
        }
        break;
      }

      case 'VISITOR_ENTERED': {
        // Notify the person being visited when a visitor arrives
        if (payload.targetUserId) {
          recipients.push({
            userId: payload.targetUserId,
            title: `Visitor Arrived: ${payload.visitorName}`,
            message: `${payload.visitorName} has arrived at the campus gate to meet you. Pass: ${payload.passNumber || 'N/A'}.`,
          });
        }
        break;
      }

      default: {
        if (payload.targetUserId) {
          recipients.push({
            userId: payload.targetUserId,
            title: payload.title || 'Notification',
            message: payload.message || '',
          });
        }
      }
    }

    return recipients;
  }

  /**
   * 3. In-App User Notifications Feed
   */
  static async getUserNotifications(userId: string, params?: { unreadOnly?: boolean; limit?: number }) {
    const where: any = { userId };
    if (params?.unreadOnly) where.isRead = false;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params?.limit || 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { notifications, unreadCount };
  }

  static async markAsRead(userId: string, notificationId: string) {
    const notif = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notif) {
      throw new AppError('Notification not found.', 404);
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { success: true };
  }

  static async deleteNotification(userId: string, notificationId: string) {
    const notif = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notif) {
      throw new AppError('Notification not found.', 404);
    }

    await prisma.notification.delete({ where: { id: notificationId } });
    return { success: true };
  }
}
