import { Request, Response, NextFunction } from 'express';
import { calendarEventService } from '../services/calendar-event.service';
import { sendSuccess } from '../utils/response';

export class CalendarEventController {
  async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const result = await calendarEventService.createEvent({
        ...req.body,
        organizerUserId: user?.id,
      });
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const result = await calendarEventService.getEvents({
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        category: req.query.category as string,
        isHoliday: req.query.isHoliday === 'true' ? true : req.query.isHoliday === 'false' ? false : undefined,
        role: user?.activeRole,
        departmentId: req.query.departmentId as string,
      });
      return sendSuccess(res, { events: result });
    } catch (err) {
      next(err);
    }
  }

  async checkHoliday(req: Request, res: Response, next: NextFunction) {
    try {
      const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const result = await calendarEventService.isDateHoliday(dateStr);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async registerForEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
      const result = await calendarEventService.registerForEvent(
        eventId,
        user?.id,
        req.body.studentId
      );
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async recordAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const registrationId = Array.isArray(req.params.registrationId) ? req.params.registrationId[0] : req.params.registrationId;
      const result = await calendarEventService.recordAttendance(
        registrationId,
        req.body.attended !== false
      );
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const calendarEventController = new CalendarEventController();
