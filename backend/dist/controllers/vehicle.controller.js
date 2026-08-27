"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleController = void 0;
const response_1 = require("../utils/response");
const vehicle_service_1 = require("../services/vehicle.service");
const zod_1 = require("zod");
const createVehicleSchema = zod_1.z.object({
    registrationNumber: zod_1.z.string().min(3, 'Registration number required'),
    vehicleType: zod_1.z.string().min(1, 'Vehicle type required'),
    makeModel: zod_1.z.string().optional(),
    color: zod_1.z.string().optional(),
    fuelType: zod_1.z.string().optional(),
    capacity: zod_1.z.number().optional(),
    ownerType: zod_1.z.string().optional(),
    insuranceNumber: zod_1.z.string().optional(),
    insuranceExpiry: zod_1.z.string().optional(),
    registrationExpiry: zod_1.z.string().optional(),
    fitnessExpiry: zod_1.z.string().optional(),
    permitExpiry: zod_1.z.string().optional(),
});
const assignDriverSchema = zod_1.z.object({
    driverId: zod_1.z.string().min(1, 'Driver ID required'),
    notes: zod_1.z.string().optional(),
});
const recordKmSchema = zod_1.z.object({
    vehicleId: zod_1.z.string().min(1, 'Vehicle ID required'),
    date: zod_1.z.string().min(10, 'Date required (YYYY-MM-DD)'),
    startingKm: zod_1.z.number().min(0, 'Starting KM cannot be negative'),
    endingKm: zod_1.z.number().min(0, 'Ending KM cannot be negative'),
    purpose: zod_1.z.string().optional(),
    route: zod_1.z.string().optional(),
    remarks: zod_1.z.string().optional(),
});
const recordFuelSchema = zod_1.z.object({
    vehicleId: zod_1.z.string().min(1, 'Vehicle ID required'),
    date: zod_1.z.string().min(10, 'Date required (YYYY-MM-DD)'),
    fuelType: zod_1.z.string().min(1, 'Fuel type required'),
    quantity: zod_1.z.number().positive('Quantity must be greater than 0'),
    pricePerUnit: zod_1.z.number().min(0, 'Price per unit cannot be negative'),
    odometerReading: zod_1.z.number().min(0, 'Odometer reading cannot be negative'),
    fuelStation: zod_1.z.string().optional(),
    receiptNumber: zod_1.z.string().optional(),
    remarks: zod_1.z.string().optional(),
});
const maintenanceSchema = zod_1.z.object({
    vehicleId: zod_1.z.string().min(1, 'Vehicle ID required'),
    date: zod_1.z.string().min(10, 'Date required (YYYY-MM-DD)'),
    problem: zod_1.z.string().min(2, 'Problem description required'),
    workPerformed: zod_1.z.string().optional(),
    garageVendor: zod_1.z.string().optional(),
    estimatedCost: zod_1.z.number().optional(),
    actualCost: zod_1.z.number().optional(),
    odometerReading: zod_1.z.number().optional(),
    partsReplaced: zod_1.z.string().optional(),
    remarks: zod_1.z.string().optional(),
});
const updateMaintenanceSchema = zod_1.z.object({
    status: zod_1.z.enum(['REPORTED', 'UNDER_INSPECTION', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    actualCost: zod_1.z.number().optional(),
    workPerformed: zod_1.z.string().optional(),
    remarks: zod_1.z.string().optional(),
});
class VehicleController {
    static async getVehicles(req, res) {
        const search = typeof req.query.search === 'string' ? req.query.search : undefined;
        const type = typeof req.query.type === 'string' ? req.query.type : undefined;
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;
        const vehicles = await vehicle_service_1.VehicleService.getVehicles({ search, type, status });
        return (0, response_1.sendSuccess)(res, vehicles, 200);
    }
    static async getVehicleById(req, res) {
        const vehicle = await vehicle_service_1.VehicleService.getVehicleById(req.params.id);
        return (0, response_1.sendSuccess)(res, vehicle, 200);
    }
    static async createVehicle(req, res) {
        const validated = createVehicleSchema.parse(req.body);
        const vehicle = await vehicle_service_1.VehicleService.createVehicle(validated);
        return (0, response_1.sendSuccess)(res, vehicle, 201);
    }
    static async updateVehicle(req, res) {
        const vehicle = await vehicle_service_1.VehicleService.updateVehicle(req.params.id, req.body);
        return (0, response_1.sendSuccess)(res, vehicle, 200);
    }
    static async assignVehicleToDriver(req, res) {
        const validated = assignDriverSchema.parse(req.body);
        const assignment = await vehicle_service_1.VehicleService.assignVehicleToDriver({
            vehicleId: req.params.id,
            driverId: validated.driverId,
            assignedByUserId: req.user.id,
            notes: validated.notes,
        });
        return (0, response_1.sendSuccess)(res, assignment, 201);
    }
    static async recordKmLog(req, res) {
        const validated = recordKmSchema.parse(req.body);
        const kmLog = await vehicle_service_1.VehicleService.recordKmLog(req.user.id, validated);
        return (0, response_1.sendSuccess)(res, kmLog, 201);
    }
    static async recordFuel(req, res) {
        const validated = recordFuelSchema.parse(req.body);
        const fuelRecord = await vehicle_service_1.VehicleService.recordFuel(req.user.id, validated);
        return (0, response_1.sendSuccess)(res, fuelRecord, 201);
    }
    static async createMaintenanceRecord(req, res) {
        const validated = maintenanceSchema.parse(req.body);
        const record = await vehicle_service_1.VehicleService.createMaintenanceRecord(req.user.id, validated);
        return (0, response_1.sendSuccess)(res, record, 201);
    }
    static async updateMaintenanceStatus(req, res) {
        const validated = updateMaintenanceSchema.parse(req.body);
        const record = await vehicle_service_1.VehicleService.updateMaintenanceStatus(req.params.id, req.user.id, validated.status, validated);
        return (0, response_1.sendSuccess)(res, record, 200);
    }
    static async getFleetReports(req, res) {
        const report = await vehicle_service_1.VehicleService.getFleetReports();
        return (0, response_1.sendSuccess)(res, report, 200);
    }
}
exports.VehicleController = VehicleController;
