# Complete Institutional System Architecture & Topology

## 1. Executive Summary & Architecture Overview

The **St. Lawrence School & College Management System** is a unified, multi-tier, real-time enterprise management platform designed for educational institutions. The application is built entirely with real business logic, relational integrity constraints, RBAC-driven access boundaries, cryptographic authentication, and end-to-end audit logging.

```
+-----------------------------------------------------------------------------------+
|                              PRESENTATION LAYER (SPA)                             |
|  React 18 + TypeScript + Vite + TailwindCSS + Lucide Icons + React Router DOM v6  |
|  10 Context Portals: Principal, Office, HOD, Faculty, Staff, Student, Guardian    |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / REST / JWT
                                           v
+-----------------------------------------------------------------------------------+
|                             APPLICATION & API LAYER                               |
|  Node.js + Express + TypeScript + Zod Validation + Helmet + Rate Limiter + CORS   |
|  - Correlation Middleware (X-Request-Id)                                          |
|  - Role-Based Access Control (RBAC) & Dynamic Portal Gates                        |
|  - Multi-Factor Authentication (RFC 6238 TOTP Engine)                             |
+------------------------------------------+----------------------------------------+
                                           | Prisma Client ORM
                                           v
+-----------------------------------------------------------------------------------+
|                              DATA PERSISTENCE LAYER                               |
|  SQLite (Dev/Staging) / PostgreSQL (Prod) via Prisma ORM                          |
|  2,371 Lines Schema / 45 Relational Models / Foreign Keys / Cascades / Indexes    |
+-----------------------------------------------------------------------------------+
```

---

## 2. Subsystem Interaction Matrix

| Subsystem | Upstream Dependencies | Downstream Consumers | Primary Role Gates |
|:---|:---|:---|:---|
| **Identity & Access (IAM)** | User, Role, UserRole, Permission | All Portals, Audit Logger, MFA | `SUPER_ADMIN`, `OFFICE_ADMIN` |
| **Academic Structure** | AcademicYear, Department, Class, Section, Subject | Timetable, Attendance, Examinations | `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD` |
| **Student Lifecycle** | Academic Structure, User Accounts, Guardians | Attendance, Fees, Results, Portals | `OFFICE_ADMIN`, `SUPER_ADMIN` |
| **Faculty Operations** | Department, Faculty Assignments, Timetable | Roll Call, Marks Entry, Leave Requests | `FACULTY`, `HOD`, `SUPER_ADMIN` |
| **Attendance Engine** | AttendanceSlot, TimetableEntry, ExtraClass | Student Portal, Parent Portal, Reports | `FACULTY`, `HOD`, `SUPER_ADMIN` |
| **Examination Engine** | AcademicYear, Class, Subject, Student Enrollment | Marks Entry, Result Snapshots, Reports | `FACULTY`, `HOD`, `SUPER_ADMIN` |
| **Financial Ledger** | FeeStructure, StudentFeeAssignment, Installments | Payment, Receipts, Reports, Reconciliation | `OFFICE_ADMIN`, `SUPER_ADMIN` |
| **Notification Engine** | NotificationEventLog, NotificationDelivery | In-App Feed, WhatsApp Webhook, Email/SMS | Automated / Event-driven |
| **Campus Operations** | Vehicle, Visitor, VisitorEntryExit, Security | Security Portal, Fleet Hub, Reports | `SECURITY`, `DRIVER`, `ATTENDER` |
| **Support Helpdesk** | User, SupportTicket, SupportTicketComment | All Portals, Central Helpdesk | All Authenticated Roles |
| **Data Ingestion Hub** | DataImportLog, DataImportRow, Transaction Engine | User, Student, AuditLog | `SUPER_ADMIN`, `OFFICE_ADMIN` |

---

## 3. Security & Cryptographic Controls

1. **Authentication:**
   - Stateless JWT tokens (access token: 15-min TTL, refresh token: 7-day TTL).
   - Password hashing via BCrypt (work factor 12).
   - Account lockout enforcement (5 failed attempts -> 15-minute cooldown).
2. **Multi-Factor Authentication (MFA):**
   - RFC 6238 TOTP engine with SHA-1, 6-digit tokens, and 30-second time-step windows.
   - 8 single-use cryptographically random backup recovery codes.
3. **HTTP Security Headers:**
   - Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), X-Content-Type-Options: nosniff, X-Frame-Options: DENY.
4. **Data Integrity & Immutability:**
   - Result snapshots (`StudentResultSnapshot`) and Payment records are cryptographically verified and immutable post-publication.
   - Audit trail records before-state and after-state payloads for every administrative override.
