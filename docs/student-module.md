# Student Personal Academic Portal Module

## Overview
The Student Personal Academic Portal provides a personalized, un-mocked academic dashboard and self-service features for enrolled students. All data is dynamically aggregated from authoritative backend modules (Phases 1–12).

---

## 1. Key API Endpoints

### `GET /api/student/dashboard`
- **Authorization**: `STUDENT`, `SUPER_ADMIN`
- **Description**: Returns student profile details, today's class schedule, attendance %, low-attendance warnings, pending assignment counts, upcoming exam counts, latest published exam result, notice count, and unread notification count.

### `GET /api/student/timetable/:studentId`
- **Authorization**: `STUDENT` (Own studentId only)
- **Description**: Returns daily and weekly class schedule including subject, faculty, room, and time slot. Rejects cross-student access with HTTP 403 Forbidden.

### `GET /api/student/attendance/:studentId`
- **Authorization**: `STUDENT` (Own studentId only)
- **Description**: Returns detailed attendance breakdown (total, present, absent, late, excused, attendance %). Rejects access if student status is `LEFT_INSTITUTION`.

### `POST /api/student/profile-update-requests/:studentId`
- **Authorization**: `STUDENT` (Own studentId only)
- **Payload**: `{ fieldChanges: { address, emergencyContact }, reason }`
- **Description**: Submits a managed profile update request for Central Office review.

### `POST /api/student/leave-requests/:studentId`
- **Authorization**: `STUDENT` (Own studentId only)
- **Payload**: `{ startDate, endDate, reason }`
- **Description**: Submits a formal student leave request for faculty/HOD review.
