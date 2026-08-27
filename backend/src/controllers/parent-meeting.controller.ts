import { Request, Response, NextFunction } from 'express';
import { parentMeetingService } from '../services/parent-meeting.service';
import { sendSuccess } from '../utils/response';
import { prisma } from '../prisma';

export class ParentMeetingController {
  async createSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      let facultyId = req.body.facultyId;

      if (!facultyId) {
        const facultyRecord = await prisma.faculty.findUnique({
          where: { userId: user.id },
        });
        if (facultyRecord) {
          facultyId = facultyRecord.id;
        }
      }

      const result = await parentMeetingService.createSlots({
        facultyId,
        date: req.body.date,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        durationMinutes: req.body.durationMinutes,
        maxBookingsPerSlot: req.body.maxBookingsPerSlot,
      });

      return sendSuccess(res, { slots: result }, 201);
    } catch (err) {
      next(err);
    }
  }

  async getSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await parentMeetingService.getSlots({
        facultyId: req.query.facultyId as string,
        date: req.query.date as string,
        status: req.query.status as string,
      });
      return sendSuccess(res, { slots: result });
    } catch (err) {
      next(err);
    }
  }

  async bookSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const slotId = Array.isArray(req.params.slotId) ? req.params.slotId[0] : req.params.slotId;
      const result = await parentMeetingService.bookSlot({
        slotId,
        guardianUserId: user.id,
        studentId: req.body.studentId,
      });
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async recordMeetingNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const bookingId = Array.isArray(req.params.bookingId) ? req.params.bookingId[0] : req.params.bookingId;
      const result = await parentMeetingService.recordMeetingNotes(
        bookingId,
        {
          meetingNotes: req.body.meetingNotes,
          sensitiveRemarks: req.body.sensitiveRemarks,
          status: req.body.status,
        }
      );
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const parentMeetingController = new ParentMeetingController();
