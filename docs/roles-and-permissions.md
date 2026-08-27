# Roles & Permissions Specification (RBAC / PBAC)

## 1. Role Hierarchy

```
Level 100: SUPER_ADMIN (Principal / Executive Authority)
    │
Level 70:  OFFICE_ADMIN (Academic Office Registrar)
    │
Level 50:  HOD (Head of Academic Department — Scoped to assigned department)
    │
Level 30:  FACULTY (Professor, Lecturer, Teacher)
    │
Level 10:  NON_FACULTY (Campus Staff: Security, Driver, Attender, Maintenance)
    │
Level 05:  PARENT / GUARDIAN (Parent & Guardian Portal)
```

---

## 2. Granular Permissions Breakdown (Dot-Notation)

| Permission Code | Module | Description | Default Roles |
| :--- | :--- | :--- | :--- |
| `users.view` | USERS | View user accounts and rosters | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD`, `FACULTY` |
| `users.create` | USERS | Create pre-approved user accounts directly | `SUPER_ADMIN` |
| `users.edit` | USERS | Modify user profiles and attributes | `SUPER_ADMIN` |
| `users.delete` | USERS | Deactivate or suspend user accounts | `SUPER_ADMIN` |
| `users.approve` | USERS | Approve applicant registration requests | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `users.reject` | USERS | Reject applicant registration requests | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `users.roles.manage` | USERS | Assign or remove roles and department scopes | `SUPER_ADMIN` |
| `users.unlock` | USERS | Unlock locked-out user accounts | `SUPER_ADMIN` |
| `dept.manage` | ACADEMIC | Create and configure academic departments | `SUPER_ADMIN` |
| `academic.manage` | ACADEMIC | Manage academic years, classes, and sections | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `students.view` | ACADEMIC | View student academic profiles and guardian details | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD`, `FACULTY` |
| `students.create` | ACADEMIC | Process student admissions and enrollments | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `students.edit` | ACADEMIC | Update student academic records and sections | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `attendance.view` | ATTENDANCE | View attendance records and metrics | `ALL_AUTHENTICATED` |
| `attendance.create` | ATTENDANCE | Check-in and check-out campus attendance | `ALL_AUTHENTICATED` |
| `attendance.correct` | ATTENDANCE | Submit attendance correction requests | `ALL_AUTHENTICATED` |
| `attendance.approve` | ATTENDANCE | Review and approve attendance corrections | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD` |
| `leave.request` | LEAVE | Submit faculty leave applications | `FACULTY`, `HOD`, `OFFICE_ADMIN` |
| `leave.view` | LEAVE | View faculty leave requests | `SUPER_ADMIN`, `HOD`, `FACULTY` |
| `leave.approve` | LEAVE | Approve or reject faculty leave requests | `SUPER_ADMIN`, `HOD` |
| `fees.view` | FEES | View student fee schedules and transactions | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `fees.create` | FEES | Create fee structures and invoices | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `fees.edit` | FEES | Modify fee ledger and adjustments | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `fees.payment` | FEES | Process fee payments and issue receipts | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `reports.view` | REPORTS | View institutional analytics and reports | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD`, `FACULTY` |
| `reports.export` | REPORTS | Export institutional reports to PDF/Excel | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `notices.create` | NOTICES | Draft institutional bulletins and announcements | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD` |
| `notices.send` | NOTICES | Broadcast notices to faculty and students | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `vehicles.register`| FACILITIES | Register campus vehicles and parking permits | `SUPER_ADMIN`, `NON_FACULTY` |
| `visitors.create` | FACILITIES | Issue visitor campus passes | `SUPER_ADMIN`, `NON_FACULTY` |
| `audit.view` | AUDIT | Inspect system-wide security and audit logs | `SUPER_ADMIN` |
| `settings.manage` | SETTINGS | Configure institution system settings and policies | `SUPER_ADMIN` |

---

## 3. Department Isolation Matrix

* **Cross-Department Protection**: HODs cannot review leave requests, view private records, or edit faculty belonging to other academic departments. Any cross-department administrative attempt results in `403 Forbidden` (`DEPARTMENT_FORBIDDEN`).
* **Role Hierarchy Gate**: Faculty and Non-Faculty roles attempting to trigger administrative endpoints (such as `/api/registrations/pending`, `/api/users/status`, etc.) are intercepted at the gateway level with `403 Forbidden`.
