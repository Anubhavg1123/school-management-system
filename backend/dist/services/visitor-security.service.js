"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitorSecurityService = void 0;
const prisma_1 = require("../prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const crypto_1 = __importDefault(require("crypto"));
class VisitorSecurityService {
    /**
     * 1. Register Visitor & Record Campus Entry
     */
    static async createVisitorEntry(securityUserId, payload) {
        if (!payload.fullName || !payload.contactNumber || !payload.purpose || !payload.personToMeetName) {
            throw new errorHandler_1.AppError('Visitor name, contact number, purpose, and person to meet are required.', 400);
        }
        // Upsert Visitor master record by contact number
        let visitor = await prisma_1.prisma.visitor.findFirst({
            where: { contactNumber: payload.contactNumber },
        });
        if (!visitor) {
            visitor = await prisma_1.prisma.visitor.create({
                data: {
                    fullName: payload.fullName,
                    contactNumber: payload.contactNumber,
                    visitorType: payload.visitorType || 'GUEST',
                    studentRelationship: payload.studentRelationship,
                    studentId: payload.studentId,
                    address: payload.address,
                    idProofType: payload.idProofType,
                    idProofNumber: payload.idProofNumber,
                },
            });
        }
        else {
            // Update details if provided
            visitor = await prisma_1.prisma.visitor.update({
                where: { id: visitor.id },
                data: {
                    fullName: payload.fullName,
                    visitorType: payload.visitorType || visitor.visitorType,
                    studentRelationship: payload.studentRelationship || visitor.studentRelationship,
                    studentId: payload.studentId || visitor.studentId,
                },
            });
        }
        // Generate unique pass number and secure pass token
        const dateCode = new Date().toISOString().replace(/-/g, '').substring(0, 8);
        const randomSeq = Math.floor(Math.random() * 9000 + 1000);
        const passNumber = `PASS-${dateCode}-${randomSeq}`;
        const passToken = crypto_1.default.randomUUID();
        const now = new Date();
        const entryLog = await prisma_1.prisma.visitorEntryExit.create({
            data: {
                visitorId: visitor.id,
                personToMeetName: payload.personToMeetName,
                personToMeetUserId: payload.personToMeetUserId,
                purpose: payload.purpose,
                vehicleNumber: payload.vehicleNumber ? payload.vehicleNumber.trim().toUpperCase() : null,
                vehicleType: payload.vehicleType,
                passNumber,
                passToken,
                entryTime: now,
                entrySecurityUserId: securityUserId,
                status: payload.isEmergency ? 'EMERGENCY_ENTRY' : 'INSIDE_CAMPUS',
                isEmergency: payload.isEmergency || false,
                emergencyReason: payload.emergencyReason,
                remarks: payload.remarks,
            },
            include: {
                visitor: {
                    include: {
                        student: { select: { admissionNumber: true, user: { select: { firstName: true, lastName: true } } } },
                    },
                },
                entrySecurity: { select: { firstName: true, lastName: true } },
            },
        });
        // If visitor brought a vehicle, log campus vehicle entry
        if (payload.vehicleNumber) {
            const regNo = payload.vehicleNumber.trim().toUpperCase();
            const isReg = await prisma_1.prisma.vehicle.findUnique({ where: { registrationNumber: regNo } });
            await prisma_1.prisma.campusVehicleLog.create({
                data: {
                    vehicleNumber: regNo,
                    driverOwnerName: payload.fullName,
                    vehicleType: payload.vehicleType || 'FOUR_WHEELER',
                    isRegistered: !!isReg,
                    vehicleId: isReg ? isReg.id : null,
                    visitorEntryId: entryLog.id,
                    purpose: payload.purpose,
                    entryTime: now,
                    entrySecurityUserId: securityUserId,
                    status: 'INSIDE_CAMPUS',
                },
            });
        }
        // Audit Log
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: securityUserId,
                action: 'VISITOR_ENTRY_CREATED',
                entityType: 'VisitorEntryExit',
                entityId: entryLog.id,
                afterState: JSON.stringify({ passNumber }),
            },
        });
        return entryLog;
    }
    /**
     * 2. Mark Visitor Exit
     */
    static async markVisitorExit(securityUserId, passNumberOrId, remarks) {
        const entry = await prisma_1.prisma.visitorEntryExit.findFirst({
            where: {
                OR: [{ id: passNumberOrId }, { passNumber: passNumberOrId }, { passToken: passNumberOrId }],
            },
        });
        if (!entry) {
            throw new errorHandler_1.AppError('Active visitor entry record not found.', 404);
        }
        if (entry.status === 'EXITED' || entry.exitTime) {
            throw new errorHandler_1.AppError(`Visitor exit already recorded at ${entry.exitTime?.toLocaleTimeString()}.`, 400);
        }
        const now = new Date();
        const updated = await prisma_1.prisma.visitorEntryExit.update({
            where: { id: entry.id },
            data: {
                exitTime: now,
                exitSecurityUserId: securityUserId,
                status: 'EXITED',
                remarks: remarks ? `${entry.remarks || ''} | ${remarks}` : entry.remarks,
            },
            include: { visitor: true },
        });
        // Also mark exit for associated vehicle entry log
        await prisma_1.prisma.campusVehicleLog.updateMany({
            where: { visitorEntryId: entry.id, status: 'INSIDE_CAMPUS' },
            data: {
                exitTime: now,
                exitSecurityUserId: securityUserId,
                status: 'EXITED',
            },
        });
        // Audit Log
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: securityUserId,
                action: 'VISITOR_EXIT_RECORDED',
                entityType: 'VisitorEntryExit',
                entityId: updated.id,
                afterState: JSON.stringify({ status: 'EXITED' }),
            },
        });
        return updated;
    }
    /**
     * 3. Currently Active Visitors Inside Campus & Overstay Detection
     */
    static async getActiveVisitors(overstayThresholdHours = 4) {
        const activeEntries = await prisma_1.prisma.visitorEntryExit.findMany({
            where: {
                status: { in: ['INSIDE_CAMPUS', 'EMERGENCY_ENTRY', 'OVERSTAY_ALERT'] },
            },
            include: {
                visitor: {
                    include: {
                        student: { select: { admissionNumber: true, user: { select: { firstName: true, lastName: true } } } },
                    },
                },
                entrySecurity: { select: { firstName: true, lastName: true } },
            },
            orderBy: { entryTime: 'desc' },
        });
        const now = new Date();
        return activeEntries.map((e) => {
            const durationHours = Number(((now.getTime() - new Date(e.entryTime).getTime()) / (1000 * 60 * 60)).toFixed(1));
            const isOverstay = durationHours >= overstayThresholdHours;
            return {
                id: e.id,
                passNumber: e.passNumber,
                passToken: e.passToken,
                visitorName: e.visitor.fullName,
                contactNumber: e.visitor.contactNumber,
                visitorType: e.visitor.visitorType,
                studentRelationship: e.visitor.studentRelationship,
                studentName: e.visitor.student ? `${e.visitor.student.user.firstName} ${e.visitor.student.user.lastName}` : null,
                personToMeet: e.personToMeetName,
                purpose: e.purpose,
                vehicleNumber: e.vehicleNumber,
                entryTime: e.entryTime,
                durationHours,
                isOverstay,
                isEmergency: e.isEmergency,
                emergencyReason: e.emergencyReason,
                entrySecurityName: `${e.entrySecurity.firstName} ${e.entrySecurity.lastName}`,
            };
        });
    }
    /**
     * 4. Parent / Guardian Student Search
     */
    static async searchStudentForVisitor(query) {
        if (!query || query.trim().length === 0)
            return [];
        return prisma_1.prisma.student.findMany({
            where: {
                OR: [
                    { admissionNumber: { contains: query.trim() } },
                    { rollNumber: { contains: query.trim() } },
                    { user: { firstName: { contains: query.trim() } } },
                    { user: { lastName: { contains: query.trim() } } },
                ],
            },
            include: {
                user: { select: { firstName: true, lastName: true, email: true, phone: true } },
                guardians: true,
            },
            take: 10,
        });
    }
    /**
     * 5. Registered Vehicle Verification at Campus Gate
     */
    static async verifyRegisteredVehicle(vehicleNumber) {
        const regNo = vehicleNumber.trim().toUpperCase();
        // Check institutional fleet
        const instVehicle = await prisma_1.prisma.vehicle.findUnique({
            where: { registrationNumber: regNo },
            include: {
                assignedDriver: { include: { user: { select: { firstName: true, lastName: true } } } },
            },
        });
        if (instVehicle) {
            return {
                isApproved: instVehicle.status === 'ACTIVE',
                category: 'INSTITUTIONAL_FLEET',
                registrationNumber: instVehicle.registrationNumber,
                vehicleType: instVehicle.vehicleType,
                makeModel: instVehicle.makeModel,
                ownerName: instVehicle.assignedDriver
                    ? `${instVehicle.assignedDriver.user.firstName} ${instVehicle.assignedDriver.user.lastName}`
                    : 'Institution Fleet',
                status: instVehicle.status,
            };
        }
        // Check personal registered faculty/staff vehicle
        const personalVehicle = await prisma_1.prisma.facultyVehicleRegistration.findUnique({
            where: { vehicleNumber: regNo },
            include: { user: { select: { firstName: true, lastName: true, email: true, activeRole: true } } },
        });
        if (personalVehicle) {
            return {
                isApproved: personalVehicle.status === 'APPROVED',
                category: 'REGISTERED_PERSONAL',
                registrationNumber: personalVehicle.vehicleNumber,
                vehicleType: personalVehicle.vehicleType,
                makeModel: personalVehicle.makeModel,
                ownerName: `${personalVehicle.user.firstName} ${personalVehicle.user.lastName} (${personalVehicle.user.activeRole})`,
                status: personalVehicle.status,
            };
        }
        return {
            isApproved: false,
            category: 'UNREGISTERED_TEMPORARY',
            registrationNumber: regNo,
            ownerName: 'Unregistered Vehicle',
            status: 'UNREGISTERED',
        };
    }
    /**
     * 6. Standalone Campus Vehicle Entry / Exit Logging
     */
    static async recordCampusVehicleEntry(securityUserId, payload) {
        const regNo = payload.vehicleNumber.trim().toUpperCase();
        const ver = await this.verifyRegisteredVehicle(regNo);
        const log = await prisma_1.prisma.campusVehicleLog.create({
            data: {
                vehicleNumber: regNo,
                driverOwnerName: payload.driverOwnerName || ver.ownerName,
                vehicleType: payload.vehicleType || ver.vehicleType || 'OTHER',
                isRegistered: ver.isApproved,
                vehicleId: ver.category === 'INSTITUTIONAL_FLEET' ? ver.registrationNumber : null,
                purpose: payload.purpose || 'Campus Entry',
                entryTime: new Date(),
                entrySecurityUserId: securityUserId,
                status: 'INSIDE_CAMPUS',
            },
        });
        return log;
    }
    static async recordCampusVehicleExit(securityUserId, vehicleLogId) {
        const log = await prisma_1.prisma.campusVehicleLog.findUnique({ where: { id: vehicleLogId } });
        if (!log) {
            throw new errorHandler_1.AppError('Campus vehicle entry log not found.', 404);
        }
        return prisma_1.prisma.campusVehicleLog.update({
            where: { id: vehicleLogId },
            data: {
                exitTime: new Date(),
                exitSecurityUserId: securityUserId,
                status: 'EXITED',
            },
        });
    }
    /**
     * 7. Visitor Digital Pass Retrieval
     */
    static async getVisitorPass(passTokenOrNumber) {
        const entry = await prisma_1.prisma.visitorEntryExit.findFirst({
            where: {
                OR: [{ passToken: passTokenOrNumber }, { passNumber: passTokenOrNumber }, { id: passTokenOrNumber }],
            },
            include: {
                visitor: {
                    include: {
                        student: { select: { admissionNumber: true, user: { select: { firstName: true, lastName: true } } } },
                    },
                },
                entrySecurity: { select: { firstName: true, lastName: true } },
            },
        });
        if (!entry) {
            throw new errorHandler_1.AppError('Invalid visitor pass reference.', 404);
        }
        return {
            passNumber: entry.passNumber,
            passToken: entry.passToken,
            visitorName: entry.visitor.fullName,
            contactNumber: entry.visitor.contactNumber,
            visitorType: entry.visitor.visitorType,
            studentRelationship: entry.visitor.studentRelationship,
            personToMeet: entry.personToMeetName,
            purpose: entry.purpose,
            vehicleNumber: entry.vehicleNumber,
            entryTime: entry.entryTime,
            exitTime: entry.exitTime,
            status: entry.status,
            isEmergency: entry.isEmergency,
            securityStaff: `${entry.entrySecurity.firstName} ${entry.entrySecurity.lastName}`,
        };
    }
    /**
     * 8. Security Visitor History Search
     */
    static async searchVisitors(params) {
        const where = {};
        if (params?.type)
            where.visitor = { visitorType: params.type };
        if (params?.search) {
            where.OR = [
                { passNumber: { contains: params.search } },
                { personToMeetName: { contains: params.search } },
                { vehicleNumber: { contains: params.search } },
                { visitor: { fullName: { contains: params.search } } },
                { visitor: { contactNumber: { contains: params.search } } },
            ];
        }
        return prisma_1.prisma.visitorEntryExit.findMany({
            where,
            include: {
                visitor: true,
                entrySecurity: { select: { firstName: true, lastName: true } },
                exitSecurity: { select: { firstName: true, lastName: true } },
            },
            orderBy: { entryTime: 'desc' },
            take: 50,
        });
    }
}
exports.VisitorSecurityService = VisitorSecurityService;
