# Phase 9 — Visitor & Campus Security Module

## 1. Overview
The Visitor & Campus Security Module provides complete gate management, visitor pass issuance, parent/guardian student linkage, overstay warnings, and vehicle entry verification.

## 2. Core Operational Workflows
- **Digital Visitor Pass Generation**: Server generates unique `passNumber` (e.g. `PASS-YYYYMMDD-XXXX`) and secure `passToken` UUID.
- **Active Campus Visitors Dashboard**: Displays currently inside visitors, calculates real-time duration, and flags `isOverstay` when duration exceeds 4 hours.
- **Parent / Guardian Linkage**: Integrated student search allowing security to link parent visitors to specific student admission records.
- **Gate Vehicle Verification**: Instant lookup against institutional fleet (`Vehicle`) and personal registered staff vehicles (`FacultyVehicleRegistration`).
- **Emergency Visitor Entry**: Supports emergency gate entries with mandatory reason logging.
- **Visitor Exit Logging**: Marks exit time, updates status to `EXITED`, prevents duplicate exit entries.

## 3. Database Schema Models
- `Visitor`: Master registry of campus visitors.
- `VisitorEntryExit`: Entry/exit log, pass token, overstay flag, emergency reason.
- `CampusVehicleLog`: Real-time campus vehicle entry and exit tracking.

## 4. REST APIs
- `POST /api/visitor-security/visitors`: Log visitor entry & issue pass.
- `POST /api/visitor-security/visitors/:passNumberOrId/exit`: Mark visitor exit.
- `GET /api/visitor-security/active-visitors`: Active campus visitors list & overstay alerts.
- `GET /api/visitor-security/students/search`: Search students for parent visitor link.
- `GET /api/visitor-security/vehicles/verify/:vehicleNumber`: Verify vehicle gate status.
- `POST /api/visitor-security/campus-vehicles`: Record standalone campus vehicle entry.
- `POST /api/visitor-security/campus-vehicles/:vehicleLogId/exit`: Mark campus vehicle exit.
- `GET /api/visitor-security/passes/:passTokenOrNumber`: Retrieve digital pass payload.
- `GET /api/visitor-security/visitors/history`: Search visitor history.
