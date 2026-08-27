# Phase 16 — Advanced Smart School Operations & Real-Time Platform

## Overview
Phase 16 enhances the production School Management System with real-time operational event streaming, campus emergency management, safe & explainable AI-assisted insights, student case triage, smart facility operations, and long-term maintainability tooling.

---

## Key Capabilities Implemented

### 1. Real-Time Operations (Server-Sent Events)
- **Endpoint:** `GET /api/realtime/stream` (Bearer JWT authenticated)
- **Event Broadcaster:** [`RealtimeService`](file:///C:/Users/ANUBHAV%20J%20GORAGUDDI/.gemini/antigravity/scratch/school-management-system/backend/src/services/realtime.service.ts)
- **Event Types:** `ATTENDANCE_SUBMITTED`, `NOTICE_PUBLISHED`, `EMERGENCY_ALERT`, `PAYMENT_RECEIVED`, `RESULT_PUBLISHED`, `VISITOR_ENTERED`, `CAMPUS_STATUS_CHANGED`.
- **Target Filtering:** Broadcasts can be scoped by `userIds`, `roles`, or `departmentId` without full-page reloads.

### 2. Emergency Broadcast & Campus Safety
- **Endpoint:** `POST /api/emergency/alerts`, `POST /api/emergency/campus-status`
- **Model:** `EmergencyAlert`, `CampusStatusLog`
- **UI:** Persistent [`EmergencyBanner`](file:///C:/Users/ANUBHAV%20J%20GORAGUDDI/.gemini/antigravity/scratch/school-management-system/frontend/src/components/emergency/EmergencyBanner.tsx) across all portals; [`EmergencyBroadcastPage`](file:///C:/Users/ANUBHAV%20J%20GORAGUDDI/.gemini/antigravity/scratch/school-management-system/frontend/src/pages/principal/EmergencyBroadcastPage.tsx) for Principal/Security dispatch.
- **Workflow:** Create -> Multi-channel dispatch (`IN_APP`, `WHATSAPP`, `EMAIL`) -> Live banner display -> Administrative cancellation audit.

### 3. Safe AI & Algorithmic Explainable Insights
- **Endpoint:** `POST /api/ai/query`, `GET /api/ai/insights/administrative`, `POST /api/ai/draft-notice`
- **Security:** Strict RBAC scoping, prompt injection sanitization (`SECURITY_PROMPT_INJECTION_REJECTED`), read-only execution, and privacy redaction.
- **Explainability:** All institutional alerts display explicit `calculationRule`, `dataSource`, and mathematical metrics.
- **Human-in-the-Loop:** AI drafting requires explicit staff review and approval before publication.

### 4. Student Support & Case Management
- **Endpoint:** `POST /api/cases`, `GET /api/cases`, `PATCH /api/cases/:id/status`, `POST /api/cases/:id/actions`
- **Model:** `StudentCase`, `StudentCaseAction`
- **Lifecycle:** `CREATED` -> `ASSIGNED` -> `UNDER_REVIEW` -> `ACTION_REQUIRED` -> `RESOLVED` -> `CLOSED`.
- **RBAC:** Students see own cases; faculty see assigned cases; Principal/HOD see full department/institution cases.

### 5. Smart Campus & Fleet Compliance
- **Visitor Pre-Registration:** Staff can pre-register guests (`POST /api/campus/pre-register-visitor`); security officers can execute fast-track gate intake.
- **Live Occupancy:** Real-time counters for visitors inside, fleet vehicles inside, staff attendance, and emergency alerts.
- **Vehicle Document Expiry:** Automated alerts for vehicle insurance and fitness certificate renewals (< 30 days remaining).

### 6. System Diagnostics & Automated Quality Checks
- **Subsystem Probes:** Database latency, Node.js V8 heap memory, backup freshness, and notification provider readiness (`GET /api/diagnostics/system-check`).
- **Data Quality Auditor:** Automatically identifies unassigned students, missing primary guardians, and missing class coordinators.
- **Webhook Ingestion:** Idempotent webhook receiver with signature validation and duplicate event rejection.

### 7. Feature Flags & Configuration Versioning
- **Endpoint:** `GET /api/features`, `PATCH /api/features/:key`, `GET /api/features/config-history`
- **Model:** `FeatureFlag`, `ConfigAuditLog`
- **Controlled Modules:** `ONLINE_PAYMENTS`, `WHATSAPP_NOTIFICATIONS`, `AI_INSIGHTS`, `EMERGENCY_BROADCASTS`, `PWA_OFFLINE`, `VISITOR_PRE_REGISTRATION`.
