# Phase 9 — Non-Faculty & Operational Staff Module

## 1. Overview
The Non-Faculty & Operational Staff Module provides an intentionally simple, mobile-friendly operational portal for Drivers, Security Staff, Attenders, Maintenance Personnel, and general Non-Faculty users.

## 2. Core Features
- **Mobile-Friendly UI**: High-contrast, large touch targets, simplified navigation, minimal form fields.
- **Attendance Punch Station**: Real-time staff check-in and check-out with automatic source logging (`WEB`, `ATTENDER`).
- **Attender-Assisted Entry**: Attenders can record check-in/out on behalf of staff members. Preserves audit distinction between the staff member (`userId`) and the attender (`enteredByUserId`).
- **Configurable Staff Categories**: Super Admin / Office Admin management of operational categories (`DRIVER`, `SECURITY_OFFICER`, `ATTENDER`, `MAINTENANCE`, `HOUSEKEEPING`).

## 3. Database Schema Models
- `StaffCategory`: `code`, `name`, `description`, `status`.
- `Attendance` (extended): `enteredByUserId` (FK -> `User`), `source` (`ATTENDER`).

## 4. API Endpoints
- `GET /api/non-faculty/dashboard`: Fetch staff dashboard, check-in status, assigned vehicle, recent notices.
- `GET /api/non-faculty/categories`: List operational staff categories.
- `POST /api/non-faculty/categories`: Create staff category (Admin).
- `POST /api/non-faculty/attender/attendance`: Attender-assisted check-in/out entry.
- `GET /api/non-faculty/attender/dashboard`: Attender operational dashboard, summary, and roster.

## 5. Security & Access Control
- Protected with JWT authentication.
- Restricted to `NON_FACULTY`, `SUPER_ADMIN`, `OFFICE_ADMIN`, and `HOD` roles.
- Cross-role authorization isolation enforced.
