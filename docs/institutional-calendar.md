# Institutional Academic Calendar & Events Guide

## Overview
The centralized institutional calendar acts as the single source of truth for all campus dates, terms, examinations, and official holidays.

## Holiday Enforcement on Attendance
- The endpoint `GET /api/calendar/holiday-check?date=YYYY-MM-DD` queries all events with `isHoliday: true`.
- When a date is marked as an institutional holiday, student roll-call and staff biometric check-ins are restricted to prevent invalid operational records.

## Capacity and Registration Workflows
- Events support optional capacity caps (`capacity`).
- Registrations increment `registeredCount` atomically.
- Attendance can be logged directly against registered attendees via `POST /api/calendar/registrations/:id/attendance`.
