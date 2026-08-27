"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleService = void 0;
const prisma_1 = require("../prisma");
const errorHandler_1 = require("../middleware/errorHandler");
class VehicleService {
    /**
     * 1. Fleet Vehicle Master
     */
    static async getVehicles(params) {
        const where = {};
        if (params?.type)
            where.vehicleType = params.type;
        if (params?.status)
            where.status = params.status;
        if (params?.search) {
            where.OR = [
                { registrationNumber: { contains: params.search } },
                { makeModel: { contains: params.search } },
            ];
        }
        return prisma_1.prisma.vehicle.findMany({
            where,
            include: {
                assignedDriver: {
                    include: {
                        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async getVehicleById(id) {
        const vehicle = await prisma_1.prisma.vehicle.findUnique({
            where: { id },
            include: {
                assignedDriver: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
                    },
                },
                assignments: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        driver: { include: { user: { select: { firstName: true, lastName: true } } } },
                        assignedBy: { select: { firstName: true, lastName: true } },
                    },
                },
                kmLogs: {
                    take: 15,
                    orderBy: { createdAt: 'desc' },
                },
                fuelRecords: {
                    take: 15,
                    orderBy: { createdAt: 'desc' },
                },
                maintenances: {
                    take: 15,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!vehicle) {
            throw new errorHandler_1.AppError('Vehicle not found.', 404);
        }
        return vehicle;
    }
    static async createVehicle(payload) {
        const regNo = payload.registrationNumber.trim().toUpperCase();
        const existing = await prisma_1.prisma.vehicle.findUnique({
            where: { registrationNumber: regNo },
        });
        if (existing) {
            throw new errorHandler_1.AppError(`Vehicle with registration number '${regNo}' already exists.`, 409);
        }
        return prisma_1.prisma.vehicle.create({
            data: {
                registrationNumber: regNo,
                vehicleType: payload.vehicleType,
                makeModel: payload.makeModel,
                color: payload.color,
                fuelType: payload.fuelType || 'DIESEL',
                capacity: payload.capacity || 40,
                ownerType: payload.ownerType || 'INSTITUTION',
                insuranceNumber: payload.insuranceNumber,
                insuranceExpiry: payload.insuranceExpiry ? new Date(payload.insuranceExpiry) : null,
                registrationExpiry: payload.registrationExpiry ? new Date(payload.registrationExpiry) : null,
                fitnessExpiry: payload.fitnessExpiry ? new Date(payload.fitnessExpiry) : null,
                permitExpiry: payload.permitExpiry ? new Date(payload.permitExpiry) : null,
                status: 'ACTIVE',
            },
        });
    }
    static async updateVehicle(id, payload) {
        const vehicle = await prisma_1.prisma.vehicle.findUnique({ where: { id } });
        if (!vehicle) {
            throw new errorHandler_1.AppError('Vehicle not found.', 404);
        }
        return prisma_1.prisma.vehicle.update({
            where: { id },
            data: {
                makeModel: payload.makeModel ?? vehicle.makeModel,
                color: payload.color ?? vehicle.color,
                fuelType: payload.fuelType ?? vehicle.fuelType,
                capacity: payload.capacity ?? vehicle.capacity,
                status: payload.status ?? vehicle.status,
                insuranceNumber: payload.insuranceNumber ?? vehicle.insuranceNumber,
                insuranceExpiry: payload.insuranceExpiry ? new Date(payload.insuranceExpiry) : vehicle.insuranceExpiry,
                registrationExpiry: payload.registrationExpiry ? new Date(payload.registrationExpiry) : vehicle.registrationExpiry,
                fitnessExpiry: payload.fitnessExpiry ? new Date(payload.fitnessExpiry) : vehicle.fitnessExpiry,
                permitExpiry: payload.permitExpiry ? new Date(payload.permitExpiry) : vehicle.permitExpiry,
            },
        });
    }
    /**
     * 2. Driver Vehicle Assignment
     */
    static async assignVehicleToDriver(payload) {
        const vehicle = await prisma_1.prisma.vehicle.findUnique({ where: { id: payload.vehicleId } });
        if (!vehicle) {
            throw new errorHandler_1.AppError('Vehicle not found.', 404);
        }
        const driver = await prisma_1.prisma.nonFacultyStaff.findUnique({
            where: { id: payload.driverId },
            include: { user: true },
        });
        if (!driver) {
            throw new errorHandler_1.AppError('Driver staff profile not found.', 404);
        }
        // Mark active assignments for this vehicle as PAST
        await prisma_1.prisma.vehicleAssignmentHistory.updateMany({
            where: { vehicleId: vehicle.id, status: 'ACTIVE' },
            data: { status: 'PAST', endDate: new Date() },
        });
        // Create new assignment record
        const assignment = await prisma_1.prisma.vehicleAssignmentHistory.create({
            data: {
                vehicleId: vehicle.id,
                driverId: driver.id,
                assignedByUserId: payload.assignedByUserId,
                startDate: new Date(),
                status: 'ACTIVE',
                notes: payload.notes,
            },
        });
        // Update vehicle's current assigned driver
        await prisma_1.prisma.vehicle.update({
            where: { id: vehicle.id },
            data: { assignedDriverId: driver.id },
        });
        // Audit log
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: payload.assignedByUserId,
                action: 'VEHICLE_DRIVER_ASSIGNED',
                entityType: 'Vehicle',
                entityId: vehicle.id,
                afterState: JSON.stringify({ driverId: driver.id }),
            },
        });
        return assignment;
    }
    /**
     * 3. Daily Vehicle KM Logging (With Odometer Integrity)
     */
    static async recordKmLog(userId, payload) {
        if (payload.endingKm < payload.startingKm) {
            throw new errorHandler_1.AppError(`Ending KM (${payload.endingKm}) cannot be lower than Starting KM (${payload.startingKm}).`, 400);
        }
        const vehicle = await prisma_1.prisma.vehicle.findUnique({ where: { id: payload.vehicleId } });
        if (!vehicle) {
            throw new errorHandler_1.AppError('Vehicle not found.', 404);
        }
        // Resolve driver profile for user
        const driverProfile = await prisma_1.prisma.nonFacultyStaff.findUnique({ where: { userId } });
        if (!driverProfile) {
            throw new errorHandler_1.AppError('Only non-faculty driver profiles can submit daily KM logs.', 403);
        }
        // Previous odometer integrity check
        const lastKmLog = await prisma_1.prisma.vehicleKmLog.findFirst({
            where: { vehicleId: vehicle.id },
            orderBy: { createdAt: 'desc' },
        });
        if (lastKmLog && payload.startingKm < lastKmLog.endingKm) {
            throw new errorHandler_1.AppError(`Invalid starting KM (${payload.startingKm}): Starting KM cannot be less than the previous recorded ending KM (${lastKmLog.endingKm}).`, 400);
        }
        const totalKm = payload.endingKm - payload.startingKm;
        const kmLog = await prisma_1.prisma.vehicleKmLog.create({
            data: {
                vehicleId: vehicle.id,
                driverId: driverProfile.id,
                date: payload.date,
                startingKm: payload.startingKm,
                endingKm: payload.endingKm,
                totalKm,
                purpose: payload.purpose || 'Routine institutional transport',
                route: payload.route,
                remarks: payload.remarks,
                createdByUserId: userId,
            },
        });
        // Audit log
        await prisma_1.prisma.auditLog.create({
            data: {
                userId,
                action: 'KM_LOG_RECORDED',
                entityType: 'VehicleKmLog',
                entityId: kmLog.id,
                afterState: JSON.stringify({ totalKm }),
            },
        });
        return kmLog;
    }
    /**
     * 4. Fuel Logging (With Backend Total Cost Recalculation)
     */
    static async recordFuel(userId, payload) {
        if (payload.quantity <= 0) {
            throw new errorHandler_1.AppError('Fuel quantity must be greater than zero.', 400);
        }
        if (payload.pricePerUnit < 0) {
            throw new errorHandler_1.AppError('Price per unit cannot be negative.', 400);
        }
        if (payload.odometerReading < 0) {
            throw new errorHandler_1.AppError('Odometer reading cannot be negative.', 400);
        }
        const vehicle = await prisma_1.prisma.vehicle.findUnique({ where: { id: payload.vehicleId } });
        if (!vehicle) {
            throw new errorHandler_1.AppError('Vehicle not found.', 404);
        }
        const driverProfile = await prisma_1.prisma.nonFacultyStaff.findUnique({ where: { userId } });
        if (!driverProfile) {
            throw new errorHandler_1.AppError('Only authorized staff profiles can submit fuel records.', 403);
        }
        // Backend recalculation of total cost
        const totalCost = Number((payload.quantity * payload.pricePerUnit).toFixed(2));
        const fuelRecord = await prisma_1.prisma.fuelRecord.create({
            data: {
                vehicleId: vehicle.id,
                driverId: driverProfile.id,
                date: payload.date,
                fuelType: payload.fuelType,
                quantity: payload.quantity,
                pricePerUnit: payload.pricePerUnit,
                totalCost,
                odometerReading: payload.odometerReading,
                fuelStation: payload.fuelStation,
                receiptNumber: payload.receiptNumber,
                remarks: payload.remarks,
                enteredByUserId: userId,
            },
        });
        return fuelRecord;
    }
    /**
     * 5. Vehicle Maintenance / Garage Work
     */
    static async createMaintenanceRecord(userId, payload) {
        const vehicle = await prisma_1.prisma.vehicle.findUnique({ where: { id: payload.vehicleId } });
        if (!vehicle) {
            throw new errorHandler_1.AppError('Vehicle not found.', 404);
        }
        const driverProfile = await prisma_1.prisma.nonFacultyStaff.findUnique({ where: { userId } });
        const maintenance = await prisma_1.prisma.vehicleMaintenance.create({
            data: {
                vehicleId: vehicle.id,
                driverId: driverProfile?.id || null,
                date: payload.date,
                problem: payload.problem,
                workPerformed: payload.workPerformed,
                garageVendor: payload.garageVendor,
                estimatedCost: payload.estimatedCost || 0.0,
                actualCost: payload.actualCost || 0.0,
                odometerReading: payload.odometerReading || 0.0,
                partsReplaced: payload.partsReplaced,
                remarks: payload.remarks,
                status: 'REPORTED',
                reportedByUserId: userId,
            },
        });
        // Optionally update vehicle status to UNDER_MAINTENANCE
        await prisma_1.prisma.vehicle.update({
            where: { id: vehicle.id },
            data: { status: 'UNDER_MAINTENANCE' },
        });
        return maintenance;
    }
    static async updateMaintenanceStatus(id, userId, status, payload) {
        const record = await prisma_1.prisma.vehicleMaintenance.findUnique({ where: { id } });
        if (!record) {
            throw new errorHandler_1.AppError('Maintenance record not found.', 404);
        }
        const updated = await prisma_1.prisma.vehicleMaintenance.update({
            where: { id },
            data: {
                status,
                actualCost: payload?.actualCost ?? record.actualCost,
                workPerformed: payload?.workPerformed ?? record.workPerformed,
                remarks: payload?.remarks ? `${record.remarks || ''} | ${payload.remarks}` : record.remarks,
                updatedByUserId: userId,
            },
        });
        // If maintenance completed, restore vehicle status to ACTIVE
        if (status === 'COMPLETED') {
            await prisma_1.prisma.vehicle.update({
                where: { id: record.vehicleId },
                data: { status: 'ACTIVE' },
            });
        }
        return updated;
    }
    /**
     * 6. Fleet Analytics & Reports
     */
    static async getFleetReports() {
        const totalVehicles = await prisma_1.prisma.vehicle.count();
        const activeVehicles = await prisma_1.prisma.vehicle.count({ where: { status: 'ACTIVE' } });
        const underMaintenance = await prisma_1.prisma.vehicle.count({ where: { status: 'UNDER_MAINTENANCE' } });
        const kmAgg = await prisma_1.prisma.vehicleKmLog.aggregate({
            _sum: { totalKm: true },
        });
        const fuelAgg = await prisma_1.prisma.fuelRecord.aggregate({
            _sum: { quantity: true, totalCost: true },
        });
        const maintenanceAgg = await prisma_1.prisma.vehicleMaintenance.aggregate({
            _sum: { actualCost: true },
        });
        // Document Expiries in next 30 days
        const next30Days = new Date();
        next30Days.setDate(next30Days.getDate() + 30);
        const expiringVehicles = await prisma_1.prisma.vehicle.findMany({
            where: {
                OR: [
                    { insuranceExpiry: { lte: next30Days } },
                    { registrationExpiry: { lte: next30Days } },
                    { fitnessExpiry: { lte: next30Days } },
                    { permitExpiry: { lte: next30Days } },
                ],
            },
            select: {
                id: true,
                registrationNumber: true,
                vehicleType: true,
                insuranceExpiry: true,
                registrationExpiry: true,
                fitnessExpiry: true,
                permitExpiry: true,
            },
        });
        return {
            summary: {
                totalVehicles,
                activeVehicles,
                underMaintenance,
                totalKmLogged: kmAgg._sum.totalKm || 0,
                totalFuelQuantity: fuelAgg._sum.quantity || 0,
                totalFuelCost: fuelAgg._sum.totalCost || 0,
                totalMaintenanceCost: maintenanceAgg._sum.actualCost || 0,
            },
            expiringDocumentsCount: expiringVehicles.length,
            expiringVehicles,
        };
    }
}
exports.VehicleService = VehicleService;
