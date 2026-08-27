# Production School Management System — Technical Architecture

## 1. System Overview

The **St. Lawrence Academy Institutional Management System** is a real, production-ready, multi-tenant capable academic governance platform. It is engineered with strict adherence to enterprise architecture standards:
- **Zero Mock Backend**: Every action is backed by real relational database transactions.
- **Role-Based and Permission-Based Access Control (RBAC & PBAC)**: Dual-layer server-side authorization ensuring granular least-privilege access.
- **Account Security & Rate Limiting**: Account lockout protection against brute-force attacks, token rotation, and tamper-resistant password hashing.
- **Department-Scoped Authorization**: Strict multi-department isolation for HODs and faculty.
- **Immutable Audit Logging**: Every critical administrative and operational change is permanently recorded in the audit trail.

---

## 2. Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 React SPA Client Layer                      │
│     (Desktop / Tablet / Mobile Responsive UI Shells)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / REST (JSON)
┌──────────────────────────────▼──────────────────────────────┐
│                    API Gateway & Security                   │
│   Rate Limiting • Helmet Headers • CORS • JWT Verification  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                Controller & Validation Layer                │
│     Zod Request Parsing • Envelope Response Formatter       │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Business Services Layer                  │
│  AuthService • RegistrationService • UserService • Academic  │
│          AttendanceService • AuditService • Settings        │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                   Prisma ORM & Data Layer                   │
│      Normalized Relational Tables • Migrations • SQLite/PG  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. High-Level Modules

| Module | Purpose | Key Capabilities |
| :--- | :--- | :--- |
| **Authentication & IAM** | Identity lifecycle & sessions | Login, Registration, Token Rotation, Lockout Guard, Password Policies |
| **Registrations & Approvals** | Multi-tier identity verification | Public applications, Principal & Office approval queues, Rejection audit |
| **User & Role Governance** | User directory & RBAC/PBAC | Role assignment, Status management (Active/Locked/Suspended), Granular permissions |
| **Academic Structure** | Departments & Class batches | Department management, HOD assignment, Academic years, Classes, Sections |
| **Student Admissions** | Student & Guardian records | Admission numbering, Section allocation, Guardian emergency contacts |
| **Attendance Foundation** | Campus check-in / check-out | Biometric/Kiosk/Web punches, Late arrival calculation, Correction approval flows |
| **Audit & Security Ledger** | Regulatory compliance & logging | Actor, action, entity, IP address, state diffs, error tracking |
| **System Configuration** | Global institution policies | Dynamic thresholds for grace periods, max login attempts, active cycle |

---

## 4. Scalability & Future Roadmap

- **Phase 2 Modular Expansion**:
  - Full Timetable & Scheduling engine
  - Examination & Grading system
  - Financial Ledger & Fee Collection Gateway (Stripe/Razorpay)
  - Biometric Kiosk Face Recognition hardware integration
  - WhatsApp & SMS automated notification sidecars
  - Parent / Guardian Portal activation (schema already pre-wired)
