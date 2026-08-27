import { Response } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { VehicleService } from '../services/vehicle.service';
import { z } from 'zod';

const createVehicleSchema = z.object({
  registrationNumber: z.string().min(3, 'Registration number required'),
  vehicleType: z.string().min(1, 'Vehicle type required'),
  makeModel: z.string().optional(),
  color: z.string().optional(),
  fuelType: z.string().optional(),
  capacity: z.number().optional(),
  ownerType: z.string().optional(),
  insuranceNumber: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  registrationExpiry: z.string().optional(),
  fitnessExpiry: z.string().optional(),
  permitExpiry: z.string().optional(),
});

const assignDriverSchema = z.object({
  driverId: z.string().min(1, 'Driver ID required'),
  notes: z.string().optional(),
});

const recordKmSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID required'),
  date: z.string().min(10, 'Date required (YYYY-MM-DD)'),
  startingKm: z.number().min(0, 'Starting KM cannot be negative'),
  endingKm: z.number().min(0, 'Ending KM cannot be negative'),
  purpose: z.string().optional(),
  route: z.string().optional(),
  remarks: z.string().optional(),
});

const recordFuelSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID required'),
  date: z.string().min(10, 'Date required (YYYY-MM-DD)'),
  fuelType: z.string().min(1, 'Fuel type required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  pricePerUnit: z.number().min(0, 'Price per unit cannot be negative'),
  odometerReading: z.number().min(0, 'Odometer reading cannot be negative'),
  fuelStation: z.string().optional(),
  receiptNumber: z.string().optional(),
  remarks: z.string().optional(),
});

const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID required'),
  date: z.string().min(10, 'Date required (YYYY-MM-DD)'),
  problem: z.string().min(2, 'Problem description required'),
  workPerformed: z.string().optional(),
  garageVendor: z.string().optional(),
  estimatedCost: z.number().optional(),
  actualCost: z.number().optional(),
  odometerReading: z.number().optional(),
  partsReplaced: z.string().optional(),
  remarks: z.string().optional(),
});

const updateMaintenanceSchema = z.object({
  status: z.enum(['REPORTED', 'UNDER_INSPECTION', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  actualCost: z.number().optional(),
  workPerformed: z.string().optional(),
  remarks: z.string().optional(),
});

export class VehicleController {
  static async getVehicles(req: AuthRequest, res: Response) {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;

    const vehicles = await VehicleService.getVehicles({ search, type, status });
    return sendSuccess(res, vehicles, 200);
  }

  static async getVehicleById(req: AuthRequest, res: Response) {
    const vehicle = await VehicleService.getVehicleById(req.params.id as string);
    return sendSuccess(res, vehicle, 200);
  }

  static async createVehicle(req: AuthRequest, res: Response) {
    const validated = createVehicleSchema.parse(req.body);
    const vehicle = await VehicleService.createVehicle(validated);
    return sendSuccess(res, vehicle, 201);
  }

  static async updateVehicle(req: AuthRequest, res: Response) {
    const vehicle = await VehicleService.updateVehicle(req.params.id as string, req.body);
    return sendSuccess(res, vehicle, 200);
  }

  static async assignVehicleToDriver(req: AuthRequest, res: Response) {
    const validated = assignDriverSchema.parse(req.body);
    const assignment = await VehicleService.assignVehicleToDriver({
      vehicleId: req.params.id as string,
      driverId: validated.driverId,
      assignedByUserId: req.user!.id,
      notes: validated.notes,
    });
    return sendSuccess(res, assignment, 201);
  }

  static async recordKmLog(req: AuthRequest, res: Response) {
    const validated = recordKmSchema.parse(req.body);
    const kmLog = await VehicleService.recordKmLog(req.user!.id, validated);
    return sendSuccess(res, kmLog, 201);
  }

  static async recordFuel(req: AuthRequest, res: Response) {
    const validated = recordFuelSchema.parse(req.body);
    const fuelRecord = await VehicleService.recordFuel(req.user!.id, validated);
    return sendSuccess(res, fuelRecord, 201);
  }

  static async createMaintenanceRecord(req: AuthRequest, res: Response) {
    const validated = maintenanceSchema.parse(req.body);
    const record = await VehicleService.createMaintenanceRecord(req.user!.id, validated);
    return sendSuccess(res, record, 201);
  }

  static async updateMaintenanceStatus(req: AuthRequest, res: Response) {
    const validated = updateMaintenanceSchema.parse(req.body);
    const record = await VehicleService.updateMaintenanceStatus(
      req.params.id as string,
      req.user!.id,
      validated.status,
      validated
    );
    return sendSuccess(res, record, 200);
  }

  static async getFleetReports(req: AuthRequest, res: Response) {
    const report = await VehicleService.getFleetReports();
    return sendSuccess(res, report, 200);
  }
}
