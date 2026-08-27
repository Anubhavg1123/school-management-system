# Phase 6 — Real-Time Attendance Management System Documentation

## 1. Module Overview

The Real-Time Attendance Management System provides an auditable, role-governed attendance infrastructure for students, faculty, and administrative staff. Key architectural highlights include:

- **Timetable-Synced Attendance Slots**: Automatically generates structured attendance slots (`AttendanceSlot`) from active timetable entries and approved extra classes.
- **Roll Call Finalization & Locking**: Ensures faculty record attendance during assigned class hours, locking finalized sessions against unauthorized retro-editing.
- **Post-Finalization Correction Workflow**: Requires formal petition submission (`StudentAttendanceCorrection`) with HOD/Admin approval to modify finalized records.
- **Academic Activity Bypass**: Exempts students representing the institution in external events (`ACADEMIC_BYPASS`) from negative absenteeism marks.
- **Attendance % & Exam Eligibility Engine**: Automatically computes overall and subject-wise attendance percentages, flagging students below the 75% threshold with shortage warnings.
- **Institutional Staff Check-In Reporting**: Tracks campus check-in/out logs for teaching and non-teaching staff with late minutes and anomaly tracking.

---

## 2. Database Schema Extensions

### Models Added to Prisma Schema (`backend/prisma/schema.prisma`):

1. **`AttendanceSlot`**:
   - Stores session slots for class sections and subjects.
   - Fields: `id`, `academicYearId`, `date`, `classId`, `sectionId`, `subjectId`, `facultyId`, `timeSlotId`, `startTime`, `endTime`, `timetableEntryId`, `extraClassRequestId`, `status` (`SCHEDULED`, `OPEN`, `IN_PROGRESS`, `SUBMITTED`, `FINALIZED`, `CANCELLED`), `source` (`AUTOMATIC`, `MANUAL`, `EXTRA_CLASS`), `submissionDeadline`.

2. **`StudentAttendance`**:
   - Stores individual student attendance entries.
   - Fields: `id`, `attendanceSlotId`, `studentId`, `status` (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`, `ACADEMIC_BYPASS`), `remarks`, `markedByUserId`, `createdAt`, `updatedAt`.

3. **`StudentAttendanceCorrection`**:
   - Manages petition workflow for editing finalized sessions.
   - Fields: `id`, `studentAttendanceId`, `requestedByUserId`, `originalStatus`, `proposedStatus`, `reason`, `status` (`PENDING`, `APPROVED`, `REJECTED`), `reviewedByUserId`, `reviewedAt`, `reviewNotes`.

4. **`AcademicBypassRequest`**:
   - Tracks approved sports/competition academic bypasses.
   - Fields: `id`, `studentId`, `attendanceSlotId`, `date`, `activityName`, `reason`, `status` (`PENDING`, `APPROVED`, `REJECTED`), `requestedByUserId`, `approvedByUserId`.

5. **`AttendanceAnomaly`**:
   - Logs delayed submissions and policy violations.
   - Fields: `id`, `type`, `description`, `entityType`, `entityId`, `userId`, `createdAt`.

---

## 3. REST API Reference

| Endpoint | Method | Role Access | Description |
| :--- | :---: | :--- | :--- |
| `/api/student-attendance/generate-slots` | `POST` | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD`, `FACULTY` | Generates attendance slots from timetable entries. |
| `/api/student-attendance/extra-class-slot` | `POST` | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD`, `FACULTY` | Generates attendance slot for an approved extra class. |
| `/api/student-attendance/slots` | `GET` | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD`, `FACULTY` | Queries attendance slots with date/class/section filters. |
| `/api/student-attendance/slots/:id` | `GET` | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD`, `FACULTY` | Fetches enrolled student roster with status and bypass flags. |
| `/api/student-attendance/submit` | `POST` | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD`, `FACULTY` | Submits roll call draft or finalizes and locks session. |
| `/api/student-attendance/corrections` | `POST` | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD`, `FACULTY` | Requests correction petition for finalized session. |
| `/api/student-attendance/corrections/:id/review` | `POST` | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD` | Reviews (Approve/Reject) attendance correction petition. |
| `/api/student-attendance/bypass` | `POST` | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD`, `FACULTY` | Submits academic activity bypass request. |
| `/api/student-attendance/bypass/:id/review` | `POST` | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD` | Reviews (Approve/Reject) academic bypass request. |
| `/api/student-attendance/student/:studentId` | `GET` | All Roles | Computes student overall & subject % with shortage alerts. |
| `/api/student-attendance/daily-summary` | `GET` | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD` | Daily campus staff check-in summary. |
| `/api/student-attendance/anomalies` | `GET` | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD` | Queries attendance anomaly audit logs. |

---

## 4. Verification & Testing

Executed 10 integration tests in `backend/tests/phase6-attendance-management.test.ts`:
- All 10 tests passed (100% pass rate).
- Full suite verification: 54/54 tests passing across 9 integration test files with zero mocks.
