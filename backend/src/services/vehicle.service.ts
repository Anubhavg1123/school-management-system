import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export interface CreateVehiclePayload {
  registrationNumber: string;
  vehicleType: string; // BUS, VAN, CAR, TWO_WHEELER, TRUCK, AMBULANCE, OTHER
  makeModel?: string;
  color?: string;
  fuelType?: string;
  capacity?: number;
  ownerType?: string;
  insuranceNumber?: string;
  insuranceExpiry?: string;
  registrationExpiry?: string;
  fitnessExpiry?: string;
  permitExpiry?: string;
}

export interface AssignVehiclePayload {
  vehicleId: string;
  driverId: string; // NonFacultyStaff ID
  assignedByUserId: string;
  notes?: string;
}

export interface RecordKmPayload {
  vehicleId: string;
  date: string; // YYYY-MM-DD
  startingKm: number;
  endingKm: number;
  purpose?: string;
  route?: string;
  remarks?: string;
}

export interface RecordFuelPayload {
  vehicleId: string;
  date: string; // YYYY-MM-DD
  fuelType: string;
  quantity: number;
  pricePerUnit: number;
  odometerReading: number;
  fuelStation?: string;
  receiptNumber?: string;
  remarks?: string;
}

export interface MaintenancePayload {
  vehicleId: string;
  date: string;
  problem: string;
  workPerformed?: string;
  garageVendor?: string;
  estimatedCost?: number;
  actualCost?: number;
  odometerReading?: number;
  partsReplaced?: string;
  remarks?: string;
}

export class VehicleService {
  /**
   * 1. Fleet Vehicle Master
   */
  static async getVehicles(params?: { search?: string; type?: string; status?: string }) {
    const where: any = {};
    if (params?.type) where.vehicleType = params.type;
    if (params?.status) where.status = params.status;
    if (params?.search) {
      where.OR = [
        { registrationNumber: { contains: params.search } },
        { makeModel: { contains: params.search } },
      ];
    }

    return prisma.vehicle.findMany({
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

  static async getVehicleById(id: string) {
    const vehicle = await prisma.vehicle.findUnique({
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
      throw new AppError('Vehicle not found.', 404);
    }

    return vehicle;
  }

  static async createVehicle(payload: CreateVehiclePayload) {
    const regNo = payload.registrationNumber.trim().toUpperCase();

    const existing = await prisma.vehicle.findUnique({
      where: { registrationNumber: regNo },
    });

    if (existing) {
      throw new AppError(`Vehicle with registration number '${regNo}' already exists.`, 409);
    }

    return prisma.vehicle.create({
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

  static async updateVehicle(id: string, payload: Partial<CreateVehiclePayload> & { status?: string }) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      throw new AppError('Vehicle not found.', 404);
    }

    return prisma.vehicle.update({
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
  static async assignVehicleToDriver(payload: AssignVehiclePayload) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: payload.vehicleId } });
    if (!vehicle) {
      throw new AppError('Vehicle not found.', 404);
    }

    const driver = await prisma.nonFacultyStaff.findUnique({
      where: { id: payload.driverId },
      include: { user: true },
    });

    if (!driver) {
      throw new AppError('Driver staff profile not found.', 404);
    }

    // Mark active assignments for this vehicle as PAST
    await prisma.vehicleAssignmentHistory.updateMany({
      where: { vehicleId: vehicle.id, status: 'ACTIVE' },
      data: { status: 'PAST', endDate: new Date() },
    });

    // Create new assignment record
    const assignment = await prisma.vehicleAssignmentHistory.create({
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
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { assignedDriverId: driver.id },
    });

    // Audit log
    await prisma.auditLog.create({
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
  static async recordKmLog(userId: string, payload: RecordKmPayload) {
    if (payload.endingKm < payload.startingKm) {
      throw new AppError(`Ending KM (${payload.endingKm}) cannot be lower than Starting KM (${payload.startingKm}).`, 400);
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: payload.vehicleId } });
    if (!vehicle) {
      throw new AppError('Vehicle not found.', 404);
    }

    // Resolve driver profile for user
    const driverProfile = await prisma.nonFacultyStaff.findUnique({ where: { userId } });
    if (!driverProfile) {
      throw new AppError('Only non-faculty driver profiles can submit daily KM logs.', 403);
    }

    // Previous odometer integrity check
    const lastKmLog = await prisma.vehicleKmLog.findFirst({
      where: { vehicleId: vehicle.id },
      orderBy: { createdAt: 'desc' },
    });

    if (lastKmLog && payload.startingKm < lastKmLog.endingKm) {
      throw new AppError(
        `Invalid starting KM (${payload.startingKm}): Starting KM cannot be less than the previous recorded ending KM (${lastKmLog.endingKm}).`,
        400
      );
    }

    const totalKm = payload.endingKm - payload.startingKm;

    const kmLog = await prisma.vehicleKmLog.create({
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
    await prisma.auditLog.create({
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
  static async recordFuel(userId: string, payload: RecordFuelPayload) {
    if (payload.quantity <= 0) {
      throw new AppError('Fuel quantity must be greater than zero.', 400);
    }
    if (payload.pricePerUnit < 0) {
      throw new AppError('Price per unit cannot be negative.', 400);
    }
    if (payload.odometerReading < 0) {
      throw new AppError('Odometer reading cannot be negative.', 400);
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: payload.vehicleId } });
    if (!vehicle) {
      throw new AppError('Vehicle not found.', 404);
    }

    const driverProfile = await prisma.nonFacultyStaff.findUnique({ where: { userId } });
    if (!driverProfile) {
      throw new AppError('Only authorized staff profiles can submit fuel records.', 403);
    }

    // Backend recalculation of total cost
    const totalCost = Number((payload.quantity * payload.pricePerUnit).toFixed(2));

    const fuelRecord = await prisma.fuelRecord.create({
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
  static async createMaintenanceRecord(userId: string, payload: MaintenancePayload) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: payload.vehicleId } });
    if (!vehicle) {
      throw new AppError('Vehicle not found.', 404);
    }

    const driverProfile = await prisma.nonFacultyStaff.findUnique({ where: { userId } });

    const maintenance = await prisma.vehicleMaintenance.create({
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
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { status: 'UNDER_MAINTENANCE' },
    });

    return maintenance;
  }

  static async updateMaintenanceStatus(id: string, userId: string, status: string, payload?: { actualCost?: number; workPerformed?: string; remarks?: string }) {
    const record = await prisma.vehicleMaintenance.findUnique({ where: { id } });
    if (!record) {
      throw new AppError('Maintenance record not found.', 404);
    }

    const updated = await prisma.vehicleMaintenance.update({
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
      await prisma.vehicle.update({
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
    const totalVehicles = await prisma.vehicle.count();
    const activeVehicles = await prisma.vehicle.count({ where: { status: 'ACTIVE' } });
    const underMaintenance = await prisma.vehicle.count({ where: { status: 'UNDER_MAINTENANCE' } });

    const kmAgg = await prisma.vehicleKmLog.aggregate({
      _sum: { totalKm: true },
    });

    const fuelAgg = await prisma.fuelRecord.aggregate({
      _sum: { quantity: true, totalCost: true },
    });

    const maintenanceAgg = await prisma.vehicleMaintenance.aggregate({
      _sum: { actualCost: true },
    });

    // Document Expiries in next 30 days
    const next30Days = new Date();
    next30Days.setDate(next30Days.getDate() + 30);

    const expiringVehicles = await prisma.vehicle.findMany({
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
