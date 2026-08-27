# Institutional Settings & Year-End Promotion Documentation

## Overview
Manages central institution profile configuration (`InstitutionSettings`), active academic year configuration, and safe batch student promotion workflows.

---

## 1. Features
- **Institutional Profile**: Configures institution name, campus address, contact details, currency symbol, date format, and minimum attendance threshold percentage.
- **Year-End Student Batch Promotion**: Batch promotes active students from `Class A` (2025-2026) to `Class B` (2026-2027) while preserving historical year enrollments, attendance, and fee history.
- **Granular Account Security**: Support for user account suspension (`/api/permissions/users/:id/suspend`), revoking active refresh tokens, and blocking login attempts.
