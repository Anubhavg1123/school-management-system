# Phase 7 — Faculty Portal & Class Management Documentation

## 1. Module Overview
The **Faculty Portal & Class Management Module** provides a comprehensive, role-scoped, production-grade interface for faculty members to manage assigned courses, view student rosters, publish course assignments, broadcast class announcements, submit leave applications, request extra/remedial classes, register campus vehicles, and monitor teaching workload.

---

## 2. Security & RBAC Control Flow
Strict backend validation is enforced on every request:
1. **Authentication & Role Authorization**: All endpoints require an active JWT session and one of `FACULTY`, `HOD`, or `SUPER_ADMIN` roles (`requireAuth`, `requireRoles`).
2. **Access Control**: Faculty cannot view unassigned class sections or unassigned student profiles. Attempting to query an unassigned section returns `403 Forbidden`.
3. **Assignment Ownership**: Faculty can only create and publish assignments for class sections where they are assigned as active subject teachers or class coordinators.
4. **Administrative Oversight**: Vehicle registration approvals require `SUPER_ADMIN` or `OFFICE_ADMIN` permissions.

---

## 3. Database Schema Extensions

### 1. `Assignment`
Represents coursework tasks assigned by faculty to specific class sections.
- `id` (cuid, PK)
- `academicYearId` (FK -> AcademicYear)
- `classId` (FK -> Class)
- `sectionId` (FK -> Section)
- `subjectId` (FK -> Subject)
- `facultyId` (FK -> Faculty)
- `title` (String), `description` (Text), `dueDate` (DateTime)
- `status` (`DRAFT`, `PUBLISHED`, `CLOSED`, `ARCHIVED`)

### 2. `AssignmentAttachment`
Stores reference materials and documents attached to assignments.
- `id` (cuid, PK)
- `assignmentId` (FK -> Assignment)
- `title` (String), `fileUrl` (String), `fileSize` (Int), `mimeType` (String)

### 3. `AssignmentTarget`
Tracks student submission and grading status per assignment.
- `id` (cuid, PK)
- `assignmentId` (FK -> Assignment)
- `studentId` (FK -> Student)
- `status` (`PENDING`, `SUBMITTED`, `GRADED`)

### 4. `FacultyVehicleRegistration`
Campus parking registration for faculty vehicles.
- `id` (cuid, PK)
- `userId` (FK -> User)
- `vehicleNumber` (String, Unique)
- `vehicleType` (`TWO_WHEELER`, `FOUR_WHEELER`, `BICYCLE`, `OTHER`)
- `status` (`PENDING`, `APPROVED`, `REJECTED`, `INACTIVE`)

### 5. `ClassAnnouncement`
Broadcast notices for class sections.
- `id` (cuid, PK)
- `classId` (FK -> Class), `sectionId` (FK -> Section)
- `facultyId` (FK -> Faculty)
- `title` (String), `content` (Text)
- `category` (`ACADEMIC`, `ASSIGNMENT_REMINDER`, `EXAM_REMINDER`, `ROOM_CHANGE`, `GENERAL`)

### 6. `NotificationEvent`
System event queue for external dispatch (e.g. WhatsApp / Parent SMS).
- `id` (cuid, PK)
- `eventType` (`ASSIGNMENT_PUBLISHED`, `LEAVE_STATUS_CHANGED`, `EXTRA_CLASS_STATUS_CHANGED`, `VEHICLE_STATUS_CHANGED`, `CLASS_ANNOUNCEMENT`)
- `payload` (JSON String)
- `status` (`PENDING`, `DISPATCHED`, `FAILED`)

---

## 4. REST API Endpoints (`/api/faculty`)

| Method | Endpoint | Description | Access Control |
|---|---|---|---|
| `GET` | `/api/faculty/dashboard` | Aggregates real-time faculty metrics, today's schedule, pending leaves & announcements | FACULTY, HOD, SUPER_ADMIN |
| `GET` | `/api/faculty/profile` | Fetches complete faculty profile details | FACULTY, HOD, SUPER_ADMIN |
| `PUT` | `/api/faculty/profile` | Updates self-editable contact details (phone, address, emergency contact) | FACULTY, HOD, SUPER_ADMIN |
| `GET` | `/api/faculty/classes` | Returns assigned subject courses and coordinated sections | FACULTY, HOD, SUPER_ADMIN |
| `GET` | `/api/faculty/classes/:sectionId/students` | Returns student roster with roll numbers and attendance % | Faculty Section Assignment Verified |
| `GET` | `/api/faculty/students/:studentId` | Returns restricted student profile & attendance stats | Faculty Section Assignment Verified |
| `GET` | `/api/faculty/timetable` | Returns weekly timetable grid & substitute lectures | FACULTY, HOD, SUPER_ADMIN |
| `POST` | `/api/faculty/assignments` | Creates a new DRAFT assignment | Faculty Section Assignment Verified |
| `GET` | `/api/faculty/assignments` | Fetches faculty's assignments | FACULTY, HOD, SUPER_ADMIN |
| `POST` | `/api/faculty/assignments/:id/publish` | Transitions assignment to `PUBLISHED` & populates student targets | Assignment Owner Verified |
| `POST` | `/api/faculty/leave` | Submits a faculty leave application | FACULTY, HOD, SUPER_ADMIN |
| `GET` | `/api/faculty/leave` | Fetches faculty leave history | FACULTY, HOD, SUPER_ADMIN |
| `POST` | `/api/faculty/extra-classes` | Submits extra class request with conflict validation | Faculty Section Assignment Verified |
| `GET` | `/api/faculty/extra-classes` | Fetches faculty extra class requests | FACULTY, HOD, SUPER_ADMIN |
| `POST` | `/api/faculty/vehicles` | Registers a faculty vehicle | FACULTY, HOD, SUPER_ADMIN |
| `GET` | `/api/faculty/vehicles` | Fetches registered vehicles | FACULTY, HOD, SUPER_ADMIN |
| `POST` | `/api/faculty/vehicles/:id/review` | Administrative review (`APPROVED`/`REJECTED`) | SUPER_ADMIN, OFFICE_ADMIN |
| `POST` | `/api/faculty/announcements` | Posts class notice for section | Faculty Section Assignment Verified |
| `GET` | `/api/faculty/announcements` | Fetches posted announcements | FACULTY, HOD, SUPER_ADMIN |
| `GET` | `/api/faculty/workload` | Calculates actual teaching workload metrics | FACULTY, HOD, SUPER_ADMIN |

---

## 5. Automated Verification Results
- **Vitest Integration Suite**: `backend/tests/phase7-faculty-portal.test.ts` (11/11 tests passing).
- **Full Backend Regression Suite**: 10 test files, 65 integration tests passing (100% pass rate).
- **Frontend Build**: Vite TypeScript compilation completed with 0 errors (`dist/index.html`).
