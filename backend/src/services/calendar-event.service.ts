import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export class CalendarEventService {
  /**
   * Create an institutional calendar event or holiday
   */
  async createEvent(data: {
    title: string;
    description?: string;
    category: string;
    startDate: string | Date;
    endDate: string | Date;
    isHoliday?: boolean;
    allDay?: boolean;
    targetRoles?: string;
    departmentId?: string;
    classId?: string;
    venue?: string;
    organizerUserId?: string;
    capacity?: number;
  }) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (end < start) {
      throw new AppError('End date cannot be earlier than start date.', 400);
    }

    const event = await prisma.institutionalCalendarEvent.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        startDate: start,
        endDate: end,
        isHoliday: data.isHoliday || false,
        allDay: data.allDay !== undefined ? data.allDay : true,
        targetRoles: data.targetRoles || 'ALL',
        departmentId: data.departmentId,
        classId: data.classId,
        venue: data.venue,
        organizerUserId: data.organizerUserId,
        capacity: data.capacity,
        status: 'SCHEDULED',
      },
    });

    return event;
  }

  /**
   * Query events with role and date filtering
   */
  async getEvents(query: {
    startDate?: string;
    endDate?: string;
    category?: string;
    isHoliday?: boolean;
    role?: string;
    departmentId?: string;
  }) {
    const where: any = {};

    if (query.startDate && query.endDate) {
      where.startDate = { lte: new Date(query.endDate) };
      where.endDate = { gte: new Date(query.startDate) };
    } else if (query.startDate) {
      where.endDate = { gte: new Date(query.startDate) };
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.isHoliday !== undefined) {
      where.isHoliday = query.isHoliday;
    }

    if (query.departmentId) {
      where.OR = [
        { departmentId: null },
        { departmentId: query.departmentId },
      ];
    }

    const events = await prisma.institutionalCalendarEvent.findMany({
      where,
      include: {
        registrations: {
          select: { id: true, userId: true, studentId: true, status: true, attended: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    // Filter by role visibility
    if (query.role && query.role !== 'SUPER_ADMIN') {
      return events.filter((e) => {
        if (e.targetRoles === 'ALL') return true;
        return e.targetRoles.includes(query.role!);
      });
    }

    return events;
  }

  /**
   * Check if a specific date is a configured institutional holiday
   */
  async isDateHoliday(dateString: string): Promise<{ isHoliday: boolean; holidayName?: string }> {
    const targetDate = new Date(dateString);
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const holiday = await prisma.institutionalCalendarEvent.findFirst({
      where: {
        isHoliday: true,
        startDate: { lte: dayEnd },
        endDate: { gte: dayStart },
        status: { not: 'CANCELLED' },
      },
    });

    if (holiday) {
      return { isHoliday: true, holidayName: holiday.title };
    }

    return { isHoliday: false };
  }

  /**
   * Register a user/student for an event with capacity checks
   */
  async registerForEvent(eventId: string, userId?: string, studentId?: string) {
    const event = await prisma.institutionalCalendarEvent.findUnique({
      where: { id: eventId },
      include: { registrations: true },
    });

    if (!event) {
      throw new AppError('Event not found.', 404);
    }

    if (event.status === 'CANCELLED' || event.status === 'COMPLETED') {
      throw new AppError(`Cannot register for event with status '${event.status}'.`, 400);
    }

    // Check duplicate registration
    const existing = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(studentId ? [{ studentId }] : []),
        ],
        status: { not: 'CANCELLED' },
      },
    });

    if (existing) {
      throw new AppError('Already registered for this event.', 400);
    }

    // Check capacity
    const isWaitlist = event.capacity ? event.registeredCount >= event.capacity : false;

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        userId,
        studentId,
        status: isWaitlist ? 'WAITLIST' : 'REGISTERED',
      },
    });

    if (!isWaitlist) {
      await prisma.institutionalCalendarEvent.update({
        where: { id: eventId },
        data: { registeredCount: { increment: 1 } },
      });
    }

    return registration;
  }

  /**
   * Record event attendance
   */
  async recordAttendance(registrationId: string, attended: boolean) {
    const reg = await prisma.eventRegistration.findUnique({ where: { id: registrationId } });
    if (!reg) {
      throw new AppError('Event registration not found.', 404);
    }

    const updated = await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        attended,
        attendedAt: attended ? new Date() : null,
      },
    });

    return updated;
  }
}

export const calendarEventService = new CalendarEventService();
