import { Response } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { NonFacultyService } from '../services/non-faculty.service';
import { z } from 'zod';

const markAttenderAttendanceSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID is required'),
  action: z.enum(['CHECK_IN', 'CHECK_OUT']),
  remarks: z.string().optional(),
});

const createStaffCategorySchema = z.object({
  code: z.string().min(2, 'Category code required'),
  name: z.string().min(2, 'Category name required'),
  description: z.string().optional(),
});

export class NonFacultyController {
  static async getDashboard(req: AuthRequest, res: Response) {
    const data = await NonFacultyService.getDashboard(req.user!.id);
    return sendSuccess(res, data, 200);
  }

  static async getStaffCategories(req: AuthRequest, res: Response) {
    const categories = await NonFacultyService.getStaffCategories();
    return sendSuccess(res, categories, 200);
  }

  static async createStaffCategory(req: AuthRequest, res: Response) {
    const validated = createStaffCategorySchema.parse(req.body);
    const category = await NonFacultyService.createStaffCategory(validated);
    return sendSuccess(res, category, 201);
  }

  static async attenderMarkAttendance(req: AuthRequest, res: Response) {
    const validated = markAttenderAttendanceSchema.parse(req.body);
    const record = await NonFacultyService.attenderMarkAttendance(req.user!.id, validated);
    return sendSuccess(res, record, 201);
  }

  static async getAttenderDashboard(req: AuthRequest, res: Response) {
    const data = await NonFacultyService.getAttenderDashboard(req.user!.id);
    return sendSuccess(res, data, 200);
  }
}
