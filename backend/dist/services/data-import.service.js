"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataImportService = void 0;
const prisma_1 = require("../prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const audit_service_1 = require("./audit.service");
class DataImportService {
    /**
     * Parse CSV text into rows
     */
    static parseCSV(csvText) {
        const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim());
        if (lines.length < 2)
            throw new errorHandler_1.AppError('CSV must have a header row and at least one data row.', 400, 'INVALID_CSV');
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map((v) => v.trim());
            const row = {};
            headers.forEach((h, idx) => {
                row[h] = values[idx] || '';
            });
            rows.push(row);
        }
        return rows;
    }
    /**
     * Preview Student Import — validates rows and creates a DataImportLog
     */
    static async previewStudentImport(csvText, filename, uploadedByUserId) {
        const rows = this.parseCSV(csvText);
        const REQUIRED_FIELDS = ['first_name', 'last_name', 'email', 'admission_number', 'gender', 'date_of_birth'];
        const previewRows = [];
        let validCount = 0;
        let invalidCount = 0;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const errors = [];
            // Required field checks
            for (const field of REQUIRED_FIELDS) {
                if (!row[field] || row[field].trim() === '') {
                    errors.push(`Missing required field: ${field}`);
                }
            }
            // Email format check
            if (row['email'] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row['email'])) {
                errors.push('Invalid email format');
            }
            // Admission number uniqueness check (only for valid emails)
            if (row['admission_number'] && errors.length === 0) {
                const exists = await prisma_1.prisma.student.findFirst({
                    where: { admissionNumber: row['admission_number'] },
                });
                if (exists) {
                    errors.push(`Admission number '${row['admission_number']}' already exists in the system`);
                }
                // Check for duplicate within upload batch
                const dupInBatch = previewRows.find((r) => r.data['admission_number'] === row['admission_number'] && r.status === 'VALID');
                if (dupInBatch) {
                    errors.push(`Admission number '${row['admission_number']}' appears multiple times in this file`);
                }
            }
            // Email uniqueness check
            if (row['email'] && errors.length === 0) {
                const emailExists = await prisma_1.prisma.user.findFirst({ where: { email: row['email'] } });
                if (emailExists) {
                    errors.push(`Email '${row['email']}' is already registered in the system`);
                }
            }
            // Gender check
            if (row['gender'] && !['MALE', 'FEMALE', 'OTHER'].includes(row['gender'].toUpperCase())) {
                errors.push(`Invalid gender. Use: MALE, FEMALE, OTHER`);
            }
            // Date of birth format check
            if (row['date_of_birth'] && isNaN(Date.parse(row['date_of_birth']))) {
                errors.push(`Invalid date_of_birth format. Use: YYYY-MM-DD`);
            }
            if (errors.length === 0) {
                validCount++;
            }
            else {
                invalidCount++;
            }
            previewRows.push({
                rowIndex: i + 2, // 1-indexed, +1 for header
                data: row,
                status: errors.length === 0 ? 'VALID' : 'ERROR',
                errors,
            });
        }
        // Save import log
        const importLog = await prisma_1.prisma.dataImportLog.create({
            data: {
                importType: 'STUDENTS',
                filename,
                uploadedByUserId,
                totalRows: rows.length,
                successRows: 0,
                failedRows: invalidCount,
                status: 'PREVIEW',
                rows: {
                    create: previewRows.map((r) => ({
                        rowIndex: r.rowIndex,
                        rowData: JSON.stringify(r.data),
                        status: r.status === 'VALID' ? 'PENDING' : 'FAILED',
                        errorMessage: r.errors.length > 0 ? r.errors.join('; ') : null,
                    })),
                },
            },
        });
        return {
            importLogId: importLog.id,
            importType: 'STUDENTS',
            filename,
            totalRows: rows.length,
            validRows: validCount,
            invalidRows: invalidCount,
            preview: previewRows.slice(0, 50), // Return first 50 rows in preview
        };
    }
    /**
     * Confirm Student Import — processes only valid rows transactionally
     */
    static async confirmStudentImport(importLogId, confirmedByUserId, defaultAcademicYearId) {
        const importLog = await prisma_1.prisma.dataImportLog.findUnique({
            where: { id: importLogId },
            include: { rows: { where: { status: 'PENDING' } } },
        });
        if (!importLog)
            throw new errorHandler_1.AppError('Import log not found.', 404, 'IMPORT_LOG_NOT_FOUND');
        if (importLog.status !== 'PREVIEW') {
            throw new errorHandler_1.AppError('Import has already been confirmed or is in an invalid state.', 400, 'IMPORT_ALREADY_PROCESSED');
        }
        if (importLog.uploadedByUserId !== confirmedByUserId) {
            throw new errorHandler_1.AppError('Only the original uploader can confirm this import.', 403, 'FORBIDDEN');
        }
        const pendingRows = importLog.rows;
        if (pendingRows.length === 0) {
            await prisma_1.prisma.dataImportLog.update({
                where: { id: importLogId },
                data: { status: 'FAILED', errorSummary: 'No valid rows to import.' },
            });
            throw new errorHandler_1.AppError('No valid rows to import.', 400, 'NO_VALID_ROWS');
        }
        // Get active academic year (or use provided)
        let academicYearId = defaultAcademicYearId;
        if (!academicYearId) {
            const activeYear = await prisma_1.prisma.academicYear.findFirst({ where: { isCurrent: true } });
            if (!activeYear)
                throw new errorHandler_1.AppError('No active academic year found. Please set one before importing.', 400, 'NO_ACTIVE_ACADEMIC_YEAR');
            academicYearId = activeYear.id;
        }
        let successCount = 0;
        let failedCount = 0;
        const rowResults = [];
        for (const row of pendingRows) {
            const data = JSON.parse(row.rowData);
            try {
                await prisma_1.prisma.$transaction(async (tx) => {
                    // Create User account
                    const username = (data['email'].split('@')[0] + Math.floor(Math.random() * 1000)).toLowerCase();
                    const user = await tx.user.create({
                        data: {
                            email: data['email'].toLowerCase(),
                            username,
                            firstName: data['first_name'],
                            lastName: data['last_name'],
                            phone: data['phone'] || null,
                            whatsAppNumber: data['whatsapp_number'] || null,
                            passwordHash: '$2b$12$placeholder_import_hash', // Placeholder — user must reset via email
                            status: 'ACTIVE',
                            userCategory: 'STUDENT',
                        },
                    });
                    // Create Student record
                    await tx.student.create({
                        data: {
                            userId: user.id,
                            admissionNumber: data['admission_number'],
                            academicYearId,
                            gender: data['gender'].toUpperCase(),
                            dateOfBirth: data['date_of_birth'] ? new Date(data['date_of_birth']) : new Date('2000-01-01'),
                            admissionDate: data['admission_date'] ? new Date(data['admission_date']) : new Date(),
                            status: 'ACTIVE',
                        },
                    });
                    successCount++;
                });
                rowResults.push({ rowId: row.id, status: 'SUCCESS' });
            }
            catch (err) {
                failedCount++;
                rowResults.push({ rowId: row.id, status: 'FAILED', error: err.message });
            }
            // Update row status
            await prisma_1.prisma.dataImportRow.update({
                where: { id: row.id },
                data: {
                    status: rowResults[rowResults.length - 1].status,
                    errorMessage: rowResults[rowResults.length - 1].error || null,
                },
            });
        }
        const finalStatus = failedCount === 0 ? 'CONFIRMED' : 'PARTIALLY_IMPORTED';
        await prisma_1.prisma.dataImportLog.update({
            where: { id: importLogId },
            data: {
                status: finalStatus,
                successRows: successCount,
                failedRows: failedCount + importLog.failedRows,
                errorSummary: failedCount > 0 ? `${failedCount} rows failed during import.` : null,
            },
        });
        await audit_service_1.AuditService.log({
            userId: confirmedByUserId,
            action: 'DATA_IMPORT_CONFIRMED',
            entityType: 'DataImportLog',
            entityId: importLogId,
            afterState: { successRows: successCount, failedRows: failedCount, status: finalStatus },
        });
        return {
            importLogId,
            status: finalStatus,
            totalProcessed: pendingRows.length,
            successRows: successCount,
            failedRows: failedCount,
        };
    }
    /**
     * Get import history
     */
    static async getImportLogs(uploadedByUserId, limit = 50) {
        const where = {};
        if (uploadedByUserId)
            where.uploadedByUserId = uploadedByUserId;
        const logs = await prisma_1.prisma.dataImportLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                uploadedBy: { select: { firstName: true, lastName: true, email: true } },
                _count: { select: { rows: true } },
            },
        });
        return logs.map((l) => ({
            id: l.id,
            importType: l.importType,
            filename: l.filename,
            status: l.status,
            totalRows: l.totalRows,
            successRows: l.successRows,
            failedRows: l.failedRows,
            skippedRows: l.skippedRows,
            errorSummary: l.errorSummary,
            uploadedBy: l.uploadedBy ? `${l.uploadedBy.firstName} ${l.uploadedBy.lastName}` : 'Unknown',
            createdAt: l.createdAt.toISOString(),
        }));
    }
}
exports.DataImportService = DataImportService;
