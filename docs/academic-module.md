# Academic Structure, HOD Management, Faculty Assignment & Timetable Engine

## 1. Overview
The Academic Management and Timetable Module provides an institutional-grade infrastructure for managing academic calendars, departments, subject catalogs, class configurations, faculty teaching assignments, facility rooms, period schedules, extra classes, and substitute lecture coverage.

---

## 2. Relational Schema & Data Architecture

```mermaid
erDiagram
    AcademicYear ||--o{ DepartmentHodHistory : "tracks"
    AcademicYear ||--o{ ClassCoordinatorHistory : "tracks"
    AcademicYear ||--o{ ClassSubject : "maps"
    AcademicYear ||--o{ FacultySubjectAssignment : "allocates"
    AcademicYear ||--o{ TimeSlot : "contains"
    AcademicYear ||--o{ TimetableEntry : "schedules"
    AcademicYear ||--o{ ExtraClassRequest : "approves"

    Department ||--o{ Faculty : "employs"
    Department ||--o{ Subject : "hosts"
    Department ||--o{ DepartmentHodHistory : "leadership"

    Faculty ||--o{ FacultySubjectAssignment : "teaches"
    Faculty ||--o{ FacultyAvailability : "declares"
    Faculty ||--o{ TimetableEntry : "lectures"
    Faculty ||--o{ SubstituteFacultyAssignment : "substitutes"

    Class ||--o{ Section : "subdivides"
    Class ||--o{ ClassSubject : "requires"

    Room ||--o{ TimetableEntry : "hosts"
    TimeSlot ||--o{ TimetableEntry : "slots"
```

### Key Models:
1. **`DepartmentHodHistory`**: Permanent audit record of Head of Department appointments (`startDate`, `endDate`, `status`, `reason`, `assignedByUserId`). Enforces single active HOD per department.
2. **`ClassCoordinatorHistory`**: Tracks designated faculty coordinators for class sections across academic years.
3. **`Subject`**: Catalog with unique code (e.g., `CS101`), name, type (`THEORY`, `PRACTICAL`, `LAB`, `ELECTIVE`), credits, and department mapping.
4. **`ClassSubject`**: Maps required subjects to academic years and classes (`isCompulsory`).
5. **`FacultySubjectAssignment`**: Connects active faculty members to subjects for specific classes/sections.
6. **`Room`**: Institutional facilities (`CLASSROOM`, `LAB`, `COMPUTER_LAB`, `SEMINAR_HALL`, `AUDITORIUM`) with capacity and equipment specifications.
7. **`TimeSlot`**: Standardized period grids (`periodNumber`, `startTime`, `endTime`, `isBreak`, `dayOfWeek`).
8. **`FacultyAvailability`**: Per-day and per-period faculty availability declarations with reasons for unavailability.
9. **`TimetableEntry`**: Multi-dimensional period assignments with database-level unique constraints preventing duplicates.
10. **`ExtraClassRequest`**: Remedial/special class booking workflow with HOD approval lifecycle (`PENDING` -> `APPROVED` / `REJECTED`).
11. **`SubstituteFacultyAssignment`**: Temporary lecture substitution when original faculty is on leave or unavailable.

---

## 3. Mandatory 5-Way Timetable Conflict Engine

Every schedule creation and modification is validated on the backend by `AcademicService.checkTimetableConflicts`:

| Check | Conflict Code | HTTP Status | Rule Description |
| :--- | :---: | :---: | :--- |
| **1. Faculty Overlap** | `FACULTY_CONFLICT` | `409 Conflict` | Rejects scheduling if the faculty member is already teaching another section/class during the selected time slot. |
| **2. Room Collision** | `ROOM_CONFLICT` | `409 Conflict` | Rejects scheduling if the physical classroom/lab is already occupied by another class during the slot. |
| **3. Section Collision** | `SECTION_CONFLICT` | `409 Conflict` | Rejects scheduling if the class section already has another subject scheduled during the slot. |
| **4. Break Slot Collision** | `BREAK_SLOT` | `409 Conflict` | Rejects scheduling academic periods during institutional break times (e.g., Morning Break, Lunch). |
| **5. Availability Violation** | `AVAILABILITY_CONFLICT` | `409 Conflict` | Rejects scheduling if the faculty member has logged unavailable for that day or period. |

---

## 4. API Endpoints

### Academic Years & Departments
- `GET /api/academic/years` - List academic years
- `POST /api/academic/years` - Create academic year
- `POST /api/academic/years/:id/set-current` - Set active year
- `GET /api/academic/departments` - List departments with faculty & class counters
- `POST /api/academic/departments` - Create department
- `POST /api/academic/departments/:id/hod` - Appoint active HOD with audit reason
- `GET /api/academic/departments/:id` - Fetch department details with HOD tenure timeline

### Classes, Sections & Coordinators
- `GET /api/academic/classes` - List institutional classes
- `POST /api/academic/classes` - Create class
- `GET /api/academic/sections` - List sections
- `POST /api/academic/sections` - Create section
- `POST /api/academic/sections/:id/coordinator` - Assign faculty coordinator

### Subjects & Faculty Allocations
- `GET /api/academic/subjects` - List course catalog
- `POST /api/academic/subjects` - Create subject
- `POST /api/academic/classes/:id/subjects` - Map subjects to class
- `GET /api/academic/classes/:id/subjects` - Get class subjects
- `GET /api/academic/faculty-assignments` - List faculty subject allocations
- `POST /api/academic/faculty-assignments` - Assign faculty to subject/class/section
- `DELETE /api/academic/faculty-assignments/:id` - Remove assignment

### Rooms & Time Slots
- `GET /api/academic/rooms` - List rooms & facilities
- `POST /api/academic/rooms` - Create room
- `GET /api/academic/time-slots` - List period slots for academic year
- `POST /api/academic/time-slots` - Create individual time slot
- `POST /api/academic/time-slots/generate-defaults` - Generate standard 8-period weekly grid

### Timetable & Conflicts
- `GET /api/academic/timetable` - Query timetable entries with multi-filter (class, section, faculty, room, day)
- `POST /api/academic/timetable/check-conflict` - Pre-flight 5-way conflict check
- `POST /api/academic/timetable` - Create timetable entry (guarded by 5-way conflict engine)
- `DELETE /api/academic/timetable/:id` - Remove timetable entry

### Extra Classes & Substitutes
- `GET /api/academic/extra-classes` - List special class requests
- `POST /api/academic/extra-classes` - Request extra class session
- `POST /api/academic/extra-classes/:id/review` - HOD approval/rejection
- `GET /api/academic/substitutes` - List substitute lectures
- `POST /api/academic/substitutes` - Assign substitute teacher with clash verification

### Dashboards
- `GET /api/academic/hod/dashboard/:departmentId` - Department command center metrics & pending reviews
- `GET /api/academic/faculty/dashboard` - Faculty personal timetable, course allocations & substitute duties

---

## 5. Role-Based Access Control (RBAC)

| Role | Department & HOD Management | Subject Catalog | Timetable Scheduling | Extra Class Request | Extra Class Approval | Substitute Assignment | View Timetable |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | Full | Full | Full | Yes | Yes | Yes | All Views |
| **Office Admin** | Read / Create | Full | Full | Yes | Yes | Yes | All Views |
| **HOD** | Dept Scoped | Dept Scoped | Dept Scoped | Yes | Dept Scoped | Dept Scoped | All Views |
| **Faculty** | Read Only | Read Only | Read Only | Yes (Own) | No | No | Own + Section |
| **Non-Faculty** | Forbidden | Forbidden | Forbidden | Forbidden | Forbidden | Forbidden | Read Only |
