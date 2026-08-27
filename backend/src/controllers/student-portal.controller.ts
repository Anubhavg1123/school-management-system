import { Request, Response, NextFunction } from 'express';
import { StudentPortalService } from '../services/student-portal.service';

export const getStudentDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const data = await StudentPortalService.getDashboard(userId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getStudentTimetable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const studentId = String(req.params.studentId);
    const dayOfWeek = req.query.dayOfWeek ? String(req.query.dayOfWeek) : undefined;
    const data = await StudentPortalService.getTimetable(userId, studentId, dayOfWeek);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getStudentAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const studentId = String(req.params.studentId);
    const data = await StudentPortalService.getAttendance(userId, studentId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createProfileUpdateRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const studentId = String(req.params.studentId);
    const data = await StudentPortalService.createProfileUpdateRequest(userId, studentId, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createLeaveRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const studentId = String(req.params.studentId);
    const data = await StudentPortalService.createLeaveRequest(userId, studentId, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
