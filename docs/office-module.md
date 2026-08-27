# Central Office Administration Module

## Overview
The Central Office Administration Portal manages Student Master Catalog records, admission intake, parent contact verification, student status transitions (`ACTIVE` $\rightarrow$ `LEFT_INSTITUTION`), fee collection, payment verification, and official receipt issuance.

---

## 1. Key API Endpoints

### `GET /api/office/dashboard`
- **Authorization**: `SUPER_ADMIN`, `OFFICE_ADMIN`
- **Description**: Returns Office Dashboard KPIs (student counts, pending admissions, fee dues/collections).

### `POST /api/office/students/master`
- **Authorization**: `SUPER_ADMIN`, `OFFICE_ADMIN`
- **Payload**: `{ firstName, lastName, email, guardianName, guardianRelationship, guardianWhatsAppNumber, sectionId }`
- **Constraint**: Parent/Guardian WhatsApp number is mandatory (`MANDATORY_PARENT_WHATSAPP_REQUIRED`).

### `PATCH /api/office/students/:id/status`
- **Authorization**: `SUPER_ADMIN`, `OFFICE_ADMIN`
- **Payload**: `{ status: 'LEFT_INSTITUTION' | 'SUSPENDED' | 'ACTIVE', reason }`
- **Description**: Transitioning status halts future attendance marking and exam participation without deleting historical attendance, fee, or payment data.

### `POST /api/office/finance/payment`
- **Authorization**: `SUPER_ADMIN`, `OFFICE_ADMIN`
- **Payload**: `{ studentId, studentFeeAssignmentId, amount, paymentMethod, transactionRef }`
- **Description**: Server-side payment verification, student fee status update, and official receipt generation (`RCP-xxxx`).
