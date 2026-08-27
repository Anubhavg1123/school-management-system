# Student & Institutional Academic Performance Analytics

## Overview
Provides exam-to-exam percentage trends, subject strength/weakness matrices, class performance distributions, and department pass/fail analytics over published result snapshots.

---

## 1. Key API Endpoints

### `GET /api/academic-performance/students/:studentId/trend`
- **Authorization**: `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD`, `FACULTY`, `STUDENT`, `PARENT`
- **Description**: Returns exam-to-exam progress trend, subject average matrix, strong subjects ($\ge 75\%$), and weak subjects ($< 60\%$).

### `GET /api/academic-performance/classes/:classId`
- **Authorization**: `SUPER_ADMIN`, `OFFICE_ADMIN`, `HOD`, `FACULTY`
- **Description**: Class-wide performance analytics, pass %, passed/failed count, and grade distribution.
