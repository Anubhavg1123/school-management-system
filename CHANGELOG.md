# Institutional Changelog & Release Notes

All notable changes across all 17 implementation phases are documented below.

## [v1.2.0-PROD] — Phase 17: Institutional Intelligence, Advanced Workflows, Compliance & Operations (2026-08-25)

### Added
- **Multi-Tier Workflow & Approval Delegations:** Authorized delegation of approval authority across scopes (`ALL`, `LEAVE`, `MARKS`, `ADMISSION`) with instant revocation and validity date enforcement.
- **Workflow SLA Engine:** Configurable turnaround targets and reminder thresholds per workflow type with real-time breach status auditing (`ON_TRACK`, `WARNING`, `OVERDUE`).
- **Centralized Institutional Calendar & Event Hub:** Academic, exam, and holiday scheduling with real-time holiday restriction checks blocking student and staff attendance on official non-working days.
- **Parent-Teacher Meeting (PTM) Portal:** Faculty availability slot generation, guardian booking with triple-conflict protection, and two-tier confidential meeting remark logging.
- **Student Lifecycle & Alumni Management:** Multi-department exit clearances (Finance, Library, Assets, Documents, ID surrender), status updates (`LEFT_INSTITUTION`, `GRADUATED`), and alumni profile registry.
- **Staff Lifecycle & Handover Engine:** Staff onboarding verification and automatic departure obligation scanning (classes, timetable allocations, pending marks, assigned assets).
- **Institutional Asset & Consumable Inventory:** Fixed equipment registry (`IT_EQUIPMENT`, `LAB_EQUIPMENT`, `FURNITURE`, `AV_EQUIPMENT`) with assignment histories, maintenance records, and consumable stock management with low-stock warnings.
- **Versioned Policy Repository & Compliance Checklists:** Immutable policy versioning (`@@unique([policyCode, version])`), user acknowledgements, and recurring compliance sign-offs with overdue detection.
- **Tiered Grievances & Academic Feedback Hub:** Confidentiality-tiered grievance portal (`NORMAL`, `RESTRICTED`, `CONFIDENTIAL`) with anonymous submitter protection and 5-star course satisfaction metrics.
- **Operations Intelligence & Executive Briefing:** Live verified database briefing, explainable AI recommendations with `evidenceJson`, Student 360° and Staff 360° timelines, and audited Data Correction Center.
- **Automated Integration Tests:** Added 25 tests in `phase17-institutional-intelligence.test.ts`, bringing total regression suite to **225 integration tests across 20 test files (100% passing)**.

## [v1.1.0-PROD] — Phase 16: Advanced Smart School Operations, Real-Time Services & AI Insights (2026-08-25)
- Real-Time Operational Event Streaming (SSE) via `GET /api/realtime/stream`.
- Emergency Broadcast platform with 3-tier campus status switcher.
- Safe AI & Algorithmic Explainable Insights with prompt-injection defense.
- Student Support & Case Management Hub with audit trails.
- Smart Campus & Fleet Compliance with live occupancy and document expiry tracking.
- System Diagnostics, feature flags, and PWA mobile views for Driver & Security.

## [v1.0.0-PROD] — Phase 15: Institutional Integration, Reporting & Go-Live (2026-08-25)
- Institutional Go-Live Readiness Checker (`GET /api/admin/go-live-check`).
- Data Integrity & Reconciliation Center for Fee Ledgers, Student Enrollments, and Attendance Slots.
- Unified Reporting Center with 11 real-time reports and CSV export engine.
- Bulk Data Migration & Ingestion Engine with row-level validation preview.
- Helpdesk & Support Ticket System.

## [v0.1.0 - v0.14.0] — Phases 1 to 14
- Complete core foundations: Authentication & MFA, User Approvals, Student & Guardian Management, Financials & Fees, Academic Structures & Timetable, Attendance & Bypass, Faculty Portal, HOD Portal, Non-Faculty/Fleet/Security Operations, Communication & Notice Platform, Principal Command Center, Examination & Results Engine, and Student/Parent Portals.
