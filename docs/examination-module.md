# Examination Management & Timetable Scheduling Module

## Overview
The Examination Management Module handles examination lifecycle state transitions (`DRAFT` $\rightarrow$ `PLANNED` $\rightarrow$ `SCHEDULED` $\rightarrow$ `ONGOING` $\rightarrow$ `MARKS_ENTRY` $\rightarrow$ `VERIFICATION` $\rightarrow$ `RESULT_PROCESSING` $\rightarrow$ `APPROVED` $\rightarrow$ `PUBLISHED` $\rightarrow$ `ARCHIVED`), subject paper scheduling with 4-way conflict detection, eligibility resolution, and paper exam attendance roll-calls.

---

## 1. Key API Endpoints

### `POST /api/examinations`
- **Authorization**: `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD`
- **Payload**: `{ name, code, examType, academicYearId, term, startDate, endDate, classIds }`
- **Description**: Creates a new Examination master record in `DRAFT` status.

### `POST /api/examinations/schedule-subject`
- **Authorization**: `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD`
- **Payload**: `{ examinationId, classId, subjectId, maxTheoryMarks, maxPracticalMarks, maxInternalMarks, totalMaxMarks, passingMarks, examDate, startTime, endTime, roomId, invigilatorFacultyId }`
- **Conflict Engine**: Prevents room double-booking, invigilator double-booking, class schedule overlap, and student paper collision.

### `POST /api/examinations/:id/resolve-eligibility`
- **Authorization**: `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD`
- **Description**: Calculates student attendance % from Phase 6 `StudentAttendance` records, compares with `InstitutionSettings.attendanceThresholdPercent`, and assigns eligibility status (`ELIGIBLE`, `CONDITIONALLY_ELIGIBLE`, `NOT_ELIGIBLE`).

### `POST /api/examinations/attendance`
- **Authorization**: `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD`, `FACULTY`
- **Payload**: `{ examinationSubjectId, attendances: [{ studentId, status, seatNumber }] }`
- **Description**: Records paper-wise exam attendance roll-call separate from daily class attendance.
