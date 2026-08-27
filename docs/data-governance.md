# Data Governance & Audited Correction Center Guide

## Principle of Immutability
Core academic records (grades, marks, finalized attendances, fee transactions) cannot be modified directly via standard CRUD operations.

## Two-Phase Correction Workflow
1. **Correction Request Creation**:
   - Authorized faculty or office staff submit a `DataCorrectionRequest` specifying `entityType` (`STUDENT_DOB`, `STUDENT_NAME`, `ATTENDANCE_CORRECTION`), `oldValue`, `newValue`, and mandatory `reason`.
2. **Super Admin Review & Execution**:
   - Super Administrator (Principal) evaluates the request.
   - Upon explicit `APPROVED` status, the system updates the underlying entity atomically and marks `executedAt: new Date()`.
   - If rejected, the mandatory `rejectionReason` is recorded.
