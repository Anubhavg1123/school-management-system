import { Response } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { VisitorSecurityService } from '../services/visitor-security.service';
import { z } from 'zod';

const createVisitorEntrySchema = z.object({
  fullName: z.string().min(2, 'Visitor full name required'),
  contactNumber: z.string().min(5, 'Contact number required'),
  visitorType: z.string().optional(),
  studentRelationship: z.string().optional(),
  studentId: z.string().optional(),
  address: z.string().optional(),
  idProofType: z.string().optional(),
  idProofNumber: z.string().optional(),
  personToMeetName: z.string().min(2, 'Person to meet required'),
  personToMeetUserId: z.string().optional(),
  purpose: z.string().min(2, 'Purpose of visit required'),
  vehicleNumber: z.string().optional(),
  vehicleType: z.string().optional(),
  isEmergency: z.boolean().optional(),
  emergencyReason: z.string().optional(),
  remarks: z.string().optional(),
});

const campusVehicleEntrySchema = z.object({
  vehicleNumber: z.string().min(3, 'Vehicle number required'),
  driverOwnerName: z.string().optional(),
  vehicleType: z.string().optional(),
  purpose: z.string().optional(),
});

export class VisitorSecurityController {
  static async createVisitorEntry(req: AuthRequest, res: Response) {
    const validated = createVisitorEntrySchema.parse(req.body);
    const entry = await VisitorSecurityService.createVisitorEntry(req.user!.id, {
      ...validated,
      visitorType: validated.visitorType || 'GUEST',
    });
    return sendSuccess(res, entry, 201);
  }

  static async markVisitorExit(req: AuthRequest, res: Response) {
    const remarks = typeof req.body.remarks === 'string' ? req.body.remarks : undefined;
    const exitRecord = await VisitorSecurityService.markVisitorExit(
      req.user!.id,
      req.params.passNumberOrId as string,
      remarks
    );
    return sendSuccess(res, exitRecord, 200);
  }

  static async getActiveVisitors(req: AuthRequest, res: Response) {
    const thresholdHours = req.query.thresholdHours ? Number(req.query.thresholdHours) : 4;
    const activeVisitors = await VisitorSecurityService.getActiveVisitors(thresholdHours);
    return sendSuccess(res, activeVisitors, 200);
  }

  static async searchStudentForVisitor(req: AuthRequest, res: Response) {
    const query = typeof req.query.query === 'string' ? req.query.query : '';
    const students = await VisitorSecurityService.searchStudentForVisitor(query);
    return sendSuccess(res, students, 200);
  }

  static async verifyRegisteredVehicle(req: AuthRequest, res: Response) {
    const vehicleNumber = req.params.vehicleNumber as string;
    const verification = await VisitorSecurityService.verifyRegisteredVehicle(vehicleNumber);
    return sendSuccess(res, verification, 200);
  }

  static async recordCampusVehicleEntry(req: AuthRequest, res: Response) {
    const validated = campusVehicleEntrySchema.parse(req.body);
    const log = await VisitorSecurityService.recordCampusVehicleEntry(req.user!.id, validated);
    return sendSuccess(res, log, 201);
  }

  static async recordCampusVehicleExit(req: AuthRequest, res: Response) {
    const log = await VisitorSecurityService.recordCampusVehicleExit(
      req.user!.id,
      req.params.vehicleLogId as string
    );
    return sendSuccess(res, log, 200);
  }

  static async getVisitorPass(req: AuthRequest, res: Response) {
    const pass = await VisitorSecurityService.getVisitorPass(req.params.passTokenOrNumber as string);
    return sendSuccess(res, pass, 200);
  }

  static async searchVisitors(req: AuthRequest, res: Response) {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;

    const history = await VisitorSecurityService.searchVisitors({ search, type, date });
    return sendSuccess(res, history, 200);
  }
}
