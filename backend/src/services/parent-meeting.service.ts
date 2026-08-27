import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export class ParentMeetingService {
  /**
   * Faculty generates available PTM time slots
   */
  async createSlots(data: {
    facultyId: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    durationMinutes?: number;
    maxBookingsPerSlot?: number;
  }) {
    const faculty = await prisma.faculty.findUnique({ where: { id: data.facultyId } });
    if (!faculty) {
      throw new AppError('Faculty not found.', 404);
    }

    const duration = data.durationMinutes || 15;
    const maxBookings = data.maxBookingsPerSlot || 1;

    // Parse start and end time (e.g. 14:00 to 16:00)
    const [startH, startM] = data.startTime.split(':').map(Number);
    const [endH, endM] = data.endTime.split(':').map(Number);

    const startTotalMin = startH * 60 + startM;
    const endTotalMin = endH * 60 + endM;

    if (endTotalMin <= startTotalMin) {
      throw new AppError('End time must be later than start time.', 400);
    }

    const slotsToCreate = [];
    let currentMin = startTotalMin;

    while (currentMin + duration <= endTotalMin) {
      const slotStartH = Math.floor(currentMin / 60).toString().padStart(2, '0');
      const slotStartM = (currentMin % 60).toString().padStart(2, '0');
      const slotEndH = Math.floor((currentMin + duration) / 60).toString().padStart(2, '0');
      const slotEndM = ((currentMin + duration) % 60).toString().padStart(2, '0');

      slotsToCreate.push({
        facultyId: data.facultyId,
        date: data.date,
        startTime: `${slotStartH}:${slotStartM}`,
        endTime: `${slotEndH}:${slotEndM}`,
        durationMinutes: duration,
        maxBookings,
        currentBookings: 0,
        status: 'AVAILABLE',
      });

      currentMin += duration;
    }

    const createdSlots = await Promise.all(
      slotsToCreate.map((slot) => prisma.parentTeacherMeetingSlot.create({ data: slot }))
    );

    return createdSlots;
  }

  /**
   * Get PTM slots with filter options
   */
  async getSlots(query: { facultyId?: string; date?: string; status?: string }) {
    const where: any = {};
    if (query.facultyId) where.facultyId = query.facultyId;
    if (query.date) where.date = query.date;
    if (query.status) where.status = query.status;

    return prisma.parentTeacherMeetingSlot.findMany({
      where,
      include: {
        faculty: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            department: { select: { name: true, code: true } },
          },
        },
        bookings: {
          include: {
            student: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true } },
              },
            },
            guardianUser: { select: { id: true, firstName: true, lastName: true, phone: true } },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Guardian books a PTM slot with triple-conflict protection
   */
  async bookSlot(data: {
    slotId: string;
    studentId: string;
    guardianUserId: string;
  }) {
    const slot = await prisma.parentTeacherMeetingSlot.findUnique({
      where: { id: data.slotId },
      include: { bookings: true },
    });

    if (!slot) {
      throw new AppError('PTM slot not found.', 404);
    }

    if (slot.status === 'CANCELLED' || slot.currentBookings >= slot.maxBookings) {
      throw new AppError('This meeting slot is already fully booked or cancelled.', 400);
    }

    // 1. Conflict Check: Duplicate booking for same student on this slot
    const studentAlreadyBooked = slot.bookings.some(
      (b) => b.studentId === data.studentId && b.status === 'CONFIRMED'
    );
    if (studentAlreadyBooked) {
      throw new AppError('A meeting is already booked for this student in this slot.', 400);
    }

    // 2. Conflict Check: Guardian overlapping booking on the same date and time
    const guardianOverlappingBooking = await prisma.parentTeacherMeetingBooking.findFirst({
      where: {
        guardianUserId: data.guardianUserId,
        status: 'CONFIRMED',
        slot: {
          date: slot.date,
          startTime: slot.startTime,
        },
      },
    });

    if (guardianOverlappingBooking) {
      throw new AppError('You already have another meeting booked at this exact time.', 400);
    }

    // Create booking and increment slot counter
    const [booking] = await prisma.$transaction([
      prisma.parentTeacherMeetingBooking.create({
        data: {
          slotId: data.slotId,
          studentId: data.studentId,
          guardianUserId: data.guardianUserId,
          status: 'CONFIRMED',
        },
        include: {
          slot: true,
          student: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      }),
      prisma.parentTeacherMeetingSlot.update({
        where: { id: data.slotId },
        data: {
          currentBookings: { increment: 1 },
          status: slot.currentBookings + 1 >= slot.maxBookings ? 'BOOKED' : 'AVAILABLE',
        },
      }),
    ]);

    return booking;
  }

  /**
   * Faculty records meeting notes and confidential remarks
   */
  async recordMeetingNotes(
    bookingId: string,
    data: { meetingNotes?: string; sensitiveRemarks?: string; status?: string }
  ) {
    const booking = await prisma.parentTeacherMeetingBooking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new AppError('Meeting booking not found.', 404);
    }

    const updated = await prisma.parentTeacherMeetingBooking.update({
      where: { id: bookingId },
      data: {
        meetingNotes: data.meetingNotes,
        sensitiveRemarks: data.sensitiveRemarks,
        status: data.status || 'COMPLETED',
      },
    });

    return updated;
  }
}

export const parentMeetingService = new ParentMeetingService();
