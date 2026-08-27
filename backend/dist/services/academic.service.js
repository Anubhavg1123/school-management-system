"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicService = void 0;
const prisma_1 = require("../prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const audit_service_1 = require("./audit.service");
const password_1 = require("../utils/password");
const types_1 = require("../types");
class AcademicService {
    // ----------------------------------------------------
    // 1. DEPARTMENTS & HOD MANAGEMENT
    // ----------------------------------------------------
    static async getDepartments() {
        return prisma_1.prisma.department.findMany({
            include: {
                hod: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        facultyMembers: true,
                        classes: true,
                        students: true,
                        subjects: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
    static async getDepartmentById(id) {
        const dept = await prisma_1.prisma.department.findUnique({
            where: { id },
            include: {
                hod: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        whatsAppNumber: true,
                    },
                },
                facultyMembers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                                status: true,
                            },
                        },
                    },
                },
                classes: {
                    include: {
                        sections: true,
                        academicYear: true,
                    },
                },
                subjects: true,
                hodHistory: {
                    include: {
                        hod: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                        assignedBy: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                    orderBy: { startDate: 'desc' },
                },
                _count: {
                    select: {
                        students: true,
                        facultyMembers: true,
                        classes: true,
                        subjects: true,
                    },
                },
            },
        });
        if (!dept) {
            throw new errorHandler_1.AppError('Department not found.', 404, 'DEPT_NOT_FOUND');
        }
        return dept;
    }
    static async createDepartment(data, actorId, ipAddress) {
        const existing = await prisma_1.prisma.department.findUnique({ where: { code: data.code.toUpperCase() } });
        if (existing) {
            throw new errorHandler_1.AppError(`Department with code '${data.code}' already exists.`, 409, 'DEPT_CODE_EXISTS');
        }
        const dept = await prisma_1.prisma.$transaction(async (tx) => {
            const d = await tx.department.create({
                data: {
                    code: data.code.toUpperCase(),
                    name: data.name,
                    description: data.description || null,
                    hodUserId: data.hodUserId || null,
                },
            });
            if (data.hodUserId) {
                await tx.departmentHodHistory.create({
                    data: {
                        departmentId: d.id,
                        hodUserId: data.hodUserId,
                        assignedByUserId: actorId,
                        status: 'ACTIVE',
                        reason: 'Initial HOD assignment during department establishment.',
                    },
                });
            }
            return d;
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'DEPARTMENT_CREATED',
            entityType: 'Department',
            entityId: dept.id,
            afterState: dept,
            ipAddress,
        });
        return dept;
    }
    static async updateDepartment(id, data, actorId, ipAddress) {
        const existing = await prisma_1.prisma.department.findUnique({ where: { id } });
        if (!existing) {
            throw new errorHandler_1.AppError('Department not found.', 404, 'DEPT_NOT_FOUND');
        }
        const updated = await prisma_1.prisma.department.update({
            where: { id },
            data: {
                name: data.name ?? existing.name,
                description: data.description !== undefined ? data.description : existing.description,
                status: data.status ?? existing.status,
            },
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'DEPARTMENT_UPDATED',
            entityType: 'Department',
            entityId: id,
            beforeState: existing,
            afterState: updated,
            ipAddress,
        });
        return updated;
    }
    static async assignDepartmentHod(departmentId, hodUserId, reason, actorId, ipAddress) {
        const dept = await prisma_1.prisma.department.findUnique({ where: { id: departmentId } });
        if (!dept) {
            throw new errorHandler_1.AppError('Department not found.', 404, 'DEPT_NOT_FOUND');
        }
        const targetUser = await prisma_1.prisma.user.findUnique({
            where: { id: hodUserId },
            include: { userRoles: { include: { role: true } }, facultyProfile: true },
        });
        if (!targetUser || targetUser.status !== types_1.UserStatusEnum.ACTIVE) {
            throw new errorHandler_1.AppError('The selected HOD must be an active user.', 400, 'INVALID_HOD_USER');
        }
        // Check if faculty is already HOD of another active department
        const existingOtherDept = await prisma_1.prisma.department.findFirst({
            where: {
                hodUserId,
                id: { not: departmentId },
                status: 'ACTIVE',
            },
        });
        if (existingOtherDept) {
            throw new errorHandler_1.AppError(`Faculty is already assigned as HOD of ${existingOtherDept.name} (${existingOtherDept.code}). Multiple active HOD roles are restricted.`, 400, 'HOD_ALREADY_ASSIGNED');
        }
        const hodRole = await prisma_1.prisma.role.findUnique({ where: { name: types_1.UserRoleEnum.HOD } });
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            // 1. Close current active HOD history for this department
            await tx.departmentHodHistory.updateMany({
                where: { departmentId, status: 'ACTIVE' },
                data: {
                    endDate: new Date(),
                    status: 'PAST',
                },
            });
            // 2. Create new HOD history
            const history = await tx.departmentHodHistory.create({
                data: {
                    departmentId,
                    hodUserId,
                    assignedByUserId: actorId,
                    status: 'ACTIVE',
                    reason: reason || 'Department HOD appointment.',
                },
            });
            // 3. Update department hodUserId
            const updatedDept = await tx.department.update({
                where: { id: departmentId },
                data: { hodUserId },
            });
            // 4. Assign HOD role to user scoped to this department
            if (hodRole) {
                await tx.userRole.upsert({
                    where: {
                        userId_roleId: {
                            userId: hodUserId,
                            roleId: hodRole.id,
                        },
                    },
                    update: { departmentId },
                    create: {
                        userId: hodUserId,
                        roleId: hodRole.id,
                        departmentId,
                        assignedBy: actorId,
                    },
                });
            }
            return { department: updatedDept, history };
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'HOD_ASSIGNED',
            entityType: 'Department',
            entityId: departmentId,
            afterState: { hodUserId, reason },
            ipAddress,
        });
        return result;
    }
    // ----------------------------------------------------
    // 2. ACADEMIC YEARS
    // ----------------------------------------------------
    static async getAcademicYears() {
        return prisma_1.prisma.academicYear.findMany({
            orderBy: { startDate: 'desc' },
            include: {
                _count: {
                    select: {
                        classes: true,
                        students: true,
                        timetableEntries: true,
                    },
                },
            },
        });
    }
    static async createAcademicYear(data, actorId, ipAddress) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        if (start >= end) {
            throw new errorHandler_1.AppError('Start date must be before end date.', 400, 'INVALID_DATE_RANGE');
        }
        if (data.isCurrent) {
            await prisma_1.prisma.academicYear.updateMany({
                where: { isCurrent: true },
                data: { isCurrent: false },
            });
        }
        const year = await prisma_1.prisma.academicYear.create({
            data: {
                name: data.name,
                startDate: start,
                endDate: end,
                isCurrent: data.isCurrent ?? false,
            },
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'ACADEMIC_YEAR_CREATED',
            entityType: 'AcademicYear',
            entityId: year.id,
            afterState: year,
            ipAddress,
        });
        return year;
    }
    static async setAcademicYearStatus(id, isCurrent, actorId, ipAddress) {
        const year = await prisma_1.prisma.academicYear.findUnique({ where: { id } });
        if (!year) {
            throw new errorHandler_1.AppError('Academic year not found.', 404, 'ACADEMIC_YEAR_NOT_FOUND');
        }
        if (isCurrent) {
            await prisma_1.prisma.academicYear.updateMany({
                where: { isCurrent: true },
                data: { isCurrent: false },
            });
        }
        const updated = await prisma_1.prisma.academicYear.update({
            where: { id },
            data: { isCurrent },
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'ACADEMIC_YEAR_STATUS_CHANGED',
            entityType: 'AcademicYear',
            entityId: id,
            afterState: updated,
            ipAddress,
        });
        return updated;
    }
    // ----------------------------------------------------
    // 3. CLASSES, SECTIONS & COORDINATORS
    // ----------------------------------------------------
    static async getClasses(departmentId, academicYearId) {
        const where = {};
        if (departmentId)
            where.departmentId = departmentId;
        if (academicYearId)
            where.academicYearId = academicYearId;
        return prisma_1.prisma.class.findMany({
            where,
            include: {
                department: true,
                academicYear: true,
                sections: {
                    include: {
                        _count: {
                            select: { students: true },
                        },
                    },
                },
                classSubjects: {
                    include: {
                        subject: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
    static async createClass(data, actorId, ipAddress) {
        const existing = await prisma_1.prisma.class.findUnique({ where: { code: data.code } });
        if (existing) {
            throw new errorHandler_1.AppError(`Class code '${data.code}' is already in use.`, 409, 'CLASS_CODE_EXISTS');
        }
        const newClass = await prisma_1.prisma.class.create({
            data: {
                name: data.name,
                code: data.code,
                departmentId: data.departmentId || null,
                academicYearId: data.academicYearId,
            },
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'CLASS_CREATED',
            entityType: 'Class',
            entityId: newClass.id,
            afterState: newClass,
            ipAddress,
        });
        return newClass;
    }
    static async getSections(classId) {
        const where = {};
        if (classId)
            where.classId = classId;
        return prisma_1.prisma.section.findMany({
            where,
            include: {
                class: {
                    include: {
                        department: true,
                        academicYear: true,
                    },
                },
                _count: {
                    select: { students: true },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
    static async createSection(data, actorId, ipAddress) {
        const existing = await prisma_1.prisma.section.findUnique({
            where: {
                classId_name: {
                    classId: data.classId,
                    name: data.name,
                },
            },
        });
        if (existing) {
            throw new errorHandler_1.AppError(`Section '${data.name}' already exists in this class.`, 409, 'SECTION_EXISTS');
        }
        const section = await prisma_1.prisma.section.create({
            data: {
                classId: data.classId,
                name: data.name,
                capacity: data.capacity || 60,
                coordinatorFacultyId: data.coordinatorFacultyId || null,
            },
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'SECTION_CREATED',
            entityType: 'Section',
            entityId: section.id,
            afterState: section,
            ipAddress,
        });
        return section;
    }
    static async assignClassCoordinator(sectionId, facultyId, academicYearId, reason, actorId, ipAddress) {
        const section = await prisma_1.prisma.section.findUnique({
            where: { id: sectionId },
            include: { class: true },
        });
        if (!section) {
            throw new errorHandler_1.AppError('Section not found.', 404, 'SECTION_NOT_FOUND');
        }
        const faculty = await prisma_1.prisma.faculty.findUnique({
            where: { id: facultyId },
            include: { user: true },
        });
        if (!faculty || faculty.status !== 'ACTIVE') {
            throw new errorHandler_1.AppError('The selected faculty member is invalid or inactive.', 400, 'INVALID_FACULTY');
        }
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            // 1. Close current coordinator history
            await tx.classCoordinatorHistory.updateMany({
                where: { sectionId, status: 'ACTIVE' },
                data: {
                    endDate: new Date(),
                    status: 'PAST',
                },
            });
            // 2. Create new coordinator history
            const history = await tx.classCoordinatorHistory.create({
                data: {
                    sectionId,
                    facultyId,
                    academicYearId,
                    assignedByUserId: actorId,
                    status: 'ACTIVE',
                    reason: reason || 'Class coordinator appointment.',
                },
            });
            // 3. Update section
            const updatedSection = await tx.section.update({
                where: { id: sectionId },
                data: { coordinatorFacultyId: facultyId },
            });
            return { section: updatedSection, history };
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'CLASS_COORDINATOR_ASSIGNED',
            entityType: 'Section',
            entityId: sectionId,
            afterState: { facultyId, reason },
            ipAddress,
        });
        return result;
    }
    // ----------------------------------------------------
    // 4. SUBJECTS & CLASS-SUBJECT ALLOCATIONS
    // ----------------------------------------------------
    static async getSubjects(departmentId) {
        const where = {};
        if (departmentId)
            where.departmentId = departmentId;
        return prisma_1.prisma.subject.findMany({
            where,
            include: {
                department: true,
                _count: {
                    select: {
                        classSubjects: true,
                        facultySubjectAssignments: true,
                    },
                },
            },
            orderBy: { code: 'asc' },
        });
    }
    static async createSubject(data, actorId, ipAddress) {
        const existing = await prisma_1.prisma.subject.findUnique({ where: { code: data.code.toUpperCase() } });
        if (existing) {
            throw new errorHandler_1.AppError(`Subject with code '${data.code}' already exists.`, 409, 'SUBJECT_CODE_EXISTS');
        }
        const subject = await prisma_1.prisma.subject.create({
            data: {
                code: data.code.toUpperCase(),
                name: data.name,
                type: data.type || 'THEORY',
                credits: data.credits !== undefined ? data.credits : 3.0,
                departmentId: data.departmentId || null,
                description: data.description || null,
            },
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'SUBJECT_CREATED',
            entityType: 'Subject',
            entityId: subject.id,
            afterState: subject,
            ipAddress,
        });
        return subject;
    }
    static async updateSubject(id, data, actorId, ipAddress) {
        const existing = await prisma_1.prisma.subject.findUnique({ where: { id } });
        if (!existing) {
            throw new errorHandler_1.AppError('Subject not found.', 404, 'SUBJECT_NOT_FOUND');
        }
        const updated = await prisma_1.prisma.subject.update({
            where: { id },
            data: {
                name: data.name ?? existing.name,
                type: data.type ?? existing.type,
                credits: data.credits !== undefined ? data.credits : existing.credits,
                departmentId: data.departmentId !== undefined ? data.departmentId : existing.departmentId,
                description: data.description !== undefined ? data.description : existing.description,
                status: data.status ?? existing.status,
            },
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'SUBJECT_UPDATED',
            entityType: 'Subject',
            entityId: id,
            beforeState: existing,
            afterState: updated,
            ipAddress,
        });
        return updated;
    }
    static async assignSubjectsToClass(academicYearId, classId, subjectIds, actorId, ipAddress) {
        const targetClass = await prisma_1.prisma.class.findUnique({ where: { id: classId } });
        if (!targetClass) {
            throw new errorHandler_1.AppError('Class not found.', 404, 'CLASS_NOT_FOUND');
        }
        const assignments = await prisma_1.prisma.$transaction(async (tx) => {
            const records = [];
            for (const subjectId of subjectIds) {
                const item = await tx.classSubject.upsert({
                    where: {
                        academicYearId_classId_subjectId: {
                            academicYearId,
                            classId,
                            subjectId,
                        },
                    },
                    update: {},
                    create: {
                        academicYearId,
                        classId,
                        subjectId,
                        isCompulsory: true,
                    },
                });
                records.push(item);
            }
            return records;
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'CLASS_SUBJECTS_ASSIGNED',
            entityType: 'Class',
            entityId: classId,
            afterState: { academicYearId, count: subjectIds.length },
            ipAddress,
        });
        return assignments;
    }
    static async getClassSubjects(classId, academicYearId) {
        const where = { classId };
        if (academicYearId)
            where.academicYearId = academicYearId;
        return prisma_1.prisma.classSubject.findMany({
            where,
            include: {
                subject: true,
                class: true,
                academicYear: true,
            },
            orderBy: { subject: { code: 'asc' } },
        });
    }
    // ----------------------------------------------------
    // 5. FACULTY SUBJECT ASSIGNMENT & WORKLOAD
    // ----------------------------------------------------
    static async assignFacultyToSubject(data, actorId, ipAddress) {
        const faculty = await prisma_1.prisma.faculty.findUnique({
            where: { id: data.facultyId },
            include: { user: true, department: true },
        });
        if (!faculty || faculty.status !== 'ACTIVE') {
            throw new errorHandler_1.AppError('Faculty member not found or inactive.', 400, 'INVALID_FACULTY');
        }
        const subject = await prisma_1.prisma.subject.findUnique({ where: { id: data.subjectId } });
        if (!subject) {
            throw new errorHandler_1.AppError('Subject not found.', 404, 'SUBJECT_NOT_FOUND');
        }
        const assignment = await prisma_1.prisma.facultySubjectAssignment.create({
            data: {
                academicYearId: data.academicYearId,
                facultyId: data.facultyId,
                classId: data.classId,
                sectionId: data.sectionId || null,
                subjectId: data.subjectId,
                assignedByUserId: actorId,
            },
            include: {
                faculty: { include: { user: true } },
                class: true,
                section: true,
                subject: true,
            },
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'FACULTY_SUBJECT_ASSIGNED',
            entityType: 'FacultySubjectAssignment',
            entityId: assignment.id,
            afterState: assignment,
            ipAddress,
        });
        return assignment;
    }
    static async getFacultyAssignments(filters) {
        const where = {};
        if (filters.academicYearId)
            where.academicYearId = filters.academicYearId;
        if (filters.facultyId)
            where.facultyId = filters.facultyId;
        if (filters.classId)
            where.classId = filters.classId;
        if (filters.departmentId) {
            where.faculty = { departmentId: filters.departmentId };
        }
        return prisma_1.prisma.facultySubjectAssignment.findMany({
            where,
            include: {
                faculty: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                        department: true,
                    },
                },
                class: true,
                section: true,
                subject: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async deleteFacultyAssignment(id, actorId, ipAddress) {
        const existing = await prisma_1.prisma.facultySubjectAssignment.findUnique({ where: { id } });
        if (!existing) {
            throw new errorHandler_1.AppError('Faculty assignment not found.', 404, 'ASSIGNMENT_NOT_FOUND');
        }
        await prisma_1.prisma.facultySubjectAssignment.delete({ where: { id } });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'FACULTY_SUBJECT_UNASSIGNED',
            entityType: 'FacultySubjectAssignment',
            entityId: id,
            beforeState: existing,
            ipAddress,
        });
        return { message: 'Faculty assignment successfully removed.' };
    }
    // ----------------------------------------------------
    // 6. ROOMS & TIME SLOTS
    // ----------------------------------------------------
    static async getRooms(type, status) {
        const where = {};
        if (type)
            where.type = type;
        if (status)
            where.status = status;
        return prisma_1.prisma.room.findMany({
            where,
            orderBy: { roomNumber: 'asc' },
        });
    }
    static async createRoom(data, actorId, ipAddress) {
        const existing = await prisma_1.prisma.room.findUnique({ where: { roomNumber: data.roomNumber } });
        if (existing) {
            throw new errorHandler_1.AppError(`Room '${data.roomNumber}' already exists.`, 409, 'ROOM_EXISTS');
        }
        const room = await prisma_1.prisma.room.create({
            data: {
                roomNumber: data.roomNumber,
                name: data.name,
                building: data.building,
                floor: data.floor || 1,
                capacity: data.capacity || 60,
                type: data.type || 'CLASSROOM',
                equipment: data.equipment || null,
            },
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'ROOM_CREATED',
            entityType: 'Room',
            entityId: room.id,
            afterState: room,
            ipAddress,
        });
        return room;
    }
    static async updateRoom(id, data, actorId, ipAddress) {
        const existing = await prisma_1.prisma.room.findUnique({ where: { id } });
        if (!existing) {
            throw new errorHandler_1.AppError('Room not found.', 404, 'ROOM_NOT_FOUND');
        }
        const updated = await prisma_1.prisma.room.update({
            where: { id },
            data: {
                name: data.name ?? existing.name,
                building: data.building ?? existing.building,
                floor: data.floor ?? existing.floor,
                capacity: data.capacity ?? existing.capacity,
                type: data.type ?? existing.type,
                equipment: data.equipment !== undefined ? data.equipment : existing.equipment,
                status: data.status ?? existing.status,
            },
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'ROOM_UPDATED',
            entityType: 'Room',
            entityId: id,
            beforeState: existing,
            afterState: updated,
            ipAddress,
        });
        return updated;
    }
    static async getTimeSlots(academicYearId, dayOfWeek) {
        const where = { academicYearId };
        if (dayOfWeek)
            where.dayOfWeek = dayOfWeek;
        return prisma_1.prisma.timeSlot.findMany({
            where,
            orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
        });
    }
    static async createTimeSlot(data, actorId, ipAddress) {
        const existing = await prisma_1.prisma.timeSlot.findUnique({
            where: {
                academicYearId_dayOfWeek_periodNumber: {
                    academicYearId: data.academicYearId,
                    dayOfWeek: data.dayOfWeek,
                    periodNumber: data.periodNumber,
                },
            },
        });
        if (existing) {
            throw new errorHandler_1.AppError(`Time slot Period ${data.periodNumber} for ${data.dayOfWeek} already exists in this academic year.`, 409, 'TIMESLOT_EXISTS');
        }
        const timeSlot = await prisma_1.prisma.timeSlot.create({
            data: {
                academicYearId: data.academicYearId,
                dayOfWeek: data.dayOfWeek,
                periodNumber: data.periodNumber,
                name: data.name,
                startTime: data.startTime,
                endTime: data.endTime,
                isBreak: data.isBreak || false,
            },
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'TIME_SLOT_CREATED',
            entityType: 'TimeSlot',
            entityId: timeSlot.id,
            afterState: timeSlot,
            ipAddress,
        });
        return timeSlot;
    }
    static async generateDefaultTimeSlots(academicYearId, days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'], actorId) {
        const defaultPeriods = [
            { periodNumber: 1, name: 'Period 1', startTime: '09:00', endTime: '10:00', isBreak: false },
            { periodNumber: 2, name: 'Period 2', startTime: '10:00', endTime: '11:00', isBreak: false },
            { periodNumber: 3, name: 'Morning Break', startTime: '11:00', endTime: '11:15', isBreak: true },
            { periodNumber: 4, name: 'Period 3', startTime: '11:15', endTime: '12:15', isBreak: false },
            { periodNumber: 5, name: 'Lunch Break', startTime: '12:15', endTime: '13:00', isBreak: true },
            { periodNumber: 6, name: 'Period 4', startTime: '13:00', endTime: '14:00', isBreak: false },
            { periodNumber: 7, name: 'Period 5', startTime: '14:00', endTime: '15:00', isBreak: false },
            { periodNumber: 8, name: 'Period 6', startTime: '15:00', endTime: '16:00', isBreak: false },
        ];
        const results = [];
        for (const day of days) {
            for (const p of defaultPeriods) {
                const slot = await prisma_1.prisma.timeSlot.upsert({
                    where: {
                        academicYearId_dayOfWeek_periodNumber: {
                            academicYearId,
                            dayOfWeek: day,
                            periodNumber: p.periodNumber,
                        },
                    },
                    update: {
                        name: p.name,
                        startTime: p.startTime,
                        endTime: p.endTime,
                        isBreak: p.isBreak,
                    },
                    create: {
                        academicYearId,
                        dayOfWeek: day,
                        periodNumber: p.periodNumber,
                        name: p.name,
                        startTime: p.startTime,
                        endTime: p.endTime,
                        isBreak: p.isBreak,
                    },
                });
                results.push(slot);
            }
        }
        if (actorId) {
            await audit_service_1.AuditService.log({
                userId: actorId,
                action: 'TIME_SLOTS_INITIALIZED',
                entityType: 'AcademicYear',
                entityId: academicYearId,
                afterState: { generatedSlotsCount: results.length },
            });
        }
        return results;
    }
    // ----------------------------------------------------
    // 7. FACULTY AVAILABILITY
    // ----------------------------------------------------
    static async getFacultyAvailability(facultyId, academicYearId) {
        return prisma_1.prisma.facultyAvailability.findMany({
            where: { facultyId, academicYearId },
            include: { timeSlot: true },
            orderBy: { dayOfWeek: 'asc' },
        });
    }
    static async setFacultyAvailability(data, actorId, ipAddress) {
        const record = await prisma_1.prisma.facultyAvailability.create({
            data: {
                facultyId: data.facultyId,
                academicYearId: data.academicYearId,
                dayOfWeek: data.dayOfWeek,
                timeSlotId: data.timeSlotId || null,
                startTime: data.startTime || null,
                endTime: data.endTime || null,
                isAvailable: data.isAvailable,
                reason: data.reason || null,
            },
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'FACULTY_AVAILABILITY_SET',
            entityType: 'FacultyAvailability',
            entityId: record.id,
            afterState: record,
            ipAddress,
        });
        return record;
    }
    // ----------------------------------------------------
    // 8. TIMETABLE ENGINE WITH 5-WAY CONFLICT DETECTION
    // ----------------------------------------------------
    static async checkTimetableConflicts(data) {
        const slot = await prisma_1.prisma.timeSlot.findUnique({ where: { id: data.timeSlotId } });
        if (!slot) {
            return { hasConflict: true, type: 'INVALID_SLOT', message: 'Selected time slot does not exist.' };
        }
        if (slot.isBreak) {
            return { hasConflict: true, type: 'BREAK_SLOT', message: `Cannot schedule classes during '${slot.name}'.` };
        }
        const whereBase = {
            academicYearId: data.academicYearId,
            timeSlotId: data.timeSlotId,
            status: 'ACTIVE',
        };
        if (data.excludeEntryId) {
            whereBase.id = { not: data.excludeEntryId };
        }
        // 1. Faculty Overlap Collision
        const facultyConflict = await prisma_1.prisma.timetableEntry.findFirst({
            where: {
                ...whereBase,
                facultyId: data.facultyId,
            },
            include: {
                class: true,
                section: true,
                subject: true,
                faculty: { include: { user: true } },
            },
        });
        if (facultyConflict) {
            return {
                hasConflict: true,
                type: 'FACULTY_CONFLICT',
                message: `Faculty ${facultyConflict.faculty.user.firstName} ${facultyConflict.faculty.user.lastName} is already teaching ${facultyConflict.subject.name} to ${facultyConflict.class.name} (${facultyConflict.section.name}) at this time slot.`,
                conflictingEntry: facultyConflict,
            };
        }
        // 2. Room Collision
        const roomConflict = await prisma_1.prisma.timetableEntry.findFirst({
            where: {
                ...whereBase,
                roomId: data.roomId,
            },
            include: {
                class: true,
                section: true,
                room: true,
            },
        });
        if (roomConflict) {
            return {
                hasConflict: true,
                type: 'ROOM_CONFLICT',
                message: `Room ${roomConflict.room.name} (${roomConflict.room.roomNumber}) is already booked by ${roomConflict.class.name} (${roomConflict.section.name}) at this time slot.`,
                conflictingEntry: roomConflict,
            };
        }
        // 3. Section Collision
        const sectionConflict = await prisma_1.prisma.timetableEntry.findFirst({
            where: {
                ...whereBase,
                sectionId: data.sectionId,
            },
            include: {
                subject: true,
                section: true,
            },
        });
        if (sectionConflict) {
            return {
                hasConflict: true,
                type: 'SECTION_CONFLICT',
                message: `Section ${sectionConflict.section.name} already has ${sectionConflict.subject.name} scheduled at this time slot.`,
                conflictingEntry: sectionConflict,
            };
        }
        // 4. Faculty Leave Collision (Active Approved Leaves)
        const faculty = await prisma_1.prisma.faculty.findUnique({
            where: { id: data.facultyId },
            include: { user: true },
        });
        if (faculty) {
            const activeLeave = await prisma_1.prisma.facultyLeave.findFirst({
                where: {
                    userId: faculty.userId,
                    status: 'APPROVED',
                },
            });
            // If needed, check leave date range against current semester
            if (activeLeave && activeLeave.totalDays > 30) {
                return {
                    hasConflict: true,
                    type: 'FACULTY_LEAVE_CONFLICT',
                    message: `Faculty ${faculty.user.firstName} ${faculty.user.lastName} is currently on approved long-term leave (${activeLeave.leaveType}).`,
                };
            }
        }
        // 5. Faculty Availability Violation
        const unavailableSlot = await prisma_1.prisma.facultyAvailability.findFirst({
            where: {
                facultyId: data.facultyId,
                academicYearId: data.academicYearId,
                dayOfWeek: data.dayOfWeek,
                isAvailable: false,
                OR: [
                    { timeSlotId: data.timeSlotId },
                    { timeSlotId: null }, // whole day unavailable
                ],
            },
        });
        if (unavailableSlot) {
            return {
                hasConflict: true,
                type: 'AVAILABILITY_CONFLICT',
                message: `Faculty is marked unavailable on ${data.dayOfWeek}${unavailableSlot.reason ? ` (${unavailableSlot.reason})` : ''}.`,
            };
        }
        return { hasConflict: false };
    }
    static async getTimetable(filters) {
        const where = {
            academicYearId: filters.academicYearId,
            status: 'ACTIVE',
        };
        if (filters.departmentId)
            where.departmentId = filters.departmentId;
        if (filters.classId)
            where.classId = filters.classId;
        if (filters.sectionId)
            where.sectionId = filters.sectionId;
        if (filters.facultyId)
            where.facultyId = filters.facultyId;
        if (filters.roomId)
            where.roomId = filters.roomId;
        if (filters.dayOfWeek)
            where.dayOfWeek = filters.dayOfWeek;
        return prisma_1.prisma.timetableEntry.findMany({
            where,
            include: {
                class: true,
                section: true,
                subject: true,
                room: true,
                timeSlot: true,
                faculty: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                        department: true,
                    },
                },
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { timeSlot: { periodNumber: 'asc' } },
            ],
        });
    }
    static async createTimetableEntry(data, actorId, ipAddress) {
        // Run 5-way backend conflict detection
        const conflict = await this.checkTimetableConflicts(data);
        if (conflict.hasConflict) {
            throw new errorHandler_1.AppError(conflict.message || 'Timetable scheduling conflict detected.', 409, conflict.type || 'TIMETABLE_CONFLICT');
        }
        const section = await prisma_1.prisma.section.findUnique({
            where: { id: data.sectionId },
            include: { class: true },
        });
        const departmentId = data.departmentId || section?.class.departmentId || null;
        const entry = await prisma_1.prisma.timetableEntry.create({
            data: {
                academicYearId: data.academicYearId,
                departmentId,
                classId: data.classId,
                sectionId: data.sectionId,
                subjectId: data.subjectId,
                facultyId: data.facultyId,
                roomId: data.roomId,
                timeSlotId: data.timeSlotId,
                dayOfWeek: data.dayOfWeek,
                createdByUserId: actorId,
            },
            include: {
                class: true,
                section: true,
                subject: true,
                room: true,
                timeSlot: true,
                faculty: { include: { user: true } },
            },
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'TIMETABLE_ENTRY_CREATED',
            entityType: 'TimetableEntry',
            entityId: entry.id,
            afterState: entry,
            ipAddress,
        });
        return entry;
    }
    static async updateTimetableEntry(id, data, actorId, ipAddress) {
        const existing = await prisma_1.prisma.timetableEntry.findUnique({ where: { id } });
        if (!existing) {
            throw new errorHandler_1.AppError('Timetable entry not found.', 404, 'TIMETABLE_ENTRY_NOT_FOUND');
        }
        const checkData = {
            academicYearId: existing.academicYearId,
            classId: existing.classId,
            sectionId: existing.sectionId,
            subjectId: data.subjectId || existing.subjectId,
            facultyId: data.facultyId || existing.facultyId,
            roomId: data.roomId || existing.roomId,
            timeSlotId: data.timeSlotId || existing.timeSlotId,
            dayOfWeek: data.dayOfWeek || existing.dayOfWeek,
            excludeEntryId: id,
        };
        const conflict = await this.checkTimetableConflicts(checkData);
        if (conflict.hasConflict) {
            throw new errorHandler_1.AppError(conflict.message || 'Timetable conflict detected.', 409, conflict.type || 'TIMETABLE_CONFLICT');
        }
        const updated = await prisma_1.prisma.timetableEntry.update({
            where: { id },
            data: {
                subjectId: data.subjectId ?? existing.subjectId,
                facultyId: data.facultyId ?? existing.facultyId,
                roomId: data.roomId ?? existing.roomId,
                timeSlotId: data.timeSlotId ?? existing.timeSlotId,
                dayOfWeek: data.dayOfWeek ?? existing.dayOfWeek,
            },
            include: {
                class: true,
                section: true,
                subject: true,
                room: true,
                timeSlot: true,
                faculty: { include: { user: true } },
            },
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'TIMETABLE_ENTRY_UPDATED',
            entityType: 'TimetableEntry',
            entityId: id,
            beforeState: existing,
            afterState: updated,
            ipAddress,
        });
        return updated;
    }
    static async deleteTimetableEntry(id, actorId, ipAddress) {
        const existing = await prisma_1.prisma.timetableEntry.findUnique({ where: { id } });
        if (!existing) {
            throw new errorHandler_1.AppError('Timetable entry not found.', 404, 'TIMETABLE_ENTRY_NOT_FOUND');
        }
        await prisma_1.prisma.timetableEntry.delete({ where: { id } });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'TIMETABLE_ENTRY_DELETED',
            entityType: 'TimetableEntry',
            entityId: id,
            beforeState: existing,
            ipAddress,
        });
        return { message: 'Timetable entry successfully removed.' };
    }
    // ----------------------------------------------------
    // 9. EXTRA / SPECIAL CLASSES
    // ----------------------------------------------------
    static async requestExtraClass(data, actorId, ipAddress) {
        // Check room collision on that date & time
        const existingRoom = await prisma_1.prisma.extraClassRequest.findFirst({
            where: {
                roomId: data.roomId,
                date: data.date,
                startTime: data.startTime,
                status: { in: ['PENDING', 'APPROVED'] },
            },
        });
        if (existingRoom) {
            throw new errorHandler_1.AppError('The selected room is already scheduled for an extra session at this time.', 409, 'ROOM_EXTRA_CLASS_CONFLICT');
        }
        const request = await prisma_1.prisma.extraClassRequest.create({
            data: {
                academicYearId: data.academicYearId,
                classId: data.classId,
                sectionId: data.sectionId,
                subjectId: data.subjectId,
                facultyId: data.facultyId,
                roomId: data.roomId,
                date: data.date,
                timeSlotId: data.timeSlotId || null,
                startTime: data.startTime,
                endTime: data.endTime,
                reason: data.reason,
                status: types_1.ExtraClassStatusEnum.PENDING,
                requestedByUserId: actorId,
            },
            include: {
                class: true,
                section: true,
                subject: true,
                room: true,
                faculty: { include: { user: true } },
            },
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'EXTRA_CLASS_REQUESTED',
            entityType: 'ExtraClassRequest',
            entityId: request.id,
            afterState: request,
            ipAddress,
        });
        return request;
    }
    static async getExtraClassRequests(filters) {
        const where = {};
        if (filters.academicYearId)
            where.academicYearId = filters.academicYearId;
        if (filters.status)
            where.status = filters.status;
        if (filters.facultyId)
            where.facultyId = filters.facultyId;
        if (filters.departmentId) {
            where.faculty = { departmentId: filters.departmentId };
        }
        return prisma_1.prisma.extraClassRequest.findMany({
            where,
            include: {
                class: true,
                section: true,
                subject: true,
                room: true,
                timeSlot: true,
                faculty: { include: { user: true } },
                requestedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async reviewExtraClassRequest(id, action, reviewNotes, actorId, ipAddress) {
        const req = await prisma_1.prisma.extraClassRequest.findUnique({ where: { id } });
        if (!req) {
            throw new errorHandler_1.AppError('Extra class request not found.', 404, 'EXTRA_CLASS_NOT_FOUND');
        }
        const updated = await prisma_1.prisma.extraClassRequest.update({
            where: { id },
            data: {
                status: action,
                reviewedByUserId: actorId || null,
                reviewNotes: reviewNotes || null,
                reviewedAt: new Date(),
            },
            include: {
                class: true,
                section: true,
                subject: true,
                room: true,
                faculty: { include: { user: true } },
            },
        });
        await audit_service_1.AuditService.log({
            userId: actorId || 'SYSTEM',
            action: `EXTRA_CLASS_${action}`,
            entityType: 'ExtraClassRequest',
            entityId: id,
            beforeState: req,
            afterState: updated,
            ipAddress,
        });
        return updated;
    }
    // ----------------------------------------------------
    // 10. SUBSTITUTE FACULTY ASSIGNMENT
    // ----------------------------------------------------
    static async assignSubstituteFaculty(data, actorId, ipAddress) {
        if (data.originalFacultyId === data.substituteFacultyId) {
            throw new errorHandler_1.AppError('Original faculty and substitute faculty cannot be the same person.', 400, 'SAME_FACULTY');
        }
        const substitute = await prisma_1.prisma.faculty.findUnique({
            where: { id: data.substituteFacultyId },
            include: { user: true },
        });
        if (!substitute || substitute.status !== 'ACTIVE') {
            throw new errorHandler_1.AppError('Substitute faculty is invalid or inactive.', 400, 'INVALID_SUBSTITUTE');
        }
        // Check if substitute faculty is teaching another class at that time slot
        const regularTeachingClash = await prisma_1.prisma.timetableEntry.findFirst({
            where: {
                facultyId: data.substituteFacultyId,
                timeSlotId: data.timeSlotId,
                status: 'ACTIVE',
            },
        });
        if (regularTeachingClash) {
            throw new errorHandler_1.AppError(`Substitute faculty is already scheduled to teach another regular lecture at this period.`, 409, 'SUBSTITUTE_TEACHING_CLASH');
        }
        // Check if substitute is already assigned to another substitute lecture on that date & slot
        const existingSub = await prisma_1.prisma.substituteFacultyAssignment.findFirst({
            where: {
                substituteFacultyId: data.substituteFacultyId,
                date: data.date,
                timeSlotId: data.timeSlotId,
                status: 'CONFIRMED',
            },
        });
        if (existingSub) {
            throw new errorHandler_1.AppError('Substitute faculty is already allocated as a substitute for another class at this period.', 409, 'SUBSTITUTE_ALREADY_BOOKED');
        }
        const assignment = await prisma_1.prisma.substituteFacultyAssignment.create({
            data: {
                timetableEntryId: data.timetableEntryId || null,
                originalFacultyId: data.originalFacultyId,
                substituteFacultyId: data.substituteFacultyId,
                date: data.date,
                classId: data.classId,
                sectionId: data.sectionId,
                subjectId: data.subjectId,
                timeSlotId: data.timeSlotId,
                roomId: data.roomId || null,
                reason: data.reason,
                assignedByUserId: actorId,
                status: types_1.SubstituteStatusEnum.CONFIRMED,
            },
            include: {
                originalFaculty: { include: { user: true } },
                substituteFaculty: { include: { user: true } },
                class: true,
                section: true,
                subject: true,
                timeSlot: true,
            },
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'SUBSTITUTE_FACULTY_ASSIGNED',
            entityType: 'SubstituteFacultyAssignment',
            entityId: assignment.id,
            afterState: assignment,
            ipAddress,
        });
        return assignment;
    }
    static async getSubstituteAssignments(filters) {
        const where = {};
        if (filters.date)
            where.date = filters.date;
        if (filters.classId)
            where.classId = filters.classId;
        if (filters.facultyId) {
            where.OR = [
                { originalFacultyId: filters.facultyId },
                { substituteFacultyId: filters.facultyId },
            ];
        }
        return prisma_1.prisma.substituteFacultyAssignment.findMany({
            where,
            include: {
                originalFaculty: { include: { user: true } },
                substituteFaculty: { include: { user: true } },
                class: true,
                section: true,
                subject: true,
                timeSlot: true,
            },
            orderBy: { date: 'desc' },
        });
    }
    // ----------------------------------------------------
    // 11. DASHBOARDS
    // ----------------------------------------------------
    static async getHodDashboard(departmentId, academicYearId) {
        const dept = await prisma_1.prisma.department.findUnique({
            where: { id: departmentId },
            include: {
                hod: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
        if (!dept) {
            throw new errorHandler_1.AppError('Department not found.', 404, 'DEPT_NOT_FOUND');
        }
        // Counts
        const [facultyCount, studentCount, classesCount, subjectsCount] = await Promise.all([
            prisma_1.prisma.faculty.count({ where: { departmentId, status: 'ACTIVE' } }),
            prisma_1.prisma.student.count({ where: { departmentId, status: 'ACTIVE' } }),
            prisma_1.prisma.class.count({ where: { departmentId } }),
            prisma_1.prisma.subject.count({ where: { departmentId, status: 'ACTIVE' } }),
        ]);
        // Faculty members and their leave status
        const facultyMembers = await prisma_1.prisma.faculty.findMany({
            where: { departmentId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        status: true,
                    },
                },
            },
        });
        const activeLeaves = await prisma_1.prisma.facultyLeave.findMany({
            where: {
                status: 'APPROVED',
                user: { facultyProfile: { departmentId } },
            },
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
            },
        });
        const pendingExtraClasses = await prisma_1.prisma.extraClassRequest.findMany({
            where: {
                status: 'PENDING',
                faculty: { departmentId },
            },
            include: {
                class: true,
                section: true,
                subject: true,
                room: true,
                faculty: { include: { user: true } },
            },
        });
        return {
            department: dept,
            stats: {
                facultyCount,
                studentCount,
                classesCount,
                subjectsCount,
                activeLeavesCount: activeLeaves.length,
                pendingExtraClassesCount: pendingExtraClasses.length,
            },
            facultyMembers,
            activeLeaves,
            pendingExtraClasses,
        };
    }
    static async getFacultyAcademicDashboard(userId, academicYearId) {
        const faculty = await prisma_1.prisma.faculty.findUnique({
            where: { userId },
            include: {
                department: true,
                coordinatorHistories: {
                    where: { status: 'ACTIVE' },
                    include: {
                        section: { include: { class: true } },
                    },
                },
            },
        });
        if (!faculty) {
            throw new errorHandler_1.AppError('Faculty profile not found for authenticated user.', 404, 'FACULTY_NOT_FOUND');
        }
        const whereTimetable = {
            facultyId: faculty.id,
            status: 'ACTIVE',
        };
        if (academicYearId)
            whereTimetable.academicYearId = academicYearId;
        const [timetableEntries, subjectAssignments, extraClasses, substituteLectures] = await Promise.all([
            prisma_1.prisma.timetableEntry.findMany({
                where: whereTimetable,
                include: {
                    class: true,
                    section: true,
                    subject: true,
                    room: true,
                    timeSlot: true,
                },
                orderBy: [
                    { dayOfWeek: 'asc' },
                    { timeSlot: { periodNumber: 'asc' } },
                ],
            }),
            prisma_1.prisma.facultySubjectAssignment.findMany({
                where: { facultyId: faculty.id },
                include: {
                    class: true,
                    section: true,
                    subject: true,
                },
            }),
            prisma_1.prisma.extraClassRequest.findMany({
                where: { facultyId: faculty.id },
                include: {
                    class: true,
                    section: true,
                    subject: true,
                    room: true,
                },
                orderBy: { date: 'desc' },
            }),
            prisma_1.prisma.substituteFacultyAssignment.findMany({
                where: { substituteFacultyId: faculty.id },
                include: {
                    originalFaculty: { include: { user: true } },
                    class: true,
                    section: true,
                    subject: true,
                    timeSlot: true,
                },
                orderBy: { date: 'desc' },
            }),
        ]);
        return {
            faculty,
            isCoordinator: faculty.coordinatorHistories.length > 0,
            coordinatedSections: faculty.coordinatorHistories.map((c) => ({
                sectionId: c.sectionId,
                sectionName: c.section.name,
                className: c.section.class.name,
            })),
            subjectAssignments,
            timetableEntries,
            extraClasses,
            substituteLectures,
        };
    }
    // ----------------------------------------------------
    // 12. STUDENTS ADMISSION INTAKE & MANAGEMENT (RETAINED FROM PHASE 3)
    // ----------------------------------------------------
    static async admitStudent(data, actorId, ipAddress) {
        const existingAdm = await prisma_1.prisma.student.findUnique({ where: { admissionNumber: data.admissionNumber } });
        if (existingAdm) {
            throw new errorHandler_1.AppError(`Student with admission number '${data.admissionNumber}' already exists.`, 409, 'ADMISSION_NUM_EXISTS');
        }
        const enrollmentNumber = data.enrollmentNumber || `ENR-${Date.now().toString().slice(-6)}`;
        const existingEnr = await prisma_1.prisma.student.findUnique({ where: { enrollmentNumber } });
        if (existingEnr) {
            throw new errorHandler_1.AppError(`Enrollment number '${enrollmentNumber}' is already in use.`, 409, 'ENROLLMENT_NUM_EXISTS');
        }
        const existingEmail = await prisma_1.prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
        if (existingEmail) {
            throw new errorHandler_1.AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
        }
        const section = await prisma_1.prisma.section.findUnique({
            where: { id: data.sectionId },
            include: { class: true },
        });
        if (!section) {
            throw new errorHandler_1.AppError('Invalid section ID provided.', 404, 'SECTION_NOT_FOUND');
        }
        const departmentId = data.departmentId || section.class.departmentId || null;
        const academicYearId = data.academicYearId || section.class.academicYearId;
        const initialPassword = 'Student@Secure2026!';
        const passwordHash = await (0, password_1.hashPassword)(initialPassword);
        const username = `std_${data.admissionNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        const studentRole = (await prisma_1.prisma.role.findUnique({ where: { name: types_1.UserRoleEnum.PARENT } })) ||
            (await prisma_1.prisma.role.findUnique({ where: { name: types_1.UserRoleEnum.NON_FACULTY } }));
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: data.email.toLowerCase(),
                    username,
                    passwordHash,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone || null,
                    whatsAppNumber: data.whatsAppNumber,
                    altPhone: data.altPhone || null,
                    dob: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                    gender: data.gender || null,
                    address: data.address || null,
                    userCategory: 'STUDENT',
                    status: types_1.UserStatusEnum.ACTIVE,
                },
            });
            if (studentRole) {
                await tx.userRole.create({
                    data: {
                        userId: user.id,
                        roleId: studentRole.id,
                        departmentId,
                        isPrimary: true,
                        assignedBy: actorId,
                    },
                });
            }
            const student = await tx.student.create({
                data: {
                    userId: user.id,
                    admissionNumber: data.admissionNumber,
                    enrollmentNumber,
                    rollNumber: data.rollNumber || null,
                    academicYearId,
                    departmentId,
                    sectionId: data.sectionId,
                    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                    gender: data.gender || null,
                    bloodGroup: data.bloodGroup || null,
                    emergencyContact: data.emergencyContact || null,
                    previousSchool: data.previousSchool || null,
                    previousGrade: data.previousGrade || null,
                    previousScore: data.previousScore || null,
                    photoUrl: data.photoUrl || null,
                    status: types_1.StudentStatusEnum.ACTIVE,
                },
            });
            await tx.guardian.create({
                data: {
                    studentId: student.id,
                    fullName: data.guardian.fullName,
                    relationship: data.guardian.relationship,
                    phone: data.guardian.phone,
                    email: data.guardian.email || null,
                    occupation: data.guardian.occupation || null,
                    address: data.guardian.address || null,
                    isPrimary: true,
                },
            });
            await tx.studentTransferLog.create({
                data: {
                    studentId: student.id,
                    toAcademicYearId: academicYearId,
                    toDepartmentId: departmentId,
                    toClassId: section.classId,
                    toSectionId: section.id,
                    toStatus: types_1.StudentStatusEnum.ACTIVE,
                    transferType: 'PROMOTION',
                    reason: 'Initial enrollment & section allocation.',
                    transferredByUserId: actorId,
                },
            });
            return { user, student };
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'STUDENT_ADMITTED',
            entityType: 'Student',
            entityId: result.student.id,
            afterState: {
                admissionNumber: data.admissionNumber,
                enrollmentNumber,
                sectionId: data.sectionId,
                classId: section.classId,
            },
            ipAddress,
        });
        return result;
    }
    static async getStudents(query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (query.status)
            where.status = query.status;
        if (query.sectionId)
            where.sectionId = query.sectionId;
        if (query.classId)
            where.section = { classId: query.classId };
        if (query.departmentId)
            where.departmentId = query.departmentId;
        if (query.academicYearId)
            where.academicYearId = query.academicYearId;
        if (query.search) {
            const s = query.search.trim();
            const sDigits = s.replace(/[^0-9a-zA-Z]/g, '');
            where.OR = [
                { admissionNumber: { contains: s } },
                { enrollmentNumber: { contains: s } },
                { rollNumber: { contains: s } },
                { user: { firstName: { contains: s } } },
                { user: { lastName: { contains: s } } },
                { user: { email: { contains: s } } },
                { user: { whatsAppNumber: { contains: s } } },
                { user: { phone: { contains: s } } },
                ...(sDigits.length >= 3
                    ? [
                        { user: { whatsAppNumber: { contains: sDigits } } },
                        { user: { phone: { contains: sDigits } } },
                    ]
                    : []),
            ];
        }
        const [students, total] = await Promise.all([
            prisma_1.prisma.student.findMany({
                where,
                skip,
                take: limit,
                orderBy: { admissionNumber: 'asc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            whatsAppNumber: true,
                            address: true,
                        },
                    },
                    academicYear: true,
                    department: true,
                    section: {
                        include: {
                            class: true,
                        },
                    },
                    guardians: true,
                },
            }),
            prisma_1.prisma.student.count({ where }),
        ]);
        return {
            students,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    static async getStudentById(id) {
        const student = await prisma_1.prisma.student.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        whatsAppNumber: true,
                        altPhone: true,
                        address: true,
                        dob: true,
                        gender: true,
                    },
                },
                academicYear: true,
                department: true,
                section: {
                    include: {
                        class: true,
                    },
                },
                guardians: true,
                transferHistory: {
                    orderBy: { effectiveDate: 'desc' },
                },
                documents: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!student) {
            throw new errorHandler_1.AppError('Student record not found.', 404, 'STUDENT_NOT_FOUND');
        }
        const [presentCount, lateCount, absentCount] = await Promise.all([
            prisma_1.prisma.attendance.count({ where: { userId: student.userId, status: 'PRESENT' } }),
            prisma_1.prisma.attendance.count({ where: { userId: student.userId, status: 'LATE' } }),
            prisma_1.prisma.attendance.count({ where: { userId: student.userId, status: 'ABSENT' } }),
        ]);
        return {
            ...student,
            attendanceSummary: {
                present: presentCount,
                late: lateCount,
                absent: absentCount,
                totalMarked: presentCount + lateCount + absentCount,
            },
        };
    }
    static async transferStudent(params) {
        const student = await prisma_1.prisma.student.findUnique({
            where: { id: params.studentId },
            include: { section: true },
        });
        if (!student) {
            throw new errorHandler_1.AppError('Student record not found.', 404, 'STUDENT_NOT_FOUND');
        }
        const newSection = await prisma_1.prisma.section.findUnique({
            where: { id: params.toSectionId },
            include: { class: true },
        });
        if (!newSection) {
            throw new errorHandler_1.AppError('Destination section not found.', 404, 'SECTION_NOT_FOUND');
        }
        const fromSectionId = student.sectionId;
        const fromClassId = student.section?.classId;
        const fromDeptId = student.departmentId;
        const fromYearId = student.academicYearId;
        const toDeptId = params.toDepartmentId || newSection.class.departmentId || null;
        const toYearId = params.toAcademicYearId || newSection.class.academicYearId;
        const updated = await prisma_1.prisma.$transaction(async (tx) => {
            const s = await tx.student.update({
                where: { id: student.id },
                data: {
                    sectionId: newSection.id,
                    departmentId: toDeptId,
                    academicYearId: toYearId,
                    status: types_1.StudentStatusEnum.ACTIVE,
                },
            });
            await tx.studentTransferLog.create({
                data: {
                    studentId: student.id,
                    fromAcademicYearId: fromYearId,
                    toAcademicYearId: toYearId,
                    fromDepartmentId: fromDeptId,
                    toDepartmentId: toDeptId,
                    fromClassId: fromClassId,
                    toClassId: newSection.classId,
                    fromSectionId,
                    toSectionId: newSection.id,
                    fromStatus: student.status,
                    toStatus: types_1.StudentStatusEnum.ACTIVE,
                    transferType: params.transferType || types_1.StudentTransferTypeEnum.SECTION_TRANSFER,
                    reason: params.reason,
                    transferredByUserId: params.actorId,
                },
            });
            return s;
        });
        await audit_service_1.AuditService.log({
            userId: params.actorId,
            action: `STUDENT_${params.transferType || 'TRANSFER'}`,
            entityType: 'Student',
            entityId: student.id,
            beforeState: { sectionId: fromSectionId, classId: fromClassId },
            afterState: { sectionId: newSection.id, classId: newSection.classId },
            ipAddress: params.ipAddress,
        });
        return updated;
    }
    static async updateStudentStatus(params) {
        const validStatuses = Object.values(types_1.StudentStatusEnum);
        if (!validStatuses.includes(params.status)) {
            throw new errorHandler_1.AppError(`Invalid student status: ${params.status}`, 400, 'INVALID_STATUS');
        }
        const student = await prisma_1.prisma.student.findUnique({
            where: { id: params.studentId },
            include: { section: true },
        });
        if (!student) {
            throw new errorHandler_1.AppError('Student not found.', 404, 'STUDENT_NOT_FOUND');
        }
        const oldStatus = student.status;
        const newStatus = params.status;
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.student.update({
                where: { id: student.id },
                data: {
                    status: newStatus,
                    sectionId: newStatus === types_1.StudentStatusEnum.LEFT_INSTITUTION || newStatus === types_1.StudentStatusEnum.GRADUATED
                        ? null
                        : student.sectionId,
                },
            });
            if (newStatus === types_1.StudentStatusEnum.LEFT_INSTITUTION ||
                newStatus === types_1.StudentStatusEnum.INACTIVE ||
                newStatus === types_1.StudentStatusEnum.SUSPENDED) {
                await tx.user.update({
                    where: { id: student.userId },
                    data: { status: types_1.UserStatusEnum.INACTIVE },
                });
            }
            else if (newStatus === types_1.StudentStatusEnum.ACTIVE) {
                await tx.user.update({
                    where: { id: student.userId },
                    data: { status: types_1.UserStatusEnum.ACTIVE },
                });
            }
            await tx.studentTransferLog.create({
                data: {
                    studentId: student.id,
                    fromAcademicYearId: student.academicYearId,
                    toAcademicYearId: student.academicYearId,
                    fromDepartmentId: student.departmentId,
                    toDepartmentId: student.departmentId,
                    fromClassId: student.section?.classId,
                    toClassId: student.section?.classId,
                    fromSectionId: student.sectionId,
                    toSectionId: student.sectionId,
                    fromStatus: oldStatus,
                    toStatus: newStatus,
                    transferType: types_1.StudentTransferTypeEnum.STATUS_CHANGE,
                    reason: params.reason || `Status updated from ${oldStatus} to ${newStatus}`,
                    transferredByUserId: params.actorId,
                },
            });
        });
        await audit_service_1.AuditService.log({
            userId: params.actorId,
            action: 'STUDENT_STATUS_CHANGED',
            entityType: 'Student',
            entityId: student.id,
            beforeState: { status: oldStatus },
            afterState: { status: newStatus, reason: params.reason },
            ipAddress: params.ipAddress,
        });
        return { message: `Student status successfully updated to ${newStatus}.`, status: newStatus };
    }
    static async uploadDocument(params) {
        const student = await prisma_1.prisma.student.findUnique({ where: { id: params.studentId } });
        if (!student) {
            throw new errorHandler_1.AppError('Student not found.', 404, 'STUDENT_NOT_FOUND');
        }
        const doc = await prisma_1.prisma.studentDocument.create({
            data: {
                studentId: params.studentId,
                docType: params.docType,
                title: params.title,
                fileUrl: params.fileUrl,
                fileSize: params.fileSize || null,
                mimeType: params.mimeType || 'application/pdf',
                uploadedByUserId: params.actorId,
            },
        });
        await audit_service_1.AuditService.log({
            userId: params.actorId,
            action: 'STUDENT_DOCUMENT_UPLOADED',
            entityType: 'StudentDocument',
            entityId: doc.id,
            afterState: { docType: params.docType, title: params.title },
            ipAddress: params.ipAddress,
        });
        return doc;
    }
}
exports.AcademicService = AcademicService;
