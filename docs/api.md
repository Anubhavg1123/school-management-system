# REST API Specifications (Phase 3 Expanded)

All endpoints return a standardized JSON envelope:
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 1. Authentication & IAM (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Submit public applicant registration | Public |
| `POST` | `/api/auth/login` | Role-validated authentication with lockout defense | Public |
| `POST` | `/api/auth/refresh` | Rotate refresh token & issue new access token | Public |
| `POST` | `/api/auth/logout` | Revoke active device refresh token | Bearer Token |
| `POST` | `/api/auth/logout-all` | Revoke all active sessions across all devices | Bearer Token |
| `GET` | `/api/auth/me` | Current authenticated session, roles & permissions | Bearer Token |
| `POST` | `/api/auth/change-password` | Update account password and invalidate prior sessions | Bearer Token |

---

## 2. Students & Academic Registry (`/api/academic`)

| Method | Endpoint | Description | Roles Allowed |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/academic/students` | Search and list students with pagination & filters | Authenticated Staff |
| `GET` | `/api/academic/students/:id` | Retrieve comprehensive multi-tab student profile | Authenticated Staff |
| `POST` | `/api/academic/students/admit` | Process complete student admission intake | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `POST` | `/api/academic/students/:id/transfer` | Execute class, section, or department transfer / promotion | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `PATCH`| `/api/academic/students/:id/status` | Update student status (`ACTIVE`, `LEFT_INSTITUTION`, etc.) | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `POST` | `/api/academic/students/:id/documents` | Attach student identification / certificate document | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `GET` | `/api/academic/departments` | List all academic departments | Authenticated |
| `POST` | `/api/academic/departments` | Create academic department | `SUPER_ADMIN` |
| `GET` | `/api/academic/classes` | List classes and allocated sections | Authenticated |
| `POST` | `/api/academic/classes` | Create class | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `POST` | `/api/academic/sections` | Create section with seat capacity | `SUPER_ADMIN`, `OFFICE_ADMIN` |

---

## 3. Institutional Analytics & Reports (`/api/reports`)

| Method | Endpoint | Description | Roles Allowed |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/students/roster` | Filtered student roster (supports `?format=csv`) | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD`, `FACULTY` |
| `GET` | `/api/reports/classes` | Class-wise capacity, enrollment & utilization % | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD`, `FACULTY` |
| `GET` | `/api/reports/departments` | Department-wise enrollment & faculty strength | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD` |
| `GET` | `/api/reports/transfers` | Chronological student transfer and status audit log | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD` |
| `GET` | `/api/reports/admissions` | Monthly admission statistics and recent intake log | `SUPER_ADMIN`, `OFFICE_ADMIN` |

---

## 4. Attendance & Leaves (`/api/attendance`, `/api/leave`)

| Method | Endpoint | Description | Roles Allowed |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/attendance/check-in` | Record campus arrival punch (verifies active student status) | Authenticated |
| `POST` | `/api/attendance/check-out` | Record departure punch | Authenticated |
| `GET` | `/api/attendance/records` | Query campus attendance records | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD` |
| `POST` | `/api/leave/request` | Submit faculty leave application | Authenticated Staff |
| `GET` | `/api/leave/pending` | List pending leaves (department-scoped for HOD) | `SUPER_ADMIN`, `HOD` |
| `POST` | `/api/leave/:id/review` | Approve/reject leave petition | `SUPER_ADMIN`, `HOD` (Dept Scoped) |

---

## 5. Financial & Student Fee Management (`/api/fees`)

| Method | Endpoint | Description | Roles Allowed |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/fees/categories` | List configurable fee categories | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `POST` | `/api/fees/categories` | Create new fee category | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `GET` | `/api/fees/structures` | Query academic fee structures with category itemizations | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `GET` | `/api/fees/structures/:id` | Get fee structure details | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `POST` | `/api/fees/structures` | Create itemized fee structure | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `POST` | `/api/fees/assign` | Assign fee structure to student and generate installments | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `GET` | `/api/fees/assignments` | Query student fee assignments | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `POST` | `/api/fees/discount` | Apply fixed/percentage scholarship, waiver or concession | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `POST` | `/api/fees/pay` | Collect fee payment, settle installments, generate receipt | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `POST` | `/api/fees/refund` | Process payment refund and reopen installment balances | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `GET` | `/api/fees/student/:studentId` | Full student financial profile, installments, receipts | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `GET` | `/api/fees/dashboard` | Executive financial summary (Total assigned, collected, outstanding, overdue) | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| `GET` | `/api/fees/reports/outstanding` | Outstanding balances and aging report (supports `?format=csv`) | `SUPER_ADMIN`, `OFFICE_ADMIN` |

