# Phase 17 Guide: Institutional Intelligence, Advanced Workflows, Compliance & Operations

## Overview
Phase 17 completes the institutional governance, intelligence, multi-tier workflows, asset management, and operations layer for the School/College Management System. It transitions the system into an enterprise-grade platform supporting complete student and staff lifecycles, SLA tracking, compliance verification, and human-in-the-loop operational AI.

---

## Key Modules & Endpoints

### 1. Workflow & Delegation Engine (`/api/workflows`)
- **Multi-Level Delegations**: Allows authorized users (Super Admin, HODs, Faculty) to temporarily delegate approval authority for specific scopes (`ALL`, `LEAVE`, `MARKS`, `ADMISSION`) during leaves or sabbaticals.
- **SLA Policy Engine**: Configures target hours and reminder thresholds per workflow type (`USER_APPROVAL`, `GENERIC_APPROVAL`, `STUDENT_EXIT`, `STAFF_HANDOVER`).
- **SLA Backlog Tracker**: Audits pending items and classifies them into `ON_TRACK`, `WARNING`, and `OVERDUE` states with automated escalation routing.

### 2. Centralized Institutional Calendar (`/api/calendar`)
- **Academic & Operational Events**: Categorized scheduling for terms, examinations, sports, cultural activities, and official holidays.
- **Attendance Enforcement**: Verifies holiday status to block student/staff check-ins on official non-working days.
- **Event Registrations & Attendance**: Capacity management, registration tracking, and attendance verification.

### 3. Parent-Teacher Meetings (`/api/ptm`)
- **Faculty Availability Publishing**: Automated generation of time slots with custom duration (e.g. 15 mins).
- **Guardian Booking Portal**: Conflict-free booking engine preventing duplicate or overlapping bookings.
- **Confidential Meeting Remarks**: Two-tier note logging (public discussion summary + private pedagogical observations).

### 4. Student & Staff Lifecycle Transitions (`/api/lifecycle`)
- **Student Clearance Engine**: Multi-department exit checklists (Finance dues, Library clearance, Asset returns, TC verification, ID surrender).
- **Alumni Registry**: Archiving graduating student profiles with program, year, and career records.
- **Staff Handover Engine**: Automatic discovery of active classes, timetable allocations, pending marks, and issued assets before exit sign-off.

### 5. Asset & Consumable Inventory (`/api/assets`)
- **Fixed Asset Tracking**: Categorized equipment registry (`IT_EQUIPMENT`, `LAB_EQUIPMENT`, `FURNITURE`, `AV_EQUIPMENT`) with assignment histories and maintenance logs.
- **Consumable Stock Management**: Inventory item cataloging, stock in/out transaction logging, and automated low-stock warnings.

### 6. Compliance, Versioned Policies & Grievances (`/api/grievances`)
- **Versioned Policy Repository**: Immutable policy versioning with `@@unique([policyCode, version])` and user acknowledgement tracking.
- **Compliance Checklists**: Recurring compliance tasks (Backups, Security audits, Fire safety, GDPR data privacy).
- **Tiered Grievance Management**: Privacy levels (`NORMAL`, `RESTRICTED`, `CONFIDENTIAL`) with optional anonymous submission.
- **Course Feedback Analytics**: Multi-criteria star rating aggregation and satisfaction percentage calculations.

### 7. Operations Intelligence Hub (`/api/intelligence`)
- **Daily Executive Briefing**: Real-time aggregation of active students, faculty, today's check-ins, visitors, and pending approvals.
- **Explainable Recommendations**: Rule-based operational intelligence with evidence JSON and human decision gates (Dismiss/Acknowledge).
- **Sensitive Data Correction Center**: Audited, two-phase approval workflow for correcting critical student and staff records.
- **Student & Staff 360° Profiles**: Unified historical timeline across demographics, attendance, grades, cases, fees, and assets.
