"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartCampusService = void 0;
const prisma_1 = require("../prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const realtime_service_1 = require("./realtime.service");
class SmartCampusService {
    /**
     * 1. Staff Pre-Registers an Expected Visitor
     */
    static async preRegisterVisitor(hostUserId, payload) {
        if (!payload.visitorFullName || !payload.contactNumber || !payload.expectedDate) {
            throw new errorHandler_1.AppError('visitorFullName, contactNumber, and expectedDate are required.', 400, 'VALIDATION_ERROR');
        }
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const rand = Math.floor(100 + Math.random() * 900);
        const securityPassNumber = `PRE-${dateStr}-${rand}`;
        const record = await prisma_1.prisma.visitorPreRegistration.create({
            data: {
                visitorFullName: payload.visitorFullName,
                contactNumber: payload.contactNumber,
                expectedDate: payload.expectedDate,
                hostUserId,
                purpose: payload.purpose || 'Official Meeting',
                securityPassNumber,
                status: 'PENDING_ARRIVAL',
            },
            include: {
                hostUser: { select: { firstName: true, lastName: true, email: true, activeRole: true } },
            },
        });
        return record;
    }
    /**
     * 2. List Pre-Registered Visitors
     */
    static async getPreRegisteredVisitors(filters) {
        const where = {};
        if (filters?.expectedDate)
            where.expectedDate = filters.expectedDate;
        if (filters?.status)
            where.status = filters.status;
        if (filters?.hostUserId)
            where.hostUserId = filters.hostUserId;
        return prisma_1.prisma.visitorPreRegistration.findMany({
            where,
            orderBy: { expectedDate: 'asc' },
            include: {
                hostUser: { select: { firstName: true, lastName: true, activeRole: true } },
            },
            take: 100,
        });
    }
    /**
     * 3. Security Fast-Track Check-In for Pre-Registered Visitor
     */
    static async checkInPreRegisteredVisitor(preRegId, securityUserId) {
        const preReg = await prisma_1.prisma.visitorPreRegistration.findUnique({
            where: { id: preRegId },
            include: { hostUser: true },
        });
        if (!preReg) {
            throw new errorHandler_1.AppError('Pre-registration record not found.', 404, 'NOT_FOUND');
        }
        if (preReg.status === 'ARRIVED') {
            throw new errorHandler_1.AppError('Visitor has already been checked in.', 400, 'ALREADY_CHECKED_IN');
        }
        // 1. Create or resolve Visitor master record
        let visitor = await prisma_1.prisma.visitor.findFirst({
            where: { contactNumber: preReg.contactNumber },
        });
        if (!visitor) {
            visitor = await prisma_1.prisma.visitor.create({
                data: {
                    fullName: preReg.visitorFullName,
                    contactNumber: preReg.contactNumber,
                    visitorType: 'GUEST',
                },
            });
        }
        // 2. Create VisitorEntryExit record
        const passToken = `QR-TOKEN-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const passNumber = preReg.securityPassNumber || `PASS-${Date.now()}`;
        const entryExit = await prisma_1.prisma.visitorEntryExit.create({
            data: {
                visitorId: visitor.id,
                personToMeetName: `${preReg.hostUser.firstName} ${preReg.hostUser.lastName}`,
                personToMeetUserId: preReg.hostUserId,
                purpose: preReg.purpose,
                passNumber,
                passToken,
                entrySecurityUserId: securityUserId,
                status: 'INSIDE_CAMPUS',
            },
        });
        // 3. Mark pre-registration as ARRIVED
        await prisma_1.prisma.visitorPreRegistration.update({
            where: { id: preRegId },
            data: {
                status: 'ARRIVED',
                checkedInTime: new Date(),
            },
        });
        // 4. Realtime Broadcast to Host User & Security
        realtime_service_1.RealtimeService.broadcast('VISITOR_ENTERED', {
            passNumber,
            visitorName: visitor.fullName,
            hostUserId: preReg.hostUserId,
            entryTime: entryExit.entryTime,
        });
        return entryExit;
    }
    /**
     * 4. Live Campus Occupancy Dashboard
     */
    static async getLiveCampusOccupancy() {
        const visitorsInside = await prisma_1.prisma.visitorEntryExit.count({
            where: { status: 'INSIDE_CAMPUS' },
        });
        const vehiclesInside = await prisma_1.prisma.campusVehicleLog.count({
            where: { status: 'INSIDE_CAMPUS' },
        });
        const todayStr = new Date().toISOString().split('T')[0];
        const staffPresentToday = await prisma_1.prisma.attendance.count({
            where: { date: todayStr },
        });
        const activeEmergencyAlerts = await prisma_1.prisma.emergencyAlert.count({
            where: { status: 'SENT' },
        });
        return {
            visitorsInside,
            vehiclesInside,
            staffPresentToday,
            activeEmergencyAlerts,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * 5. Vehicle Document Expiry Alerts
     */
    static async getVehicleDocumentAlerts() {
        const vehicles = await prisma_1.prisma.vehicle.findMany({
            include: {
                assignedDriver: {
                    include: { user: { select: { firstName: true, lastName: true, phone: true } } },
                },
            },
        });
        const alerts = [];
        const now = new Date();
        for (const v of vehicles) {
            if (v.insuranceExpiry) {
                const diffDays = Math.ceil((v.insuranceExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays <= 30) {
                    alerts.push({
                        vehicleId: v.id,
                        vehicleNumber: v.registrationNumber,
                        driverName: v.assignedDriver?.user ? `${v.assignedDriver.user.firstName} ${v.assignedDriver.user.lastName}` : 'Unassigned',
                        documentType: 'Insurance Policy',
                        expiryDate: v.insuranceExpiry.toISOString().split('T')[0],
                        daysRemaining: diffDays,
                        severity: diffDays < 0 ? 'EXPIRED' : 'WARNING',
                    });
                }
            }
            if (v.fitnessExpiry) {
                const diffDays = Math.ceil((v.fitnessExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays <= 30) {
                    alerts.push({
                        vehicleId: v.id,
                        vehicleNumber: v.registrationNumber,
                        driverName: v.assignedDriver?.user ? `${v.assignedDriver.user.firstName} ${v.assignedDriver.user.lastName}` : 'Unassigned',
                        documentType: 'Fitness Certificate',
                        expiryDate: v.fitnessExpiry.toISOString().split('T')[0],
                        daysRemaining: diffDays,
                        severity: diffDays < 0 ? 'EXPIRED' : 'WARNING',
                    });
                }
            }
        }
        return {
            totalAlerts: alerts.length,
            alerts,
        };
    }
}
exports.SmartCampusService = SmartCampusService;
