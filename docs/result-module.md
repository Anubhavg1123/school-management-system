# Centralized Result Calculation Engine & Report Card Module

## Overview
Manages transactional bulk faculty marks entry, HOD verification, centralized result calculation, grade scale lookup, immutable result versioning (`ResultVersion` v1, v2), result publication, Phase 10 parent notifications, and public QR token verification.

---

## 1. Key API Endpoints

### `POST /api/marks/submit-batch`
- **Authorization**: `SUPER_ADMIN`, `HOD`, `FACULTY`
- **Payload**: `{ examinationSubjectId, marks: [{ studentId, obtainedTheoryMarks, obtainedInternalMarks, isAbsent }], isDraft }`
- **Validation**: Enforces $Obtained \le Maximum$ marks range check.

### `POST /api/marks/verify/:subjectId`
- **Authorization**: `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD`
- **Payload**: `{ action: 'VERIFIED' | 'RETURNED_FOR_CORRECTION', reason }`

### `POST /api/results/:examId/calculate`
- **Authorization**: `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD`
- **Description**: Centralized calculation engine computing subject totals, overall %, grade lookup via `GradeScaleRule`, pass/fail evaluation, and immutable result snapshot generation (`v1`, `v2`).

### `POST /api/results/:examId/publish`
- **Authorization**: `SUPER_ADMIN`, `OFFICE_ADMIN`
- **Description**: Marks results as `PUBLISHED` and dispatches Phase 10 In-App & Meta WhatsApp notifications to parents.

### `GET /api/results/verify-token/:token`
- **Authorization**: Public
- **Description**: Verifies authenticity of official report card via QR verification token.
