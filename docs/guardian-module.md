# Parent & Guardian Ward Monitoring Portal Module

## Overview
The Guardian Portal enables parents/guardians to monitor academic progress, attendance %, published results, report card downloads, fee invoices, and payment receipts for all linked children (single or multi-child families) via `GuardianStudentRelationship`.

---

## 1. Key API Endpoints

### `GET /api/guardian/children`
- **Authorization**: `PARENT`, `SUPER_ADMIN`
- **Description**: Resolves all linked wards (Student A, Student B) for the logged-in guardian account.

### `GET /api/guardian/dashboard?studentId=:studentId`
- **Authorization**: `PARENT` (Linked ward only)
- **Description**: Returns multi-ward list and active ward KPI summary (attendance %, low-attendance warnings, published results, fee totals). Defaults to primary ward if `studentId` omitted.

### `GET /api/guardian/children/:studentId/results`
- **Authorization**: `PARENT` (Linked ward only)
- **Description**: Returns published result snapshots, overall %, grade, and report card verification tokens for the linked child. Rejects unlinked student requests with HTTP 403 Forbidden.

### `GET /api/guardian/children/:studentId/fees`
- **Authorization**: `PARENT` (Linked ward only)
- **Description**: Returns fee assignments, paid amounts, outstanding balances, and payment receipts.

### `PUT /api/guardian/preferences`
- **Authorization**: `PARENT`
- **Payload**: `{ whatsAppEnabled, emailEnabled, inAppEnabled, smsEnabled }`
- **Description**: Updates delivery channel preferences for notification dispatches.
