# Principal Executive Command & Central Administration Module

## Overview
The Principal Portal provides institution-wide executive visibility, real-time KPI monitoring, department comparison drill-down, emergency administrative override logging, and system health status tracking over the authoritative database models.

---

## 1. Key API Endpoints

### `GET /api/principal/dashboard`
- **Authorization**: `SUPER_ADMIN`
- **Description**: Returns live, un-mocked institution KPIs aggregated across active/inactive students, faculty/staff counts, today's attendance rates, low-attendance alerts, pending approval queues, campus visitors, fee collections/dues, and communication failure alerts.

### `GET /api/principal/executive-summary`
- **Authorization**: `SUPER_ADMIN`
- **Description**: Categorized executive summary across Academic, Staff, Finance, Operations, and Communication.

### `GET /api/principal/departments-overview`
- **Authorization**: `SUPER_ADMIN`
- **Description**: Comparative department performance matrix showing code, name, HOD name, faculty count, student strength, and class count.

### `GET /api/principal/global-search`
- **Authorization**: `SUPER_ADMIN`
- **Query Param**: `q` (string)
- **Description**: Searches Students, Faculty, Staff, Vehicles, and Notices simultaneously.

### `POST /api/principal/override-log`
- **Authorization**: `SUPER_ADMIN`
- **Description**: Records emergency administrative override actions into the immutable audit trail.

### `GET /api/principal/system-health`
- **Authorization**: `SUPER_ADMIN`
- **Description**: Returns real-time database connection status, Meta WhatsApp configuration status, and background worker queue metrics.
