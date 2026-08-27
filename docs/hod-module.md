# Phase 8 — HOD & Department Management Portal Documentation

## 1. Module Overview
The **HOD & Department Management Portal** provides a complete, department-scoped administrative interface for Head of Department (HOD) roles to manage faculty, students, classes, timetables, attendance, leave applications, extra classes, substitute assignments, and department notices belonging **ONLY to their assigned department**.

---

## 2. Security & Department Isolation Architecture
Strict backend validation is enforced on every request:
1. **Department Isolation Engine**: HOD requests resolve the authenticated user's assigned department (`Department.hodUserId` or `UserRole.departmentId`). Every query and mutation forces `departmentId` matching.
2. **Access Control (403 Forbidden)**: If an HOD attempts to view or modify resources belonging to another department, the backend returns `403 Forbidden` (`Access Denied: You are not authorized to manage resources outside your assigned department.`).
3. **Super Admin / Principal Override**: Super Admin users (`SUPER_ADMIN` or explicitly granted `department.view.all`) can pass an optional `departmentId` parameter to switch context or generate cross-department reports.
4. **No Trust in Frontend Input**: Entity IDs (`departmentId`, `facultyId`, `studentId`, `classId`) supplied by the frontend are explicitly checked for department alignment before executing any operations.

---

## 3. Database Schema Extensions

### 1. `DepartmentNotice`
Stores department-wide notices and announcements.
- `id` (cuid, PK)
- `departmentId` (FK -> Department)
- `createdByUserId` (FK -> User)
- `title` (String), `content` (Text)
- `targetScope` (`DEPARTMENT`, `FACULTY_ONLY`, `STUDENT_ONLY`, `SPECIFIC_CLASS`)
- `classId` (FK -> Class, Optional), `sectionId` (FK -> Section, Optional)

### 2. `Section` WhatsApp Preparation Fields
Extended `Section` model for official communication group configuration:
- `whatsAppGroupId` (String, Optional)
- `whatsAppGroupStatus` (`UNCONFIGURED`, `PENDING_SETUP`, `ACTIVE`, `ARCHIVED`)
- `whatsAppGroupManagedByUserId` (FK -> User, Optional)
- `whatsAppGroupLastSyncAt` (DateTime, Optional)

---

## 4. REST API Endpoints (`/api/hod`)

| Method | Endpoint | Description | Access Control |
|---|---|---|---|
| `GET` | `/api/hod/dashboard` | Real-time department metrics, today's schedule, pending leaves & notices | HOD, SUPER_ADMIN |
| `GET` | `/api/hod/department` | Fetches department profile and HOD assignment history | HOD, SUPER_ADMIN |
| `PUT` | `/api/hod/department` | Updates allowed department description and status | HOD, SUPER_ADMIN |
| `GET` | `/api/hod/faculty` | Department faculty roster with search, filter, pagination | HOD, SUPER_ADMIN |
| `GET` | `/api/hod/faculty/:id` | Detailed academic & workload profile of department faculty | Department Alignment Verified |
| `POST` | `/api/hod/faculty-assignments` | Assigns subject/class/section to department faculty | Department Alignment Verified |
| `GET` | `/api/hod/workload` | Department-wide faculty workload summary | HOD, SUPER_ADMIN |
| `GET` | `/api/hod/classes` | Department class & section list | HOD, SUPER_ADMIN |
| `POST` | `/api/hod/sections/:sectionId/coordinator` | Appoints Class Coordinator with `ClassCoordinatorHistory` tracking | Department Alignment Verified |
| `GET` | `/api/hod/students` | Department student roster with search & attendance % | HOD, SUPER_ADMIN |
| `GET` | `/api/hod/low-attendance` | Department low attendance dashboard (<75% threshold) | HOD, SUPER_ADMIN |
| `GET` | `/api/hod/corrections` | List attendance correction requests | HOD, SUPER_ADMIN |
| `POST` | `/api/hod/corrections/:id/review` | Approve/Reject attendance correction petition | Department Alignment Verified |
| `GET` | `/api/hod/bypasses` | List academic activity bypass requests | HOD, SUPER_ADMIN |
| `POST` | `/api/hod/bypasses/:id/review` | Approve/Reject academic bypass request | Department Alignment Verified |
| `GET` | `/api/hod/leaves` | List faculty leave applications | HOD, SUPER_ADMIN |
| `POST` | `/api/hod/leaves/:id/review` | Approve/Reject faculty leave with automated timetable impact analysis | Department Alignment Verified |
| `POST` | `/api/hod/substitutes` | Assign substitute faculty with 5-way conflict validation | Department Alignment Verified |
| `GET` | `/api/hod/extra-classes` | List extra class requests | HOD, SUPER_ADMIN |
| `POST` | `/api/hod/extra-classes/:id/review` | Approve/Reject extra class request with 4-way conflict check | Department Alignment Verified |
| `GET` | `/api/hod/timetable` | Department weekly timetable grid | HOD, SUPER_ADMIN |
| `POST` | `/api/hod/timetable` | Create department timetable entry with 5-way conflict engine | Department Alignment Verified |
| `POST` | `/api/hod/sections/:sectionId/whatsapp` | Configure section WhatsApp group settings | Department Alignment Verified |
| `GET` | `/api/hod/notices` | List department notices | HOD, SUPER_ADMIN |
| `POST` | `/api/hod/notices` | Broadcast department notice | HOD, SUPER_ADMIN |
| `GET` | `/api/hod/reports` | Export department reports (Faculty, Students, Timetable, Attendance) | HOD, SUPER_ADMIN |

---

## 5. Automated Verification Results
- **Vitest Phase 8 Suite**: `backend/tests/phase8-hod-portal.test.ts` (13/13 tests passing).
- **Full Backend Regression Suite**: 11 test files, 78 integration tests passing (100% pass rate).
- **Frontend Build**: Vite TypeScript compilation completed with 0 errors (`dist/index.html`).
