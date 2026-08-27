# Portal Security, Isolation & Permissions Specification

## Overview
Defines server-side authorization enforcement rules, cross-student data isolation policies, draft result protection, and guardian-ward relationship validation across all application endpoints.

---

## 1. Ownership & Security Policies

1. **Strict Cross-Student Isolation**:
   - Students can only view their own dashboard, timetable, attendance, assignments, and results.
   - Any attempt by Student A to request data belonging to Student B returns `HTTP 403 Forbidden` (`STUDENT_ACCESS_DENIED`).

2. **Server-Side Guardian-Ward Verification**:
   - Guardians can only access data for wards linked via `GuardianStudentRelationship` or verified contact details.
   - Changing `studentId` in request parameters to an unlinked student returns `HTTP 403 Forbidden` (`GUARDIAN_WARD_ACCESS_DENIED`).

3. **Draft Result Protection**:
   - Results in `DRAFT`, `CALCULATED`, or `VERIFIED` status are strictly hidden from students and guardians.
   - Only `PUBLISHED` results generate report card views and notification dispatches.

4. **Account & Student Lifecycle Enforcement**:
   - If user status is `SUSPENDED` or `INACTIVE`, portal access is blocked with `HTTP 403 Forbidden` (`ACCOUNT_INACTIVE`).
   - If student status is `LEFT_INSTITUTION`, active portal login is disabled (`STUDENT_LEFT_INSTITUTION`) while historical data remains preserved.
