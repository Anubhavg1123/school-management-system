import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';
import { RealtimeService } from './realtime.service';
import { NotificationService } from './notification.service';

export interface CreateEmergencyAlertPayload {
  title: string;
  message: string;
  priority?: 'NORMAL' | 'HIGH' | 'EMERGENCY';
  targetAudience?: 'ALL' | 'FACULTY' | 'STUDENTS' | 'PARENTS' | 'STAFF';
  channels?: string[]; // ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH']
}

export class EmergencyService {
  /**
   * 1. Create and Dispatch Emergency Alert
   */
  static async createEmergencyAlert(createdById: string, payload: CreateEmergencyAlertPayload) {
    if (!payload.title || !payload.message) {
      throw new AppError('Title and message are required for emergency alerts.', 400, 'VALIDATION_ERROR');
    }

    const priority = payload.priority || 'EMERGENCY';
    const targetAudience = payload.targetAudience || 'ALL';
    const channels = (payload.channels && payload.channels.length > 0) ? payload.channels.join(',') : 'IN_APP';

    const alert = await prisma.emergencyAlert.create({
      data: {
        title: payload.title,
        message: payload.message,
        priority,
        targetAudience,
        channels,
        status: 'SENT',
        createdById,
        sentAt: new Date(),
      },
      include: {
        createdBy: { select: { firstName: true, lastName: true, email: true, activeRole: true } },
      },
    });

    // 1. Broadcast over Realtime SSE channel immediately
    RealtimeService.broadcast('EMERGENCY_ALERT', {
      id: alert.id,
      title: alert.title,
      message: alert.message,
      priority: alert.priority,
      targetAudience: alert.targetAudience,
      sentAt: alert.sentAt,
      creator: `${alert.createdBy.firstName} ${alert.createdBy.lastName}`,
    });

    // 2. Dispatch in-app notifications to target audience users
    let targetUsersQuery: any = { status: 'ACTIVE' };
    if (targetAudience === 'FACULTY') targetUsersQuery.activeRole = 'FACULTY';
    else if (targetAudience === 'STUDENTS') targetUsersQuery.activeRole = 'STUDENT';
    else if (targetAudience === 'PARENTS') targetUsersQuery.activeRole = 'PARENT';
    else if (targetAudience === 'STAFF') targetUsersQuery.activeRole = 'NON_FACULTY';

    const recipients = await prisma.user.findMany({
      where: targetUsersQuery,
      select: { id: true },
      take: 500,
    });

    for (const r of recipients) {
      await prisma.notification.create({
        data: {
          userId: r.id,
          title: `🚨 EMERGENCY ALERT: ${alert.title}`,
          message: alert.message,
          type: 'EMERGENCY',
          isRead: false,
        },
      }).catch(() => {});
    }

    // Update delivery stats on alert
    await prisma.emergencyAlert.update({
      where: { id: alert.id },
      data: {
        deliveryStats: JSON.stringify({ inAppRecipients: recipients.length, channels: payload.channels || ['IN_APP'] }),
      },
    });

    return alert;
  }

  /**
   * 2. List Emergency Alerts
   */
  static async getEmergencyAlerts(filters?: { status?: string; priority?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;

    return prisma.emergencyAlert.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      include: {
        createdBy: { select: { firstName: true, lastName: true, email: true, activeRole: true } },
      },
      take: 50,
    });
  }

  /**
   * 3. Cancel an Active Emergency Alert
   */
  static async cancelEmergencyAlert(alertId: string, cancelledById: string, cancellationNote?: string) {
    const alert = await prisma.emergencyAlert.findUnique({ where: { id: alertId } });
    if (!alert) {
      throw new AppError('Emergency alert not found.', 404, 'NOT_FOUND');
    }

    const updated = await prisma.emergencyAlert.update({
      where: { id: alertId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationNote: cancellationNote || 'Cancelled by authorized administrator.',
      },
    });

    // Broadcast cancellation
    RealtimeService.broadcast('EMERGENCY_ALERT_CANCELLED', {
      id: updated.id,
      title: updated.title,
      cancelledAt: updated.cancelledAt,
    });

    return updated;
  }

  /**
   * 4. Update Live Campus Status (NORMAL, WARNING, EMERGENCY)
   */
  static async updateCampusStatus(updatedById: string, status: 'NORMAL' | 'WARNING' | 'EMERGENCY', reason?: string) {
    const log = await prisma.campusStatusLog.create({
      data: {
        status,
        reason: reason || `Campus status updated to ${status}.`,
        updatedById,
      },
      include: {
        updatedBy: { select: { firstName: true, lastName: true, activeRole: true } },
      },
    });

    RealtimeService.broadcast('CAMPUS_STATUS_CHANGED', {
      status: log.status,
      reason: log.reason,
      updatedBy: `${log.updatedBy.firstName} ${log.updatedBy.lastName}`,
      updatedAt: log.createdAt,
    });

    return log;
  }

  /**
   * 5. Get Current Campus Status
   */
  static async getCampusStatus() {
    const latest = await prisma.campusStatusLog.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        updatedBy: { select: { firstName: true, lastName: true, activeRole: true } },
      },
    });

    return {
      currentStatus: latest?.status || 'NORMAL',
      lastReason: latest?.reason || 'Campus operations normal.',
      updatedBy: latest?.updatedBy ? `${latest.updatedBy.firstName} ${latest.updatedBy.lastName}` : 'System',
      updatedAt: latest?.createdAt ? latest.createdAt.toISOString() : new Date().toISOString(),
    };
  }
}
